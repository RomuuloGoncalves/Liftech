import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { User } from '../../src/schemas/user.js';
import { Branch } from '../../src/schemas/branch.js';
import { Feedback } from '../../src/schemas/feedback.js';

// Nada aqui toca no banco: a conexão é só o mongoose sem conectar, e User e Branch são mocks.
vi.mock('../../src/config/conn.js', async () => ({ conn: { mongoose: (await import('mongoose')).default } }));
vi.mock('../../src/schemas/user.js', () => ({ User: { findById: vi.fn(), findOne: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { find: vi.fn() } }));
vi.mock('../../src/schemas/feedback.js', () => ({ Feedback: { create: vi.fn() } }));
vi.mock('../../src/schemas/accessRequest.js', () => ({
    AccessRequest: {
        find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
        findOne: vi.fn(),
        create: vi.fn(),
        findOneAndUpdate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
        exists: vi.fn().mockResolvedValue(null),
    },
}));
vi.mock('../../src/scripts/resetData.js', () => ({ resetarBanco: vi.fn().mockResolvedValue({ empresas: 1 }) }));
vi.mock('../../src/utils/logger.js', async () => ({ logger: (await import('pino')).default({ level: 'silent' }) }));

const SEGREDO = 'segredo-de-teste';
const USUARIO = '665f1c2b9a1e4b0012345678';
const EMPRESA = '665f1c2b9a1e4b00123456a0';
const MATRIZ = '665f1c2b9a1e4b00123456b1';

let servidor: Server;
let base: string;

beforeAll(async () => {
    env.jwt_secret = SEGREDO;
    vi.mocked(User.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: USUARIO, empresaId: EMPRESA, escopo: 'empresa', filiaisIds: [] }),
    } as any);
    vi.mocked(Branch.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([{ _id: MATRIZ, nome: 'Matriz', matriz: true }]) }),
    } as any);

    servidor = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => servidor.once('listening', resolve));
    base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(() => {
    servidor.close();
});

const token = () => jwt.sign({ sub: USUARIO, role: 'admin' }, SEGREDO);
const chamar = (metodo: string, caminho: string, opcoes: { token?: string; body?: unknown } = {}) =>
    fetch(base + caminho, {
        method: metodo,
        headers: {
            ...(opcoes.body !== undefined && { 'Content-Type': 'application/json' }),
            ...(opcoes.token && { Authorization: `Bearer ${opcoes.token}` }),
        },
        body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body),
    });

describe('app: rotas protegidas', () => {
    test.each([
        ['GET', '/api/machines'],
        ['GET', '/api/forklifts'],
        ['POST', '/api/forklifts'],
        ['GET', '/api/users'],
        ['PUT', '/api/users/665f1c2b9a1e4b0012345678'],
        ['GET', '/api/telemetry'],
        ['POST', '/api/telemetry'],
        ['GET', '/api/branches'],
        ['POST', '/api/branches'],
        ['GET', '/api/categories'],
        ['POST', '/api/categories'],
        ['PUT', '/api/categories/665f1c2b9a1e4b0012345678'],
        ['DELETE', '/api/categories/665f1c2b9a1e4b0012345678'],
        ['GET', '/api/sessions'],
        ['GET', '/api/sessions/atual'],
        ['POST', '/api/sessions'],
        ['PUT', '/api/sessions/atual/encerrar'],
        ['GET', '/api/incidents'],
        ['POST', '/api/incidents'],
        ['POST', '/api/feedback'],
        ['GET', '/api/operators'],
        ['POST', '/api/operators'],
        ['PUT', '/api/operators/665f1c2b9a1e4b0012345678/login'],
        ['DELETE', '/api/operators/665f1c2b9a1e4b0012345678'],
        ['GET', '/api/sectors'],
        ['POST', '/api/sectors'],
        ['PUT', '/api/sectors/665f1c2b9a1e4b0012345678'],
        ['DELETE', '/api/sectors/665f1c2b9a1e4b0012345678'],
        ['PUT', '/api/me'],
        ['DELETE', '/api/me'],
        ['GET', '/api/auth/login'],
        ['GET', '/api/qualquer-coisa'],
    ])('%s %s sem token: 401', async (metodo, caminho) => {
        const resposta = await chamar(metodo, caminho);

        expect(resposta.status).toBe(401);
        expect(await resposta.json()).toEqual({ error: 'Não autenticado.' });
    });

    test('token inválido: 401', async () => {
        const resposta = await chamar('GET', '/api/machines', { token: jwt.sign({ sub: USUARIO }, 'outro-segredo') });

        expect(resposta.status).toBe(401);
    });

    test('com token válido a rota chega ao handler com req.escopo (GET /api/branches devolve as filiais do escopo)', async () => {
        const resposta = await chamar('GET', '/api/branches', { token: token() });

        expect(resposta.status).toBe(200);
        expect(await resposta.json()).toEqual([{ _id: MATRIZ, nome: 'Matriz', matriz: true }]);
    });
});

describe('app: /api/operators', () => {
    test('montada depois do autenticar: com token de quem não é admin chega ao handler e responde 403', async () => {
        const resposta = await chamar('GET', '/api/operators', { token: token() });

        expect(resposta.status).toBe(403);
        expect(await resposta.json()).toEqual({ error: 'Apenas administradores podem gerenciar a equipe.' });
    });
});

describe('app: /api/sectors', () => {
    test('montada depois do autenticar: POST de quem não é admin chega ao handler e responde 403', async () => {
        const resposta = await chamar('POST', '/api/sectors', { token: token(), body: { nome: 'Doca' } });

        expect(resposta.status).toBe(403);
        expect(await resposta.json()).toEqual({ error: 'Apenas administradores podem gerenciar setores.' });
    });
});

