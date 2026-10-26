import { describe, test, expect } from 'vitest';
import regras from '../../src/feature/user/userRules.js';

const opcional = (campo: string, valor: unknown) => regras.check({ [campo]: valor, isRequiredField: false });

describe('userRules: telefone e cargo opcionais', () => {
    test.each(['telefone', 'cargo'])('%s ausente é válido', (campo) => {
        expect(opcional(campo, undefined)).toBeFalsy();
    });

    test.each(['telefone', 'cargo'])('%s em texto é válido', (campo) => {
        expect(opcional(campo, '+55 99 99999999')).toBeFalsy();
    });

    test.each([
        ['telefone', 123],
        ['telefone', { ddd: 99 }],
        ['cargo', 456],
        ['cargo', ['Operador']],
    ])('%s com valor não texto (%j) gera a mensagem de validação do campo', (campo, valor) => {
        expect(opcional(campo, valor)).toEqual([{ field: campo, message: `O campo '${campo}' deve ser texto válido.` }]);
    });
});
