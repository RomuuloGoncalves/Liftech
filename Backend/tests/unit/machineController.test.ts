import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, alterarStatus, travar, mover, criar, atualizar, deletar } from '../../src/feature/machine/machineController.js';
import { atualizarMaquina, criarMaquina, definirTrava, excluirMaquina, listarMaquinas, moverParaCategoria, obterMaquina } from '../../src/feature/machine/machineService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import { aplicarStatus } from '../../src/feature/machine/statusService.js';
import machineRouter from '../../src/feature/machine/machineRouter.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/machine/machineService.js', () => ({ listarMaquinas: vi.fn(), obterMaquina: vi.fn(), definirTrava: vi.fn(), moverParaCategoria: vi.fn(), criarMaquina: vi.fn(), atualizarMaquina: vi.fn(), excluirMaquina: vi.fn() }));
vi.mock('../../src/feature/machine/statusService.js', async (original) => ({ ...(await original<any>()), aplicarStatus: vi.fn() }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: {} }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: {} }));
vi.mock('../../src/schemas/category.js', () => ({ Category: {} }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const ESCOPO: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [{ _id: '665f1c2b9a1e4b00123456b1', nome: 'Matriz', matriz: true }] };
const req = (query: object = {}) => ({ escopo: ESCOPO, query }) as unknown as Request;

describe('machineController.listar', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
    });

    test('200 com o array devolvido pelo service', async () => {
        const maquinas = [{ id: 'f1', identificacao: 'EMP-081' }, { id: 'f2', identificacao: 'EMP-082' }];
        vi.mocked(listarMaquinas).mockResolvedValue(maquinas as any);

        await listar(req(), res);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(maquinas);
        expect(listarMaquinas).toHaveBeenCalledWith(ESCOPO, undefined);
    });

    test('passa o filialId da query ao service junto com o escopo', async () => {
        vi.mocked(listarMaquinas).mockResolvedValue([]);

        await listar(req({ filialId: '665f1c2b9a1e4b00123456b1' }), res);

        expect(listarMaquinas).toHaveBeenCalledWith(ESCOPO, '665f1c2b9a1e4b00123456b1');
        expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test.each([
        ['que não é ObjectId', 'abc'],
        ['vazio', ''],
        ['repetido na query', ['665f1c2b9a1e4b00123456b1', '665f1c2b9a1e4b00123456b2']],
    ])('400 com filialId %s, sem chamar o service', async (_caso, filialId) => {
        await listar(req({ filialId }), res);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson.mock.calls[0]![0]).toHaveProperty('error');
        expect(listarMaquinas).not.toHaveBeenCalled();
    });

    test('500 com { error: mensagem } quando o service lança', async () => {
        vi.mocked(listarMaquinas).mockRejectedValue(new Error('falha de conexão'));

        await listar(req(), res);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'falha de conexão' });
    });
});

describe('machineRouter', () => {
    test('expõe GET / ligado ao controller listar', () => {
        const layer = (machineRouter as any).stack.find((l: any) => l.route?.path === '/');

        expect(layer.route.methods).toEqual({ get: true });
        expect(layer.route.stack[0].handle).toBe(listar);
    });
});

const ID = '665f1c2b9a1e4b00123456f1';
const MAQUINA = { id: ID, identificacao: 'EMP-081', status: 'manutencao' };

function resposta() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    return { res: { status, json } as unknown as Response, status, json };
}
const reqPut = (id: string, body: unknown) => ({ escopo: ESCOPO, params: { id }, body }) as unknown as Request;

describe('machineController.alterarStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(obterMaquina).mockResolvedValue(MAQUINA as any);
    });

    test('200 com a máquina depois de aplicar o status', async () => {
        const { res, status, json } = resposta();

        await alterarStatus(reqPut(ID, { status: 'manutencao' }), res);

        expect(aplicarStatus).toHaveBeenCalledWith(ID, 'manutencao');
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(MAQUINA);
    });

    test.each([['Manutenção'], ['acidente'], [undefined], [1]])('400 com status %s, sem gravar', async (valor) => {
        const { res, status } = resposta();

        await alterarStatus(reqPut(ID, { status: valor }), res);

        expect(status).toHaveBeenCalledWith(400);
        expect(aplicarStatus).not.toHaveBeenCalled();
    });

    test('400 com id inválido', async () => {
        const { res, status } = resposta();
        await alterarStatus(reqPut('abc', { status: 'alerta' }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(aplicarStatus).not.toHaveBeenCalled();
    });

    test('400 com chave $ no corpo', async () => {
        const { res, status } = resposta();
        await alterarStatus(reqPut(ID, { status: 'alerta', $set: {} }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(aplicarStatus).not.toHaveBeenCalled();
    });

    test('404 fora do escopo, sem gravar', async () => {
        const { ErroHttp } = await import('../../src/utils/responseHandler.js');
        vi.mocked(obterMaquina).mockRejectedValue(new ErroHttp(404, 'Máquina não encontrada.'));
        const { res, status, json } = resposta();

        await alterarStatus(reqPut(ID, { status: 'alerta' }), res);

        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: 'Máquina não encontrada.' });
        expect(aplicarStatus).not.toHaveBeenCalled();
    });

    test('rota PUT /:id/status ligada ao controller', () => {
        const layer = (machineRouter as any).stack.find((l: any) => l.route?.path === '/:id/status');
        expect(layer.route.methods).toEqual({ put: true });
        expect(layer.route.stack[0].handle).toBe(alterarStatus);
    });
});

