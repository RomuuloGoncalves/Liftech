import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, criar, atualizar, deletar, criarLogin, atualizarLogin, removerLogin } from '../../src/feature/operator/operatorController.js';
import operatorRouter from '../../src/feature/operator/operatorRouter.js';
import * as servico from '../../src/feature/operator/operatorService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/operator/operatorService.js', () => ({
    listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn(),
    criarLogin: vi.fn(), atualizarLogin: vi.fn(), removerLogin: vi.fn(),
}));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const ID = '665f1c2b9a1e4b0012345678';
const FILIAL = '665f1c2b9a1e4b00123456b1';
const ESCOPO: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [{ _id: FILIAL, nome: 'Matriz', matriz: true }] };
const ADMIN = { _id: 'u1', role: 'admin', operadorId: null };
const COLABORADOR = { _id: 'u2', role: 'colaborador', operadorId: 'o1' };
const OPERADOR = { id: ID, matricula: 'EMP-001', nome: 'Ana', usuario: null, acesso: 'Negado' };
const SO_ADMIN = 'Apenas administradores podem gerenciar a equipe.';

const req = (extra: object = {}, usuario: object = ADMIN) =>
    ({ escopo: ESCOPO, usuario, params: {}, query: {}, body: {}, ...extra }) as unknown as Request;

let json: ReturnType<typeof vi.fn>;
let status: ReturnType<typeof vi.fn>;
let res: Response;

beforeEach(() => {
    vi.clearAllMocks();
    json = vi.fn();
    status = vi.fn().mockReturnValue({ json });
    res = { status, json } as unknown as Response;
    for (const f of ['listar', 'criar', 'atualizar', 'excluir', 'criarLogin', 'atualizarLogin', 'removerLogin'] as const) {
        vi.mocked(servico[f]).mockResolvedValue(OPERADOR as any);
    }
});

const naoChamouServico = () => {
    for (const f of ['listar', 'criar', 'atualizar', 'excluir', 'criarLogin', 'atualizarLogin', 'removerLogin'] as const) {
        expect(servico[f]).not.toHaveBeenCalled();
    }
};

describe('operatorController: só admin', () => {
    test.each([
        ['listar', listar, {}],
        ['criar', criar, { body: { nome: 'Ana' } }],
        ['atualizar', atualizar, { params: { id: ID }, body: { nome: 'Ana' } }],
        ['deletar', deletar, { params: { id: ID } }],
        ['criarLogin', criarLogin, { params: { id: ID }, body: { usuario: 'ana', senha: 'segredo123' } }],
        ['atualizarLogin', atualizarLogin, { params: { id: ID }, body: { acessoNegado: true } }],
        ['removerLogin', removerLogin, { params: { id: ID } }],
    ])('%s com colaborador: 403 sem chamar o serviço', async (_nome, handler, extra) => {
        await (handler as any)(req(extra, COLABORADOR), res);

        expect(status).toHaveBeenCalledWith(403);
        expect(json).toHaveBeenCalledWith({ error: SO_ADMIN });
        naoChamouServico();
    });
});

describe('operatorController.listar', () => {
    test('200 com a lista; repassa o filialId da query', async () => {
        vi.mocked(servico.listar).mockResolvedValue([OPERADOR] as any);

        await listar(req({ query: { filialId: FILIAL } }), res);

        expect(servico.listar).toHaveBeenCalledWith(ESCOPO, FILIAL);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([OPERADOR]);
    });

    test('filialId inválido na query: 400', async () => {
        await listar(req({ query: { filialId: 'abc' } }), res);

        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });
});

