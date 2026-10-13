import { describe, test, expect } from 'vitest';
import { userModel } from '../../src/models/userModel.js';

describe('userModel', () => {
    test('chamada posicional antiga (nome, role, id) continua válida e não traz telefone nem cargo', () => {
        const dados = new userModel('Bruno', 'colaborador', 'abc').obterDados();

        expect(dados).toEqual({ _id: 'abc', nome: 'Bruno', role: 'colaborador' });
        expect(dados).not.toHaveProperty('telefone');
        expect(dados).not.toHaveProperty('cargo');
    });

    test('telefone e cargo informados aparecem em obterDados', () => {
        const dados = new userModel('Bruno', 'colaborador', 'abc', '+55 99 99999999', 'Operador').obterDados();

        expect(dados).toEqual({
            _id: 'abc',
            nome: 'Bruno',
            role: 'colaborador',
            telefone: '+55 99 99999999',
            cargo: 'Operador',
        });
    });

    test('só um dos dois campos: o outro fica fora de obterDados', () => {
        const dados = new userModel('Bruno', 'colaborador', undefined, undefined, 'Operador').obterDados();

        expect(dados).toEqual({ nome: 'Bruno', role: 'colaborador', cargo: 'Operador' });
        expect(dados).not.toHaveProperty('telefone');
    });
});