describe('machineController.travar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(definirTrava).mockResolvedValue({ ...MAQUINA, categoriaTravada: true } as any);
    });

    test.each([true, false])('200 gravando categoriaTravada %s', async (valor) => {
        const { res, status, json } = resposta();

        await travar(reqPut(ID, { categoriaTravada: valor }), res);

        expect(definirTrava).toHaveBeenCalledWith(ESCOPO, ID, valor);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ ...MAQUINA, categoriaTravada: true });
    });

    test.each([['true'], [1], [undefined]])('400 com categoriaTravada %s', async (valor) => {
        const { res, status } = resposta();
        await travar(reqPut(ID, { categoriaTravada: valor }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(definirTrava).not.toHaveBeenCalled();
    });

    test('404 fora do escopo', async () => {
        const { ErroHttp } = await import('../../src/utils/responseHandler.js');
        vi.mocked(definirTrava).mockRejectedValue(new ErroHttp(404, 'Máquina não encontrada.'));
        const { res, status } = resposta();
        await travar(reqPut(ID, { categoriaTravada: true }), res);
        expect(status).toHaveBeenCalledWith(404);
    });

    test('rota PUT /:id/trava ligada ao controller', () => {
        const layer = (machineRouter as any).stack.find((l: any) => l.route?.path === '/:id/trava');
        expect(layer.route.methods).toEqual({ put: true });
        expect(layer.route.stack[0].handle).toBe(travar);
    });
});

describe('machineController.mover', () => {
    const CATEGORIA = '665f1c2b9a1e4b00123456c1';
    const reqMover = (body: unknown) => ({ escopo: ESCOPO, params: {}, body }) as unknown as Request;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(moverParaCategoria).mockResolvedValue([MAQUINA] as any);
    });

    test('200 com as máquinas movidas', async () => {
        const { res, status, json } = resposta();

        await mover(reqMover({ machineIds: [ID], categoriaId: CATEGORIA }), res);

        expect(moverParaCategoria).toHaveBeenCalledWith(ESCOPO, [ID], CATEGORIA);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([MAQUINA]);
    });

    test('categoriaId null é aceito', async () => {
        const { res, status } = resposta();
        await mover(reqMover({ machineIds: [ID], categoriaId: null }), res);
        expect(moverParaCategoria).toHaveBeenCalledWith(ESCOPO, [ID], null);
        expect(status).toHaveBeenCalledWith(200);
    });

    test.each([
        ['lista vazia', { machineIds: [], categoriaId: null }],
        ['não lista', { machineIds: ID, categoriaId: null }],
        ['id inválida', { machineIds: [ID, 'abc'], categoriaId: null }],
        ['categoriaId inválida', { machineIds: [ID], categoriaId: 'abc' }],
        ['categoriaId ausente', { machineIds: [ID] }],
        ['chave $', { machineIds: [ID], categoriaId: null, $set: {} }],
    ])('400 com %s, sem gravar', async (_caso, body) => {
        const { res, status } = resposta();
        await mover(reqMover(body), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(moverParaCategoria).not.toHaveBeenCalled();
    });

    test('404 do serviço é repassado', async () => {
        const { ErroHttp } = await import('../../src/utils/responseHandler.js');
        vi.mocked(moverParaCategoria).mockRejectedValue(new ErroHttp(404, 'Categoria não encontrada.'));
        const { res, status, json } = resposta();
        await mover(reqMover({ machineIds: [ID], categoriaId: CATEGORIA }), res);
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: 'Categoria não encontrada.' });
    });

    test('rota PUT /categoria ligada ao controller', () => {
        const layer = (machineRouter as any).stack.find((l: any) => l.route?.path === '/categoria');
        expect(layer.route.methods).toEqual({ put: true });
        expect(layer.route.stack[0].handle).toBe(mover);
    });
});