describe('operatorController.criar', () => {
    test('201 com o operador; texto cortado nas pontas e filial do escopo', async () => {
        const body = { nome: '  Ana Souza ', telefone: ' (11) 9 ', cargo: 'Op', horarioEntrada: '08:00', horarioSaida: '' };

        await criar(req({ body }), res);

        expect(servico.criar).toHaveBeenCalledWith(ESCOPO, {
            nome: 'Ana Souza', telefone: '(11) 9', cargo: 'Op', horarioEntrada: '08:00', horarioSaida: '', filialId: FILIAL,
        });
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith(OPERADOR);
    });

    test('com usuario e senha repassa o login ao serviço', async () => {
        await criar(req({ body: { nome: 'Ana', usuario: 'ana.souza', senha: '12345678' } }), res);

        expect(servico.criar).toHaveBeenCalledWith(ESCOPO, expect.objectContaining({ login: { usuario: 'ana.souza', senha: '12345678' } }));
        expect(status).toHaveBeenCalledWith(201);
    });

    test.each([
        ['usuario sem senha', { nome: 'Ana', usuario: 'ana' }],
        ['senha sem usuario', { nome: 'Ana', senha: '12345678' }],
        ['usuario com espaço', { nome: 'Ana', usuario: 'a b', senha: '12345678' }],
        ['senha curta', { nome: 'Ana', usuario: 'ana', senha: '123' }],
    ])('400 com %s, sem gravar', async (_caso, body) => {
        await criar(req({ body }), res);

        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });

    test.each([
        ['nome ausente', {}],
        ['nome vazio', { nome: '   ' }],
        ['nome com mais de 80 caracteres', { nome: 'A'.repeat(81) }],
        ['nome não texto', { nome: 5 }],
        ['telefone com mais de 40 caracteres', { nome: 'Ana', telefone: '1'.repeat(41) }],
        ['cargo não texto', { nome: 'Ana', cargo: 3 }],
        ['horarioEntrada fora de HH:mm', { nome: 'Ana', horarioEntrada: '8:00' }],
        ['horarioSaida 24:00', { nome: 'Ana', horarioSaida: '24:00' }],
        ['horarioSaida com minuto 60', { nome: 'Ana', horarioSaida: '17:60' }],
        ['chave $', { nome: 'Ana', $where: '1' }],
        ['filialId inválido', { nome: 'Ana', filialId: 'abc' }],
    ])('400 com %s, sem gravar', async (_caso, body) => {
        await criar(req({ body }), res);

        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });
});

describe('operatorController.atualizar', () => {
    test('200 com o operador; repassa só os campos enviados', async () => {
        await atualizar(req({ params: { id: ID }, body: { cargo: ' Líder ', horarioEntrada: '23:59' } }), res);

        expect(servico.atualizar).toHaveBeenCalledWith(ESCOPO, ID, { cargo: 'Líder', horarioEntrada: '23:59' });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(OPERADOR);
    });

    test.each([['matricula'], ['filialId'], ['usuario']])('campo %s: 400 com o nome do campo, sem gravar', async (campo) => {
        await atualizar(req({ params: { id: ID }, body: { nome: 'Ana', [campo]: 'x' } }), res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: `O campo '${campo}' não pode ser alterado.` });
        naoChamouServico();
    });

    test.each([
        ['nome vazio', { nome: '' }],
        ['horário fora de HH:mm', { horarioSaida: '5pm' }],
        ['chave $', { $set: { nome: 'x' } }],
    ])('400 com %s', async (_caso, body) => {
        await atualizar(req({ params: { id: ID }, body }), res);

        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });

    test('404 do service é repassado', async () => {
        vi.mocked(servico.atualizar).mockRejectedValue(new ErroHttp(404, 'Operador não encontrado.'));

        await atualizar(req({ params: { id: ID }, body: { nome: 'Ana' } }), res);

        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: 'Operador não encontrado.' });
    });
});

describe('operatorController.deletar', () => {
    test('200 com a resposta do service', async () => {
        vi.mocked(servico.excluir).mockResolvedValue({ _id: ID, message: 'ok' });

        await deletar(req({ params: { id: ID } }), res);

        expect(servico.excluir).toHaveBeenCalledWith(ESCOPO, ID);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ _id: ID, message: 'ok' });
    });

    test('409 do service é repassado', async () => {
        vi.mocked(servico.excluir).mockRejectedValue(new ErroHttp(409, 'Operador com sessão aberta.'));

        await deletar(req({ params: { id: ID } }), res);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({ error: 'Operador com sessão aberta.' });
    });
});

describe('operatorController: id inválido', () => {
    test.each([
        ['atualizar', atualizar, { nome: 'Ana' }],
        ['deletar', deletar, {}],
        ['criarLogin', criarLogin, { usuario: 'ana', senha: 'segredo123' }],
        ['atualizarLogin', atualizarLogin, { acessoNegado: true }],
        ['removerLogin', removerLogin, {}],
    ])('%s: 400 com a mensagem de ObjectId', async (_nome, handler, body) => {
        await (handler as any)(req({ params: { id: 'abc' }, body }), res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: 'O ID fornecido não é um ObjectId válido do MongoDB.' });
        naoChamouServico();
    });
});

