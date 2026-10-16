import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, criar, atualizar, deletar } from '../../src/feature/sector/sectorController.js';
import sectorRouter from '../../src/feature/sector/sectorRouter.js';
import * as servico from '../../src/feature/sector/sectorService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/sector/sectorService.js', () => ({
    listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn(),
}));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const ID = '665f1c2b9a1e4b0012345678';
const FILIAL = '665f1c2b9a1e4b00123456b1';
const OUTRA = '665f1c2b9a1e4b00123456b2';
const ESCOPO: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [{ _id: FILIAL, nome: 'Matriz', matriz: true }] };
const ADMIN = { _id: 'u1', role: 'admin', operadorId: null };
const COLABORADOR = { _id: 'u2', role: 'colaborador', operadorId: 'o1' };
const SETOR = { _id: ID, nome: 'Doca', filialId: FILIAL, filial: { nome: 'Matriz' } };
const NOME_INVALIDO = "O campo 'nome' é obrigatório e deve ter até 60 caracteres.";

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
    for (const f of ['listar', 'criar', 'atualizar', 'excluir'] as const) vi.mocked(servico[f]).mockResolvedValue(SETOR as any);
});

const naoChamouServico = () => {
    for (const f of ['criar', 'atualizar', 'excluir'] as const) expect(servico[f]).not.toHaveBeenCalled();
};

describe('listar', () => {
    test('colaborador lê os setores do escopo: 200', async () => {
        vi.mocked(servico.listar).mockResolvedValue([SETOR] as any);

        await listar(req({}, COLABORADOR), res);

        expect(servico.listar).toHaveBeenCalledWith(ESCOPO, undefined);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([SETOR]);
    });

    test('repassa o filtro filialId', async () => {
        await listar(req({ query: { filialId: FILIAL } }), res);
        expect(servico.listar).toHaveBeenCalledWith(ESCOPO, FILIAL);
    });

    test('filialId inválido: 400', async () => {
        await listar(req({ query: { filialId: 'xyz' } }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(servico.listar).not.toHaveBeenCalled();
    });
});

describe('escritas só para admin', () => {
    test.each([
        ['criar', () => criar(req({ body: { nome: 'Doca' } }, COLABORADOR), res)],
        ['atualizar', () => atualizar(req({ params: { id: ID }, body: { nome: 'Doca' } }, COLABORADOR), res)],
        ['deletar', () => deletar(req({ params: { id: ID } }, COLABORADOR), res)],
    ])('%s de colaborador: 403 sem chamar o serviço', async (_nome, chamar) => {
        await chamar();

        expect(status).toHaveBeenCalledWith(403);
        expect(json).toHaveBeenCalledWith({ error: 'Apenas administradores podem gerenciar setores.' });
        naoChamouServico();
    });
});

describe('criar', () => {
    test('201 com nome cortado nas pontas e a filial do escopo', async () => {
        await criar(req({ body: { nome: '  Doca  ' } }), res);

        expect(servico.criar).toHaveBeenCalledWith(ESCOPO, { nome: 'Doca', filialId: FILIAL });
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith(SETOR);
    });

    test.each([
        ['sem nome', {}],
        ['nome vazio', { nome: '   ' }],
        ['nome com 61 caracteres', { nome: 'a'.repeat(61) }],
        ['nome não texto', { nome: 7 }],
    ])('%s: 400 sem gravar', async (_caso, body) => {
        await criar(req({ body }), res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: NOME_INVALIDO });
        naoChamouServico();
    });

    test('nome com 60 caracteres passa', async () => {
        await criar(req({ body: { nome: 'a'.repeat(60) } }), res);
        expect(status).toHaveBeenCalledWith(201);
    });

    test('filial fora do escopo: 403 sem gravar', async () => {
        await criar(req({ body: { nome: 'Doca', filialId: OUTRA } }), res);
        expect(status).toHaveBeenCalledWith(403);
        naoChamouServico();
    });

    test('chave $: 400 sem gravar', async () => {
        await criar(req({ body: { nome: 'Doca', $where: '1' } }), res);
        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });

    test('409 do serviço vira 409', async () => {
        vi.mocked(servico.criar).mockRejectedValue(new ErroHttp(409, 'Já existe um setor com este nome nesta filial.'));
        await criar(req({ body: { nome: 'Doca' } }), res);
        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({ error: 'Já existe um setor com este nome nesta filial.' });
    });
});

describe('atualizar', () => {
    test('200 repassando nome cortado e filialId', async () => {
        await atualizar(req({ params: { id: ID }, body: { nome: ' Doca 2 ', filialId: OUTRA } }), res);

        expect(servico.atualizar).toHaveBeenCalledWith(ESCOPO, ID, { nome: 'Doca 2', filialId: OUTRA });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(SETOR);
    });

    test.each([
        ['campo fora da lista', { cor: '#000000' }, "O campo 'cor' não pode ser alterado."],
        ['chave $', { $set: { nome: 'x' } }, "O campo '$set' não é permitido."],
        ['nome vazio', { nome: '' }, NOME_INVALIDO],
    ])('%s: 400 sem gravar', async (_caso, body, mensagem) => {
        await atualizar(req({ params: { id: ID }, body }), res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: mensagem });
        naoChamouServico();
    });

    test('id inválido: 400', async () => {
        await atualizar(req({ params: { id: 'x' }, body: { nome: 'Doca' } }), res);
        expect(status).toHaveBeenCalledWith(400);
        naoChamouServico();
    });

    test('404 do serviço vira 404', async () => {
        vi.mocked(servico.atualizar).mockRejectedValue(new ErroHttp(404, 'Setor não encontrado.'));
        await atualizar(req({ params: { id: ID }, body: { nome: 'Doca' } }), res);
        expect(status).toHaveBeenCalledWith(404);
    });
});

describe('deletar', () => {
    test('200 com a resposta do serviço', async () => {
        vi.mocked(servico.excluir).mockResolvedValue({ _id: ID, message: 'Setor excluído com sucesso.' });

        await deletar(req({ params: { id: ID } }), res);

        expect(servico.excluir).toHaveBeenCalledWith(ESCOPO, ID);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ _id: ID, message: 'Setor excluído com sucesso.' });
    });

    test('409 com máquinas vira 409 com a mensagem', async () => {
        vi.mocked(servico.excluir).mockRejectedValue(new ErroHttp(409, 'Setor com 2 máquina(s) ligada(s).'));
        await deletar(req({ params: { id: ID } }), res);
        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({ error: 'Setor com 2 máquina(s) ligada(s).' });
    });
});

describe('sectorRouter', () => {
    test.each([
        ['get', '/', listar],
        ['post', '/', criar],
        ['put', '/:id', atualizar],
        ['delete', '/:id', deletar],
    ])('%s %s', (metodo, caminho, handler) => {
        const layer = (sectorRouter as any).stack.find((l: any) => l.route?.path === caminho && l.route.methods[metodo]);
        expect(layer.route.stack[0].handle).toBe(handler);
    });
});
