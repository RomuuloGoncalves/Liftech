import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, buscar, criar, deletar, atualizar, servicoUser } from '../../src/feature/user/userController.js';
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

describe('userController.atualizar: sem atribuição em massa', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const chamar = (escopo: Escopo, body: unknown) =>
        atualizar({ escopo, params: { id: ID }, body } as unknown as Request, res);
    const status = () => mockStatus.mock.calls[0]![0];

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
        vi.mocked(servicoUser.atualizar).mockResolvedValue(new userModel('Ana', 'admin', ID));
    });

    test('nome, telefone e cargo: qualquer chamador da empresa; o service recebe só eles e o filtro da empresa', async () => {
        await chamar(escopoDe('filiais'), { nome: 'Ana Maria', telefone: '1199999', cargo: 'Operadora' });

        expect(servicoUser.atualizar).toHaveBeenCalledWith(ID, { nome: 'Ana Maria', telefone: '1199999', cargo: 'Operadora' }, FILTRO);
        expect(status()).toBe(200);
    });

    test('role, escopo e filiaisIds válidos com chamador de empresa passam ao service', async () => {
        const corpo = { role: 'admin', escopo: 'filiais', filiaisIds: [F1] };

        await chamar(escopoDe('empresa'), corpo);

        expect(servicoUser.atualizar).toHaveBeenCalledWith(ID, corpo, FILTRO);
        expect(status()).toBe(200);
    });

    test.each([
        ['role', { role: 'admin' }],
        ['escopo', { escopo: 'empresa' }],
        ['filiaisIds', { filiaisIds: [F1] }],
    ])('403 com %s quando o chamador não é de empresa, sem chamar o service', async (_campo, corpo) => {
        await chamar(escopoDe('filiais'), corpo);

        expect(status()).toBe(403);
        expect(servicoUser.atualizar).not.toHaveBeenCalled();
    });

    test('403 com filiaisIds que tem filial fora das visíveis, mesmo para chamador de empresa', async () => {
        await chamar(escopoDe('empresa'), { filiaisIds: [F1, FORA] });

        expect(status()).toBe(403);
        expect(servicoUser.atualizar).not.toHaveBeenCalled();
    });

    test.each(['senhaHash', 'email', 'usuario', 'empresaId', 'campoQualquer', '$set', '$where'])(
        '400 com a chave %s no corpo, sem chamar o service',
        async (chave) => {
            await chamar(escopoDe('empresa'), { nome: 'Ana', [chave]: 'x' });

            expect(status()).toBe(400);
            expect(mockJson.mock.calls[0]![0].error).toContain(`'${chave}'`);
            expect(servicoUser.atualizar).not.toHaveBeenCalled();
        }
    );

    test.each([
        ['nome vazio', { nome: '  ' }],
        ['nome que não é texto', { nome: { $ne: 'x' } }],
        ['telefone que não é texto', { telefone: 5 }],
        ['cargo que não é texto', { cargo: ['a'] }],
        ['role inválido', { role: 'root' }],
        ['escopo inválido', { escopo: 'todos' }],
        ['filiaisIds com item inválido', { filiaisIds: ['x'] }],
        ['corpo vazio', {}],
    ])('400 com %s, sem chamar o service', async (_caso, corpo) => {
        await chamar(escopoDe('empresa'), corpo);

        expect(status()).toBe(400);
        expect(servicoUser.atualizar).not.toHaveBeenCalled();
    });

    test('400 vem antes do 403: valor inválido de chamador sem escopo de empresa', async () => {
        await chamar(escopoDe('filiais'), { role: 'root' });

        expect(status()).toBe(400);
    });

    test('_id e id do corpo são descartados sem erro e não chegam ao service', async () => {
        await chamar(escopoDe('filiais'), { _id: ID, id: ID, nome: 'Ana' });

        expect(servicoUser.atualizar).toHaveBeenCalledWith(ID, { nome: 'Ana' }, FILTRO);
        expect(status()).toBe(200);
    });

    test('usuário de outra empresa: o service lança e vira 404', async () => {
        vi.mocked(servicoUser.atualizar).mockRejectedValue(new Error('Usuário não encontrado(a).'));

        await chamar(escopoDe('filiais'), { nome: 'Ana' });

        expect(status()).toBe(404);
    });
});