const rota = (path: string, metodo: string) =>
    (machineRouter as any).stack.findIndex((l: any) => l.route?.path === path && l.route.methods[metodo]);

describe('machineController.criar', () => {
    const FILIAL = '665f1c2b9a1e4b00123456b1';
    const valido = { nome: 'Titan-X', identificacao: 'EMP-200', enderecoMac: 'AA:BB:CC:DD:EE' };
    const reqPost = (body: unknown, escopo: Escopo = ESCOPO) => ({ escopo, body }) as unknown as Request;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(criarMaquina).mockResolvedValue(MAQUINA as any);
    });

    test('201 com a máquina; filial única do escopo quando o corpo não traz filialId', async () => {
        const { res, status, json } = resposta();

        await criar(reqPost({ ...valido, setor: 'Doca 1', nomeDispositivo: 'Sensor 01' }), res);

        expect(criarMaquina).toHaveBeenCalledWith(ESCOPO, { ...valido, setor: 'Doca 1', nomeDispositivo: 'Sensor 01', filialId: FILIAL });
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith(MAQUINA);
    });

    test('usa o filialId do corpo quando está no escopo', async () => {
        const OUTRA = '665f1c2b9a1e4b00123456b2';
        const escopo: Escopo = { empresaId: 'e1', tipo: 'empresa', filiais: [{ _id: FILIAL, nome: 'Matriz', matriz: true }, { _id: OUTRA, nome: 'Norte', matriz: false }] };
        const { res, status } = resposta();

        await criar(reqPost({ ...valido, filialId: OUTRA }, escopo), res);

        expect(criarMaquina).toHaveBeenCalledWith(escopo, { ...valido, filialId: OUTRA });
        expect(status).toHaveBeenCalledWith(201);
    });

    test('filialId fora do escopo: erro do resolverFilial (403) sem criar', async () => {
        const { res, status } = resposta();
        await criar(reqPost({ ...valido, filialId: '665f1c2b9a1e4b00123456b9' }), res);
        expect(status).toHaveBeenCalledWith(403);
        expect(criarMaquina).not.toHaveBeenCalled();
    });

    test.each([
        ['nome ausente', { identificacao: 'EMP-200', enderecoMac: 'AA:BB' }],
        ['nome vazio', { ...valido, nome: '   ' }],
        ['identificacao ausente', { nome: 'Titan-X', enderecoMac: 'AA:BB' }],
        ['identificacao vazia', { ...valido, identificacao: '' }],
        ['enderecoMac ausente', { nome: 'Titan-X', identificacao: 'EMP-200' }],
        ['enderecoMac vazio', { ...valido, enderecoMac: '  ' }],
        ['enderecoMac com mais de 32 caracteres', { ...valido, enderecoMac: 'A'.repeat(33) }],
        ['nome não texto', { ...valido, nome: 5 }],
        ['setor não texto', { ...valido, setor: 1 }],
    ])('400 com %s, sem gravar', async (_caso, body) => {
        const { res, status, json } = resposta();

        await criar(reqPost(body), res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json.mock.calls[0]![0]).toHaveProperty('error');
        expect(criarMaquina).not.toHaveBeenCalled();
    });

    test('400 com chave $ no corpo', async () => {
        const { res, status } = resposta();
        await criar(reqPost({ ...valido, $where: '1' }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(criarMaquina).not.toHaveBeenCalled();
    });

    test('409 do service é repassado', async () => {
        vi.mocked(criarMaquina).mockRejectedValue(new ErroHttp(409, 'Já existe um dispositivo com este endereço MAC.'));
        const { res, status, json } = resposta();

        await criar(reqPost(valido), res);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({ error: 'Já existe um dispositivo com este endereço MAC.' });
    });

    test('rota POST / ligada ao controller', () => {
        const i = rota('/', 'post');
        expect(i).toBeGreaterThanOrEqual(0);
        expect((machineRouter as any).stack[i].route.stack[0].handle).toBe(criar);
    });
});

