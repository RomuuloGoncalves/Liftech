import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { autenticar, exigirAdmin } from '../../src/core/autenticar.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import { User } from '../../src/schemas/user.js';
import { Branch } from '../../src/schemas/branch.js';
import { env } from '../../src/config/env.js';

vi.mock('../../src/schemas/user.js', () => ({ User: { findById: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { find: vi.fn() } }));

const SEGREDO = 'segredo-de-teste';
const USUARIO = '665f1c2b9a1e4b0012345678';
const EMPRESA = '665f1c2b9a1e4b00123456a0';
const MATRIZ = '665f1c2b9a1e4b00123456b1';
const CENTRO = '665f1c2b9a1e4b00123456b2';

const token = (sub: string = USUARIO, opcoes: jwt.SignOptions = {}) => jwt.sign({ sub, role: 'admin' }, SEGREDO, opcoes);

function mockarUsuario(documento: Record<string, unknown> | null) {
    vi.mocked(User.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(documento) } as any);
}

function mockarFiliais(filiais: unknown[]) {
    vi.mocked(Branch.find).mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(filiais) }) } as any);
}

describe('autenticar', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;
    let next: ReturnType<typeof vi.fn>;

    const chamar = async (authorization?: string) => {
        const req = { headers: { authorization } } as unknown as Request;
        await autenticar(req, res, next as unknown as NextFunction);
        return req;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        env.jwt_secret = SEGREDO;
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
        next = vi.fn();
        mockarFiliais([{ _id: MATRIZ, nome: 'Matriz', matriz: true }]);
    });

    const respondeu401 = () => {
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Não autenticado.' });
        expect(next).not.toHaveBeenCalled();
    };

    test('token válido de usuário existente: chama next e define req.escopo a partir do usuário', async () => {
        mockarUsuario({ _id: USUARIO, empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [MATRIZ] });

        const req = await chamar(`Bearer ${token()}`);

        expect(User.findById).toHaveBeenCalledWith(USUARIO);
        expect(next).toHaveBeenCalledTimes(1);
        expect(mockStatus).not.toHaveBeenCalled();
        expect(req.escopo).toEqual({ empresaId: EMPRESA, tipo: 'filiais', filiais: [{ _id: MATRIZ, nome: 'Matriz', matriz: true }] });
    });

    test('req.usuario: _id, role e operadorId (string, ou null sem ligação)', async () => {
        const OPERADOR = '665f1c2b9a1e4b00123456c1';
        mockarUsuario({ _id: USUARIO, role: 'colaborador', operadorId: OPERADOR, empresaId: EMPRESA });
        expect((await chamar(`Bearer ${token()}`)).usuario).toEqual({ _id: USUARIO, role: 'colaborador', operadorId: OPERADOR });

        mockarUsuario({ _id: USUARIO, role: 'admin', empresaId: EMPRESA });
        expect((await chamar(`Bearer ${token()}`)).usuario).toEqual({ _id: USUARIO, role: 'admin', operadorId: null });
    });

    test('lê o usuário a cada requisição: a segunda reflete a mudança de acesso', async () => {
        mockarUsuario({ _id: USUARIO, empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [MATRIZ] });
        const primeira = await chamar(`Bearer ${token()}`);

        mockarUsuario({ _id: USUARIO, empresaId: EMPRESA, escopo: 'empresa', filiaisIds: [] });
        mockarFiliais([{ _id: MATRIZ, nome: 'Matriz', matriz: true }, { _id: CENTRO, nome: 'Unidade Centro', matriz: false }]);
        const segunda = await chamar(`Bearer ${token()}`);

        expect(User.findById).toHaveBeenCalledTimes(2);
        expect(primeira.escopo.tipo).toBe('filiais');
        expect(segunda.escopo.tipo).toBe('empresa');
        expect(segunda.escopo.filiais).toHaveLength(2);
    });

    test.each([
        ['sem cabeçalho', undefined],
        ['sem o prefixo Bearer', 'abc'],
        ['bearer em minúsculas', 'bearer abc'],
        ['Bearer sem token', 'Bearer '],
    ])('401 %s, sem consultar o banco', async (_caso, cabecalho) => {
        await chamar(cabecalho);

        respondeu401();
        expect(User.findById).not.toHaveBeenCalled();
    });

    test.each([
        ['assinatura inválida', () => jwt.sign({ sub: USUARIO }, 'outro-segredo')],
        ['token malformado', () => 'isto.nao.e-um-jwt'],
        ['token expirado', () => token(USUARIO, { expiresIn: -10 })],
        ['algoritmo HS512', () => jwt.sign({ sub: USUARIO }, SEGREDO, { algorithm: 'HS512' })],
    ])('401 com %s', async (_caso, gerar) => {
        mockarUsuario({ _id: USUARIO, empresaId: EMPRESA });

        await chamar(`Bearer ${gerar()}`);

        respondeu401();
        expect(User.findById).not.toHaveBeenCalled();
    });

    test('401 quando o sub não é um ObjectId, sem consultar o banco', async () => {
        await chamar(`Bearer ${token('nao-e-objectid')}`);

        respondeu401();
        expect(User.findById).not.toHaveBeenCalled();
    });

    test('401 quando o usuário do sub não existe mais', async () => {
        mockarUsuario(null);

        await chamar(`Bearer ${token()}`);

        respondeu401();
    });

    test('500 com a mensagem do erro (não 401) quando o banco falha ao ler o usuário', async () => {
        vi.mocked(User.findById).mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('falha de conexão')) } as any);

        await chamar(`Bearer ${token()}`);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'falha de conexão' });
        expect(next).not.toHaveBeenCalled();
    });

    test('500 quando o banco falha ao ler as filiais', async () => {
        mockarUsuario({ _id: USUARIO, empresaId: EMPRESA, escopo: 'empresa' });
        vi.mocked(Branch.find).mockImplementation(() => {
            throw new Error('falha nas filiais');
        });

        await chamar(`Bearer ${token()}`);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'falha nas filiais' });
    });

    test('500 "JWT_SECRET não configurado." sem o segredo', async () => {
        env.jwt_secret = undefined;

        await chamar(`Bearer ${token()}`);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'JWT_SECRET não configurado.' });
        expect(User.findById).not.toHaveBeenCalled();
    });

    test('401 quando o usuário tem acessoNegado: true', async () => {
        mockarUsuario({ _id: USUARIO, role: 'colaborador', empresaId: EMPRESA, acessoNegado: true });

        await chamar(`Bearer ${token()}`);

        respondeu401();
    });

    test('acessoNegado: false segue para next', async () => {
        mockarUsuario({ _id: USUARIO, role: 'colaborador', empresaId: EMPRESA, acessoNegado: false });

        await chamar(`Bearer ${token()}`);

        expect(next).toHaveBeenCalledTimes(1);
        expect(mockStatus).not.toHaveBeenCalled();
    });
});

describe('exigirAdmin', () => {
    const MENSAGEM = 'Apenas administradores podem gerenciar a equipe.';

    test('colaborador: lança 403 com a mensagem', () => {
        let erro: unknown;
        try {
            exigirAdmin({ _id: USUARIO, role: 'colaborador', operadorId: null }, MENSAGEM);
        } catch (e) {
            erro = e;
        }
        expect(erro).toBeInstanceOf(ErroHttp);
        expect(erro).toMatchObject({ status: 403, message: MENSAGEM });
    });

    test('admin passa', () => {
        expect(() => exigirAdmin({ _id: USUARIO, role: 'admin', operadorId: null }, MENSAGEM)).not.toThrow();
    });
});
