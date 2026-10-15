import { describe, test, expect } from 'vitest';
import { exigirSemOperadores } from '../../src/utils/corpo.js';

describe('exigirSemOperadores', () => {
    test.each(['$set', '$where', '$unset'])('chave %s lança ErroHttp 400 nomeando a chave', (chave) => {
        let erro: any;
        try {
            exigirSemOperadores({ nome: 'x', [chave]: {} });
        } catch (e) {
            erro = e;
        }

        expect(erro.status).toBe(400);
        expect(erro.message).toContain(`'${chave}'`);
    });

    test('corpo sem chave começando com $ não lança, mesmo com $ no meio da chave ou nos valores', () => {
        expect(() => exigirSemOperadores({ nome: '$set', 'a$b': 1, filialId: { $in: [] } })).not.toThrow();
    });
});
