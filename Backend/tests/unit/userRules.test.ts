import { describe, test, expect } from 'vitest';
import regras from '../../src/feature/user/userRules.js';

describe('userRules: telefone e cargo opcionais', () => {
    test('campos ausentes do objeto verificado são válidos', () => {
        expect(regras.check({})).toBeFalsy();
    });

    test.each(['telefone', 'cargo'])('%s em texto é válido', (campo) => {
        expect(regras.check({ [campo]: '+55 99 99999999' })).toBeFalsy();
    });

    test.each([
        ['telefone', 123],
        ['telefone', { ddd: 99 }],
        ['cargo', 456],
        ['cargo', ['Operador']],
    ])('%s com valor não texto (%j) gera a mensagem de validação do campo', (campo, valor) => {
        const erros = regras.check({ [campo]: valor });

        expect(erros).toEqual([{ field: campo, message: `O campo '${campo}' deve ser texto válido.` }]);
    });

    test.each(['telefone', 'cargo'])('%s null gera erro de validação do campo', (campo) => {
        const erros = regras.check({ [campo]: null });

        expect(erros).toHaveLength(1);
        expect(erros[0].field).toBe(campo);
    });
});