describe('app: /api/feedback', () => {
    test('POST /api/feedback sem Authorization → 401 e Feedback.create não chamado', async () => {
        vi.clearAllMocks();
        const resposta = await chamar('POST', '/api/feedback', { body: { mensagem: 'teste sem token' } });
        expect(resposta.status).toBe(401);
        expect(Feedback.create).not.toHaveBeenCalled();
    });

    test('POST /api/feedback com token válido e { mensagem: "oi" } → 201', async () => {
        vi.clearAllMocks();
        vi.mocked(User.findById).mockReturnValueOnce({
            lean: vi.fn().mockResolvedValue({ _id: USUARIO, role: 'admin', empresaId: EMPRESA, escopo: 'empresa', filiaisIds: [] }),
        } as any);
        vi.mocked(Feedback.create).mockResolvedValueOnce({
            _id: 'feedback-1',
            criadoEm: new Date('2026-10-23T12:00:00Z'),
        } as any);

        const resposta = await chamar('POST', '/api/feedback', {
            token: token(),
            body: { mensagem: 'oi' },
        });

        expect(resposta.status).toBe(201);
        expect(Feedback.create).toHaveBeenCalledWith({
            mensagem: 'oi',
            usuarioId: USUARIO,
            empresaId: EMPRESA,
            role: 'admin',
        });
        expect(await resposta.json()).toEqual({
            _id: 'feedback-1',
            criadoEm: '2026-10-23T12:00:00.000Z',
        });
    });
});

describe('app: /api/me', () => {
    test('montada depois do autenticar: PUT com token de admin e corpo vazio responde 400', async () => {
        vi.mocked(User.findById).mockReturnValueOnce({
            lean: vi.fn().mockResolvedValue({ _id: USUARIO, role: 'admin', empresaId: EMPRESA, escopo: 'empresa', filiaisIds: [] }),
        } as any);

        const resposta = await chamar('PUT', '/api/me', { token: token(), body: {} });

        expect(resposta.status).toBe(400);
        expect(await resposta.json()).toHaveProperty('error');
    });

    test('com role colaborador responde 403', async () => {
        vi.mocked(User.findById).mockReturnValueOnce({
            lean: vi.fn().mockResolvedValue({ _id: USUARIO, role: 'colaborador', empresaId: EMPRESA, escopo: 'empresa', filiaisIds: [] }),
        } as any);

        const resposta = await chamar('PUT', '/api/me', {
            token: token(),
            body: { senhaAtual: 'senha123', email: 'novo@empresa.com' },
        });

        expect(resposta.status).toBe(403);
        expect(await resposta.json()).toEqual({ error: 'Apenas administradores podem atualizar os dados de conta.' });
    });
});

describe('app: rotas públicas', () => {
    test('GET / responde sem token', async () => {
        const resposta = await chamar('GET', '/');

        expect(resposta.status).toBe(200);
        expect(await resposta.text()).toBe('Hello World!');
    });

    test('GET /api/health responde sem token', async () => {
        const resposta = await fetch(`${base}/api/health`, { headers: { Accept: 'application/json' } });

        expect(resposta.status).toBe(200);
        expect(await resposta.json()).toMatchObject({ ok: true });
    });

    test('GET /api/reset responde sem token e sem variável de ambiente (reset mockado, nada toca no banco)', async () => {
        delete process.env.PERMITIR_RESET;

        const resposta = await chamar('GET', '/api/reset');

        expect(resposta.status).toBe(200);
        expect(await resposta.json()).toEqual({ empresas: 1 });
    });

    test('POST /api/auth/login chega ao handler sem token (corpo vazio: 400 de validação, não 401)', async () => {
        const resposta = await chamar('POST', '/api/auth/login', { body: {} });

        expect(resposta.status).toBe(400);
    });

    test('POST /api/access-requests chega ao handler sem token (corpo vazio: 400 de validação, não 401)', async () => {
        const resposta = await chamar('POST', '/api/access-requests', { body: {} });

        expect(resposta.status).toBe(400);
    });

    test.each([
        ['GET', '/api/access-requests'],
        ['PUT', '/api/access-requests/665f1c2b9a1e4b0012345678/aprovar'],
        ['PUT', '/api/access-requests/665f1c2b9a1e4b0012345678/recusar'],
    ])('%s %s responde sem Authorization (não 401)', async (metodo, caminho) => {
        const resposta = await chamar(metodo, caminho);

        expect(resposta.status).not.toBe(401);
    });
});

describe('segurança e compressão HTTP', () => {
    test('X-Content-Type-Options: nosniff presente e X-Powered-By ausente', async () => {
        const resposta = await chamar('GET', '/');
        expect(resposta.headers.get('x-content-type-options')).toBe('nosniff');
        expect(resposta.headers.get('x-powered-by')).toBeNull();
    });

    test('resposta JSON > 1 kB com Accept-Encoding: gzip vem com Content-Encoding: gzip', async () => {
        vi.mocked(Branch.find).mockReturnValueOnce({
            sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([{ _id: MATRIZ, nome: 'A'.repeat(2000), matriz: true }]),
            }),
        } as any);

        const resposta = await fetch(`${base}/api/branches`, {
            headers: {
                Authorization: `Bearer ${token()}`,
                'Accept-Encoding': 'gzip',
            },
        });

        expect(resposta.status).toBe(200);
        expect(resposta.headers.get('content-encoding')).toBe('gzip');
    });
});
