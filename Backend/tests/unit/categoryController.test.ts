import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, criar, atualizar, deletar } from '../../src/feature/category/categoryController.js';
import categoryRouter from '../../src/feature/category/categoryRouter.js';
import * as servico from '../../src/feature/category/categoryService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/category/categoryService.js', () => ({
    listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn(),
}));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const ID = '665f1c2b9a1e4b0012345678';
const empresa: Escopo = { empresaId: 'e1', tipo: 'empresa', filiais: [] };
const restrito: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [] };
const CATEGORIA = { _id: ID, nome: 'Pátio', cor: '#3A9CFF', chave: null, statusVinculados: [] };

describe('categoryController', () => {
    let json: ReturnType<typeof vi.fn>;
    let status: ReturnType<typeof vi.fn>;
    let res: Response;
    const req = (escopo: Escopo, extra: object = {}) => ({ escopo, params: {}, body: {}, ...extra }) as unknown as Request;

    beforeEach(() => {
        vi.clearAllMocks();
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { status, json } as unknown as Response;
        vi.mocked(servico.criar).mockResolvedValue(CATEGORIA as any);
        vi.mocked(servico.atualizar).mockResolvedValue(CATEGORIA as any);
    });

    test('listar: 200 também para escopo filiais', async () => {
        vi.mocked(servico.listar).mockResolvedValue([CATEGORIA] as any);

        await listar(req(restrito), res);

        expect(servico.listar).toHaveBeenCalledWith(restrito);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([CATEGORIA]);
    });

    test.each([
        ['criar', () => criar(req(restrito, { body: { nome: 'X', cor: '#000000' } }), res)],
        ['atualizar', () => atualizar(req(restrito, { params: { id: ID }, body: { nome: 'X' } }), res)],
        ['deletar', () => deletar(req(restrito, { params: { id: ID } }), res)],
    ])('%s com escopo filiais: 403 sem chamar o serviço', async (_nome, chamar) => {
        await chamar();

        expect(status).toHaveBeenCalledWith(403);
        expect(servico.criar).not.toHaveBeenCalled();
        expect(servico.atualizar).not.toHaveBeenCalled();
        expect(servico.excluir).not.toHaveBeenCalled();
    });

    test('criar: 201 com nome cortado nas pontas, cor e status ligados', async () => {
        await criar(req(empresa, { body: { nome: '  Pátio ', cor: '#3a9cff', statusVinculados: ['offline'] } }), res);

        expect(servico.criar).toHaveBeenCalledWith(empresa, { nome: 'Pátio', cor: '#3a9cff', statusVinculados: ['offline'] });
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith(CATEGORIA);
    });

    test.each([
        ['sem nome', { cor: '#000000' }],
        ['nome só com espaços', { nome: '   ', cor: '#000000' }],
        ['nome com 41 caracteres', { nome: 'a'.repeat(41), cor: '#000000' }],
        ['sem cor', { nome: 'X' }],
        ['cor #12345', { nome: 'X', cor: '#12345' }],
        ['cor sem #', { nome: 'X', cor: '000000' }],
        ['chave $', { nome: 'X', cor: '#000000', $where: '1' }],
    ])('criar %s: 400', async (_caso, body) => {
        await criar(req(empresa, { body }), res);

        expect(status).toHaveBeenCalledWith(400);
        expect(servico.criar).not.toHaveBeenCalled();
    });

    test('criar com nome de 40 caracteres passa', async () => {
        await criar(req(empresa, { body: { nome: 'a'.repeat(40), cor: '#000000' } }), res);
        expect(status).toHaveBeenCalledWith(201);
    });

    test('atualizar: 200 só com os campos enviados', async () => {
        await atualizar(req(empresa, { params: { id: ID }, body: { cor: '#000000' } }), res);

        expect(servico.atualizar).toHaveBeenCalledWith(empresa, ID, { cor: '#000000' });
        expect(status).toHaveBeenCalledWith(200);
    });

    test.each([
        ['nome vazio', { nome: '' }],
        ['cor inválida', { cor: 'azul' }],
    ])('atualizar %s: 400', async (_caso, body) => {
        await atualizar(req(empresa, { params: { id: ID }, body }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(servico.atualizar).not.toHaveBeenCalled();
    });

    test('atualizar com id inválida: 400', async () => {
        await atualizar(req(empresa, { params: { id: 'abc' }, body: { cor: '#000000' } }), res);
        expect(status).toHaveBeenCalledWith(400);
    });

    test.each([[404, 'Categoria não encontrada.'], [409, 'Já existe uma categoria com este nome.']])(
        'erro %s do serviço é repassado',
        async (codigo, mensagem) => {
            vi.mocked(servico.atualizar).mockRejectedValue(new ErroHttp(codigo, mensagem));
            await atualizar(req(empresa, { params: { id: ID }, body: { nome: 'Ativas' } }), res);
            expect(status).toHaveBeenCalledWith(codigo);
            expect(json).toHaveBeenCalledWith({ error: mensagem });
        }
    );

    test('deletar: 200 com { _id, message }', async () => {
        vi.mocked(servico.excluir).mockResolvedValue({ _id: ID, message: 'Categoria excluída com sucesso.' });

        await deletar(req(empresa, { params: { id: ID } }), res);

        expect(servico.excluir).toHaveBeenCalledWith(empresa, ID);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ _id: ID, message: 'Categoria excluída com sucesso.' });
    });

    test('router liga os 4 métodos aos handlers', () => {
        const rotas = (categoryRouter as any).stack.map((l: any) => [l.route.path, Object.keys(l.route.methods)[0], l.route.stack[0].handle]);
        expect(rotas).toEqual([
            ['/', 'get', listar],
            ['/', 'post', criar],
            ['/:id', 'put', atualizar],
            ['/:id', 'delete', deletar],
        ]);
    });
});
