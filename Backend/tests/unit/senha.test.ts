import { describe, test, expect } from 'vitest';
import { gerarHashSenha, verificarSenha } from '../../src/utils/senha.js';

describe('senha', () => {
    test('verificarSenha: retorna true para a senha correta', () => {
        expect(verificarSenha('minhaSenha123', gerarHashSenha('minhaSenha123'))).toBe(true);
    });

    test('verificarSenha: retorna false para senha errada', () => {
        expect(verificarSenha('outraSenha', gerarHashSenha('minhaSenha123'))).toBe(false);
    });

    test('verificarSenha: retorna false para hash malformado sem lançar erro', () => {
        expect(verificarSenha('minhaSenha123', 'semSeparador')).toBe(false);
        expect(verificarSenha('minhaSenha123', 'salt:curto')).toBe(false);
        expect(verificarSenha('minhaSenha123', '')).toBe(false);
    });

    test('gerarHashSenha: usa salt, então dois hashes da mesma senha diferem', () => {
        const a = gerarHashSenha('minhaSenha123');
        const b = gerarHashSenha('minhaSenha123');
        expect(a).not.toBe(b);
        expect(a).not.toContain('minhaSenha123');
    });
});
