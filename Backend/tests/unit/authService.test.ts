import { describe, test, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { login } from '../../src/feature/auth/authService.js';
import { User } from '../../src/schemas/user.js';
import { env } from '../../src/config/env.js';
import { gerarHashSenha } from '../../src/utils/senha.js';

vi.mock('../../src/schemas/user.js', () => ({ User: { findOne: vi.fn() } }));

const SEGREDO = 'segredo-de-teste';
const ID = '665f1c2b9a1e4b0012345678';

function mockarBusca(documento: Record<string, unknown> | null) {
    const lean = vi.fn().mockResolvedValue(documento);
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(User.findOne).mockReturnValue({ select } as any);
    return { select };
}

describe('authService.login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        env.jwt_secret = SEGREDO;
        env.jwt_expires_in = '8h';
    });

    test('admin com senha correta: retorna token e user sem senhaHash', async () => {
        const { select } = mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', email: 'ana@empresa.com', senhaHash: gerarHashSenha('segredo1') });

        const resultado = await login('admin', 'ana@empresa.com', 'segredo1');

        expect(User.findOne).toHaveBeenCalledWith({ role: 'admin', email: 'ana@empresa.com' });
        expect(select).toHaveBeenCalledWith('+senhaHash');
        expect(resultado.user).toEqual({ _id: ID, nome: 'Ana', role: 'admin' });
        expect(resultado).not.toHaveProperty('user.senhaHash');
        const payload = jwt.verify(resultado.token, SEGREDO) as jwt.JwtPayload;
        expect(payload.sub).toBe(ID);
        expect(payload.role).toBe('admin');
    });

    test('colaborador com senha correta: busca por usuario e retorna role colaborador', async () => {
        mockarBusca({ _id: ID, nome: 'Bruno', role: 'colaborador', usuario: 'bruno.op', senhaHash: gerarHashSenha('segredo2') });

        const resultado = await login('colaborador', 'bruno.op', 'segredo2');

        expect(User.findOne).toHaveBeenCalledWith({ role: 'colaborador', usuario: 'bruno.op' });
        expect(resultado.user).toEqual({ _id: ID, nome: 'Bruno', role: 'colaborador' });
        expect((jwt.verify(resultado.token, SEGREDO) as jwt.JwtPayload).role).toBe('colaborador');
    });

    test('senha errada: lança "Credenciais inválidas."', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', senhaHash: gerarHashSenha('segredo1') });
        await expect(login('admin', 'ana@empresa.com', 'errada')).rejects.toThrow('Credenciais inválidas.');
    });

    test('login inexistente (ou de outro role): lança "Credenciais inválidas."', async () => {
        mockarBusca(null);
        await expect(login('colaborador', 'ninguem', 'qualquer')).rejects.toThrow('Credenciais inválidas.');
    });

    test('usuário sem senhaHash: lança "Credenciais inválidas."', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin' });
        await expect(login('admin', 'ana@empresa.com', 'qualquer')).rejects.toThrow('Credenciais inválidas.');
    });

    test('email com maiúsculas e espaços: normaliza antes de buscar', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', senhaHash: gerarHashSenha('segredo1') });
        await login('admin', '  Ana@Empresa.COM ', 'segredo1');
        expect(User.findOne).toHaveBeenCalledWith({ role: 'admin', email: 'ana@empresa.com' });
    });

    test('sem JWT_SECRET: lança erro de configuração e não consulta o banco', async () => {
        env.jwt_secret = undefined;
        await expect(login('admin', 'ana@empresa.com', 'segredo1')).rejects.toThrow('JWT_SECRET não configurado.');
        expect(User.findOne).not.toHaveBeenCalled();
    });
});
