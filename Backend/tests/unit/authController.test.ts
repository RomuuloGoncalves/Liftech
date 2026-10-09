import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { login } from '../../src/feature/auth/authController.js';
import * as servicoAuth from '../../src/feature/auth/authService.js';

vi.mock('../../src/schemas/user.js', () => ({ User: {} }));
vi.mock('../../src/feature/auth/authService.js', async (importOriginal) => ({
    ...(await importOriginal<typeof servicoAuth>()),
    login: vi.fn(),
}));

describe('AuthController.login', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const chamar = (body: unknown) => login({ body } as Request, res);

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
    });

    test('200 com o payload do serviço quando as credenciais são válidas', async () => {
        const resultado = { token: 'tok', user: { _id: '1', nome: 'Ana', role: 'admin' } };
        vi.mocked(servicoAuth.login).mockResolvedValue(resultado);

        await chamar({ role: 'admin', login: 'ana@empresa.com', senha: 'segredo1' });

        expect(servicoAuth.login).toHaveBeenCalledWith('admin', 'ana@empresa.com', 'segredo1');
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(resultado);
    });

    test.each([
        ['role ausente', { login: 'a', senha: 'b' }],
        ['role fora da lista', { role: 'root', login: 'a', senha: 'b' }],
        ['login ausente', { role: 'admin', senha: 'b' }],
        ['login vazio', { role: 'admin', login: '   ', senha: 'b' }],
        ['senha ausente', { role: 'colaborador', login: 'a' }],
        ['senha vazia', { role: 'colaborador', login: 'a', senha: '' }],
    ])('400 quando %s', async (_caso, body) => {
        await chamar(body);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson.mock.calls[0]![0]).toHaveProperty('error');
        expect(servicoAuth.login).not.toHaveBeenCalled();
    });

    test('401 com "Credenciais inválidas." quando o serviço rejeita as credenciais', async () => {
        vi.mocked(servicoAuth.login).mockRejectedValue(new Error('Credenciais inválidas.'));

        await chamar({ role: 'admin', login: 'ana@empresa.com', senha: 'errada' });

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Credenciais inválidas.' });
    });

    test('500 em erro inesperado', async () => {
        vi.mocked(servicoAuth.login).mockRejectedValue(new Error('JWT_SECRET não configurado.'));

        await chamar({ role: 'admin', login: 'ana@empresa.com', senha: 'segredo1' });

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'JWT_SECRET não configurado.' });
    });
});
