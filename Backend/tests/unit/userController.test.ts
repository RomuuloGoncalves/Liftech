import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, buscar, criar, deletar, servicoUser } from '../../src/feature/user/userController.js';
import { userModel } from '../../src/models/userModel.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/user/userService.js');
vi.mock('../../src/schemas/user.js', () => ({ User: {} }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const EMPRESA = '665f1c2b9a1e4b0012345678';
const OUTRA_EMPRESA = '665f1c2b9a1e4b00123456ff';
const F1 = '665f1c2b9a1e4b00123456b1';
const F2 = '665f1c2b9a1e4b00123456b2';
const FORA = '665f1c2b9a1e4b00123456b9';
const ID = '665f1c2b9a1e4b0012345679';
const escopoDe = (tipo: 'empresa' | 'filiais', ids: string[] = [F1, F2]): Escopo => ({
    empresaId: EMPRESA,
    tipo,
    filiais: ids.map((_id) => ({ _id, nome: 'x', matriz: false })),
});
const FILTRO = { empresaId: { $in: [EMPRESA] } };

describe('userController: escopo por empresa', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const req = (escopo: Escopo, extra: object = {}) => ({ escopo, params: {}, body: {}, ...extra }) as unknown as Request;
    const modeloEnviado = () => vi.mocked(servicoUser.criar).mock.calls[0]![0].obterDados();

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
        vi.mocked(servicoUser.criar).mockImplementation(async (u: userModel) => u);
    });

    describe('listar, buscar, deletar', () => {
        test('listar passa o filtro da empresa do chamador', async () => {
            vi.mocked(servicoUser.listar).mockResolvedValue([new userModel('Ana', 'admin', ID)]);

            await listar(req(escopoDe('filiais')), res);

            expect(servicoUser.listar).toHaveBeenCalledWith(FILTRO);
            expect(mockStatus).toHaveBeenCalledWith(200);
        });

        test('escopo sem empresa: listar filtra com $in vazio', async () => {
            vi.mocked(servicoUser.listar).mockResolvedValue([]);

            await listar(req({ tipo: 'filiais', filiais: [] }), res);

            expect(servicoUser.listar).toHaveBeenCalledWith({ empresaId: { $in: [] } });
        });

        test('buscar passa o filtro; usuário de outra empresa faz o service lançar e vira 404', async () => {
            vi.mocked(servicoUser.obterPorId).mockRejectedValue(new Error('Usuário não encontrado(a).'));

            await buscar(req(escopoDe('filiais'), { params: { id: ID } }), res);

            expect(servicoUser.obterPorId).toHaveBeenCalledWith(ID, FILTRO);
            expect(mockStatus).toHaveBeenCalledWith(404);
        });

        test('deletar passa o filtro; usuário de outra empresa vira 404', async () => {
            vi.mocked(servicoUser.deletar).mockRejectedValue(new Error('Usuário não encontrado(a).'));

            await deletar(req(escopoDe('filiais'), { params: { id: ID } }), res);

            expect(servicoUser.deletar).toHaveBeenCalledWith(ID, FILTRO);
            expect(mockStatus).toHaveBeenCalledWith(404);
        });
    });

    describe('criar', () => {
        test('201 com o empresaId do chamador, ignorando o empresaId do corpo', async () => {
            await criar(req(escopoDe('empresa'), { body: { nome: 'Ana', role: 'colaborador', empresaId: OUTRA_EMPRESA } }), res);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(modeloEnviado()).toMatchObject({ nome: 'Ana', role: 'colaborador', empresaId: EMPRESA });
            expect(mockJson).toHaveBeenCalledWith(modeloEnviado());
        });

        test('chamador de empresa define escopo, filiaisIds e role admin', async () => {
            await criar(req(escopoDe('empresa'), { body: { nome: 'Ana', role: 'admin', escopo: 'filiais', filiaisIds: [F2] } }), res);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(modeloEnviado()).toMatchObject({ role: 'admin', escopo: 'filiais', filiaisIds: [F2] });
        });

        test('sem escopo e filiaisIds no corpo, o usuário fica sem escopo e com filiaisIds vazio', async () => {
            await criar(req(escopoDe('filiais'), { body: { nome: 'Ana', role: 'colaborador' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(modeloEnviado().escopo).toBeUndefined();
            expect(modeloEnviado().filiaisIds).toEqual([]);
        });

        test('403 quando o chamador não tem empresa', async () => {
            await criar(req({ tipo: 'filiais', filiais: [] }, { body: { nome: 'Ana', role: 'colaborador' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(servicoUser.criar).not.toHaveBeenCalled();
        });

        test.each([
            ['role ausente', { nome: 'Ana' }],
            ['role fora da lista', { nome: 'Ana', role: 'root' }],
        ])('400 com %s', async (_caso, body) => {
            await criar(req(escopoDe('empresa'), { body }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson.mock.calls[0]![0].error).toEqual([expect.objectContaining({ field: 'role' })]);
            expect(servicoUser.criar).not.toHaveBeenCalled();
        });

        test('nome e role inválidos juntos: o 400 lista os dois campos', async () => {
            await criar(req(escopoDe('empresa'), { body: { nome: '   ', role: 'root' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson.mock.calls[0]![0].error.map((e: any) => e.field).sort()).toEqual(['nome', 'role']);
        });

        test.each([
            ['escopo fora da lista', { escopo: 'todos' }, 'escopo'],
            ['filiaisIds com item inválido', { filiaisIds: [F1, 'x'] }, 'filiaisIds'],
            ['filiaisIds que não é lista', { filiaisIds: F1 }, 'filiaisIds'],
        ])('400 com %s', async (_caso, extra, campo) => {
            await criar(req(escopoDe('empresa'), { body: { nome: 'Ana', role: 'colaborador', ...extra } }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson.mock.calls[0]![0].error).toEqual([expect.objectContaining({ field: campo })]);
        });

        test.each([
            ['escopo', { role: 'colaborador', escopo: 'empresa' }],
            ['filiaisIds', { role: 'colaborador', filiaisIds: [F1] }],
            ['role admin', { role: 'admin' }],
        ])('403 quando o chamador não é de empresa e o corpo traz %s', async (_caso, extra) => {
            await criar(req(escopoDe('filiais'), { body: { nome: 'Ana', ...extra } }), res);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(servicoUser.criar).not.toHaveBeenCalled();
        });

        test('403 com filiaisIds que tem filial fora das filiais visíveis, mesmo para chamador de empresa', async () => {
            await criar(req(escopoDe('empresa'), { body: { nome: 'Ana', role: 'colaborador', filiaisIds: [F1, FORA] } }), res);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(servicoUser.criar).not.toHaveBeenCalled();
        });

        test('409 quando o service acusa nome repetido', async () => {
            vi.mocked(servicoUser.criar).mockRejectedValue(new Error('Já existe um usuário com o nome "Ana".'));

            await criar(req(escopoDe('empresa'), { body: { nome: 'Ana', role: 'colaborador' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(409);
        });
    });
});
