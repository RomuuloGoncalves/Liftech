import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { UserRepository } from '../../src/feature/user/userRepository.js';

describe('userModel: credenciais', () => {
    test('o repositório lê email, usuario, senhaHash, operadorId e acessoNegado sem pô-los no obterDados', async () => {
        const id = new Types.ObjectId();
        const operadorId = new Types.ObjectId();
        const lean = vi.fn().mockResolvedValue({
            _id: id, nome: 'Ana', role: 'colaborador', email: 'ana@x.com', usuario: 'ana', senhaHash: 'hash', operadorId, acessoNegado: true,
        });
        const bd = { findById: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ lean }) }) };

        const usuario = (await new UserRepository(bd as any).buscarPorId(String(id), '+senhaHash'))!;

        expect(usuario.getEmail()).toBe('ana@x.com');
        expect(usuario.getUsuario()).toBe('ana');
        expect(usuario.getSenhaHash()).toBe('hash');
        expect(usuario.getOperadorId()).toBe(String(operadorId));
        expect(usuario.getAcessoNegado()).toBe(true);
        const dados = usuario.obterDados();
        for (const campo of ['email', 'usuario', 'senhaHash', 'operadorId', 'acessoNegado']) expect(dados).not.toHaveProperty(campo);
    });

    test('sem acessoNegado no documento, getAcessoNegado é false', async () => {
        const lean = vi.fn().mockResolvedValue({ _id: new Types.ObjectId(), nome: 'Ana', role: 'admin' });
        const bd = { findById: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ lean }) }) };

        const usuario = (await new UserRepository(bd as any).buscarPorId(String(new Types.ObjectId()), '+senhaHash'))!;

        expect(usuario.getAcessoNegado()).toBe(false);
        expect(usuario.getSenhaHash()).toBeUndefined();
    });
});
