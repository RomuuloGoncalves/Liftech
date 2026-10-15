import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, criar, atualizar, deletar } from '../../src/feature/branch/branchController.js';
import branchRouter from '../../src/feature/branch/branchRouter.js';
import * as servico from '../../src/feature/branch/branchService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/branch/branchService.js', () => ({ criar: vi.fn(), renomear: vi.fn(), excluir: vi.fn() }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const ID = '665f1c2b9a1e4b0012345678';
const FILIAIS = [{ _id: ID, nome: 'Matriz', matriz: true }];
const empresa: Escopo = { empresaId: 'e1', tipo: 'empresa', filiais: FILIAIS };
const restrito: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: FILIAIS };

describe('branchController', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const req = (escopo: Escopo, extra: object = {}) => ({ escopo, params: {}, body: {}, ...extra }) as unknown as Request;

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
    });

    test('listar: 200 com as filiais do escopo, mesmo para quem não é de empresa', async () => {
        await listar(req(restrito), res);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(FILIAIS);
    });

    test.each([
        ['criar', (e: Escopo) => criar(req(e, { body: { nome: 'X' } }), res)],
        ['atualizar', (e: Escopo) => atualizar(req(e, { params: { id: ID }, body: { nome: 'X' } }), res)],
        ['deletar', (e: Escopo) => deletar(req(e, { params: { id: ID } }), res)],
    ])('%s: 403 sem escopo de empresa, sem chamar o service', async (_nome, chamar) => {
        await chamar(restrito);

        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson.mock.calls[0]![0]).toHaveProperty('error');
        expect(servico.criar).not.toHaveBeenCalled();
        expect(servico.renomear).not.toHaveBeenCalled();
        expect(servico.excluir).not.toHaveBeenCalled();
    });

    test('403 vem antes da validação de id e de nome', async () => {
        await atualizar(req(restrito, { params: { id: 'x' }, body: {} }), res);

        expect(mockStatus).toHaveBeenCalledWith(403);
    });

    test('criar: 201 com o corpo do service e o nome sem espaços nas pontas; matriz do corpo não chega ao service', async () => {
        const filial = { _id: ID, nome: 'Unidade Sul', matriz: false };
        vi.mocked(servico.criar).mockResolvedValue(filial);

        await criar(req(empresa, { body: { nome: '  Unidade Sul  ', matriz: true } }), res);

        expect(servico.criar).toHaveBeenCalledWith(empresa, 'Unidade Sul');
        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith(filial);
    });

    test.each([
        ['ausente', {}],
        ['vazio', { nome: '' }],
        ['só espaços', { nome: '   ' }],
        ['que não é texto', { nome: 5 }],
    ])('criar e atualizar: 400 com nome %s', async (_caso, body) => {
        await criar(req(empresa, { body }), res);
        await atualizar(req(empresa, { params: { id: ID }, body }), res);

        expect(mockStatus).toHaveBeenNthCalledWith(1, 400);
        expect(mockStatus).toHaveBeenNthCalledWith(2, 400);
        expect(servico.criar).not.toHaveBeenCalled();
        expect(servico.renomear).not.toHaveBeenCalled();
    });

    test('atualizar: 200 com o corpo do service, nome sem espaços e id do parâmetro', async () => {
        const filial = { _id: ID, nome: 'Unidade Leste', matriz: false };
        vi.mocked(servico.renomear).mockResolvedValue(filial);

        await atualizar(req(empresa, { params: { id: ID }, body: { nome: ' Unidade Leste ', matriz: true } }), res);

        expect(servico.renomear).toHaveBeenCalledWith(empresa, ID, 'Unidade Leste');
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(filial);
    });

    test('atualizar e deletar: 400 com id que não é ObjectId', async () => {
        await atualizar(req(empresa, { params: { id: 'abc' }, body: { nome: 'X' } }), res);
        await deletar(req(empresa, { params: { id: 'abc' } }), res);

        expect(mockStatus).toHaveBeenNthCalledWith(1, 400);
        expect(mockStatus).toHaveBeenNthCalledWith(2, 400);
        expect(servico.renomear).not.toHaveBeenCalled();
        expect(servico.excluir).not.toHaveBeenCalled();
    });

    test('deletar: 200 com o corpo do service', async () => {
        const corpo = { _id: ID, message: 'Filial excluída com sucesso.' };
        vi.mocked(servico.excluir).mockResolvedValue(corpo);

        await deletar(req(empresa, { params: { id: ID } }), res);

        expect(servico.excluir).toHaveBeenCalledWith(empresa, ID);
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(corpo);
    });

    test.each([404, 409])('ErroHttp %i do service vira esse status com { error }', async (status) => {
        vi.mocked(servico.excluir).mockRejectedValue(new ErroHttp(status, 'motivo'));
        vi.mocked(servico.renomear).mockRejectedValue(new ErroHttp(status, 'motivo'));
        vi.mocked(servico.criar).mockRejectedValue(new ErroHttp(status, 'motivo'));

        await criar(req(empresa, { body: { nome: 'X' } }), res);
        await atualizar(req(empresa, { params: { id: ID }, body: { nome: 'X' } }), res);
        await deletar(req(empresa, { params: { id: ID } }), res);

        expect(mockStatus.mock.calls.map((c) => c[0])).toEqual([status, status, status]);
        expect(mockJson).toHaveBeenCalledWith({ error: 'motivo' });
    });

    test('500 com { error: mensagem } quando o service lança um erro comum', async () => {
        vi.mocked(servico.excluir).mockRejectedValue(new Error('falha de conexão'));

        await deletar(req(empresa, { params: { id: ID } }), res);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'falha de conexão' });
    });
});

describe('branchRouter', () => {
    const rota = (caminho: string, metodo: string) =>
        (branchRouter as any).stack.find((l: any) => l.route?.path === caminho && l.route.methods[metodo]);

    test.each([
        ['/', 'get', listar],
        ['/', 'post', criar],
        ['/:id', 'put', atualizar],
        ['/:id', 'delete', deletar],
    ])('expõe %s %s ligado ao handler', (caminho, metodo, handler) => {
        expect(rota(caminho, metodo).route.stack[0].handle).toBe(handler);
    });
});