describe('operatorController.criarLogin', () => {
    test('201 com o operador', async () => {
        await criarLogin(req({ params: { id: ID }, body: { usuario: 'ana.souza', senha: '12345678' } }), res);

        expect(servico.criarLogin).toHaveBeenCalledWith(ESCOPO, ID, { usuario: 'ana.souza', senha: '12345678' });
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith(OPERADOR);
    });

    test('senha de 72 caracteres e usuário de 40 passam', async () => {
        await criarLogin(req({ params: { id: ID }, body: { usuario: 'a'.repeat(40), senha: 's'.repeat(72) } }), res);

        expect(status).toHaveBeenCalledWith(201);
    });

    test.each([
        ['usuario com espaço', { usuario: 'ana souza', senha: 'segredo123' }],
        ['usuario curto', { usuario: 'an', senha: 'segredo123' }],
        ['usuario com mais de 40', { usuario: 'a'.repeat(41), senha: 'segredo123' }],
        ['usuario ausente', { senha: 'segredo123' }],
        ['senha com 7', { usuario: 'ana', senha: '1234567' }],
        ['senha com 73', { usuario: 'ana', senha: 's'.repeat(73) }],
        ['senha não texto', { usuario: 'ana', senha: 12345678 }],
        ['chave $', { usuario: 'ana', senha: 'segredo123', $where: '1' }],
    ])('400 com %s, sem gravar', async (_caso, body) => {
        await criarLogin(req({ params: { id: ID }, body }), res);

        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });

    test('409 do service é repassado', async () => {
        vi.mocked(servico.criarLogin).mockRejectedValue(new ErroHttp(409, 'Este usuário já está em uso.'));

        await criarLogin(req({ params: { id: ID }, body: { usuario: 'ana', senha: 'segredo123' } }), res);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({ error: 'Este usuário já está em uso.' });
    });
});

describe('operatorController.atualizarLogin', () => {
    test('200 com senha e acessoNegado', async () => {
        await atualizarLogin(req({ params: { id: ID }, body: { senha: 'novaSenha1', acessoNegado: false } }), res);

        expect(servico.atualizarLogin).toHaveBeenCalledWith(ESCOPO, ID, { senha: 'novaSenha1', acessoNegado: false });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(OPERADOR);
    });

    test('200 só com acessoNegado', async () => {
        await atualizarLogin(req({ params: { id: ID }, body: { acessoNegado: true } }), res);

        expect(servico.atualizarLogin).toHaveBeenCalledWith(ESCOPO, ID, { acessoNegado: true });
        expect(status).toHaveBeenCalledWith(200);
    });

    test.each([
        ['corpo vazio', {}],
        ['acessoNegado não booleano', { acessoNegado: 'true' }],
        ['senha curta', { senha: 'curta' }],
        ['senha com 73', { senha: 's'.repeat(73) }],
    ])('400 com %s, sem gravar', async (_caso, body) => {
        await atualizarLogin(req({ params: { id: ID }, body }), res);

        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });

    test('404 sem login é repassado', async () => {
        vi.mocked(servico.atualizarLogin).mockRejectedValue(new ErroHttp(404, 'Operador sem login.'));

        await atualizarLogin(req({ params: { id: ID }, body: { acessoNegado: true } }), res);

        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: 'Operador sem login.' });
    });
});

describe('operatorController.removerLogin', () => {
    test('200 com o operador', async () => {
        await removerLogin(req({ params: { id: ID } }), res);

        expect(servico.removerLogin).toHaveBeenCalledWith(ESCOPO, ID);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(OPERADOR);
    });
});

describe('operatorRouter', () => {
    test.each([
        ['get', '/', listar],
        ['post', '/', criar],
        ['put', '/:id', atualizar],
        ['delete', '/:id', deletar],
        ['post', '/:id/login', criarLogin],
        ['put', '/:id/login', atualizarLogin],
        ['delete', '/:id/login', removerLogin],
    ])('%s %s ligada ao controller', (metodo, caminho, handler) => {
        const layer = (operatorRouter as any).stack.find((l: any) => l.route?.path === caminho && l.route.methods[metodo]);
        expect(layer.route.stack[0].handle).toBe(handler);
    });
});
