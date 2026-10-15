import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, alterarStatus } from '../../src/feature/machine/machineController.js';
import { listarMaquinas, obterMaquina } from '../../src/feature/machine/machineService.js';
import { aplicarStatus } from '../../src/feature/machine/statusService.js';
import machineRouter from '../../src/feature/machine/machineRouter.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/machine/machineService.js', () => ({ listarMaquinas: vi.fn(), obterMaquina: vi.fn() }));
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