describe('machineController.atualizar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(atualizarMaquina).mockResolvedValue(MAQUINA as any);
    });

    test('200 com a máquina; repassa só os campos livres', async () => {
        const { res, status, json } = resposta();
        const corpo = { nome: 'Titan-Y', identificacao: 'EMP-300', setor: 'Doca 2', nomeDispositivo: 'Sensor 02', enderecoMac: 'AA:BB' };

        await atualizar(reqPut(ID, corpo), res);

        expect(atualizarMaquina).toHaveBeenCalledWith(ESCOPO, ID, corpo);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(MAQUINA);
    });

    test('campo ausente não vai ao service', async () => {
        const { res } = resposta();
        await atualizar(reqPut(ID, { setor: 'Doca 3' }), res);
        expect(atualizarMaquina).toHaveBeenCalledWith(ESCOPO, ID, { setor: 'Doca 3' });
    });

    test.each(['status', 'categoriaId', 'categoriaTravada', 'operadorConectadoId', 'sessaoIniciadaEm', 'filialId', 'dispositivoConectadoId', 'qualquer'])(
        '400 com o campo %s, sem gravar',
        async (campo) => {
            const { res, status, json } = resposta();

            await atualizar(reqPut(ID, { nome: 'Titan-Y', [campo]: 'x' }), res);

            expect(status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ error: `O campo '${campo}' não pode ser alterado por esta rota.` });
            expect(atualizarMaquina).not.toHaveBeenCalled();
        },
    );

    test.each([
        ['nome vazio', { nome: ' ' }],
        ['identificacao vazia', { identificacao: '' }],
        ['enderecoMac vazio', { enderecoMac: '' }],
    ])('400 com %s', async (_caso, body) => {
        const { res, status } = resposta();
        await atualizar(reqPut(ID, body), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(atualizarMaquina).not.toHaveBeenCalled();
    });

    test('400 com id inválido', async () => {
        const { res, status, json } = resposta();
        await atualizar(reqPut('abc', { nome: 'Titan-Y' }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: 'O ID fornecido não é um ObjectId válido do MongoDB.' });
        expect(atualizarMaquina).not.toHaveBeenCalled();
    });

    test('400 com chave $ no corpo', async () => {
        const { res, status, json } = resposta();
        await atualizar(reqPut(ID, { $set: { status: 'alerta' } }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: "O campo '$set' não é permitido." });
        expect(atualizarMaquina).not.toHaveBeenCalled();
    });

    test.each([
        [404, 'Máquina não encontrada.'],
        [409, 'Já existe uma empilhadeira com a identificação "EMP-300".'],
    ])('%s do service é repassado', async (codigo, mensagem) => {
        vi.mocked(atualizarMaquina).mockRejectedValue(new ErroHttp(codigo, mensagem));
        const { res, status, json } = resposta();

        await atualizar(reqPut(ID, { identificacao: 'EMP-300' }), res);

        expect(status).toHaveBeenCalledWith(codigo);
        expect(json).toHaveBeenCalledWith({ error: mensagem });
    });

    test('rota PUT /:id ligada ao controller, depois de /categoria, /:id/status e /:id/trava', () => {
        const i = rota('/:id', 'put');
        expect(i).toBeGreaterThan(rota('/categoria', 'put'));
        expect(i).toBeGreaterThan(rota('/:id/status', 'put'));
        expect(i).toBeGreaterThan(rota('/:id/trava', 'put'));
        expect((machineRouter as any).stack[i].route.stack[0].handle).toBe(atualizar);
    });
});

describe('machineController.deletar', () => {
    beforeEach(() => vi.clearAllMocks());

    test('200 com { _id, message }', async () => {
        const resultado = { _id: ID, message: 'Máquina excluída com sucesso.' };
        vi.mocked(excluirMaquina).mockResolvedValue(resultado);
        const { res, status, json } = resposta();

        await deletar(reqPut(ID, undefined), res);

        expect(excluirMaquina).toHaveBeenCalledWith(ESCOPO, ID);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(resultado);
    });

    test('400 com id inválido', async () => {
        const { res, status } = resposta();
        await deletar(reqPut('abc', undefined), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(excluirMaquina).not.toHaveBeenCalled();
    });

    test.each([
        [404, 'Máquina não encontrada.'],
        [409, 'Máquina com sessão aberta.'],
    ])('%s do service é repassado', async (codigo, mensagem) => {
        vi.mocked(excluirMaquina).mockRejectedValue(new ErroHttp(codigo, mensagem));
        const { res, status, json } = resposta();

        await deletar(reqPut(ID, undefined), res);

        expect(status).toHaveBeenCalledWith(codigo);
        expect(json).toHaveBeenCalledWith({ error: mensagem });
    });

    test('rota DELETE /:id ligada ao controller', () => {
        const i = rota('/:id', 'delete');
        expect(i).toBeGreaterThanOrEqual(0);
        expect((machineRouter as any).stack[i].route.stack[0].handle).toBe(deletar);
    });
});
