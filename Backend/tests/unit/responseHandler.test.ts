import { describe, test, expect, vi } from 'vitest';
import type { Response } from 'express';
import { ErroHttp, StatusCode, responderErro } from '../../src/utils/responseHandler.js';

function resposta() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    return { res: { status, json } as unknown as Response, status, json };
}

describe('responderErro', () => {
    test('ErroHttp responde com o status dele e { error: mensagem }', () => {
        const { res, status, json } = resposta();

        responderErro(res, new ErroHttp(StatusCode.CONFLICT, 'Já existe.'));

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({ error: 'Já existe.' });
    });

    test('qualquer outro erro responde 500 com { error: mensagem }', () => {
        const { res, status, json } = resposta();

        responderErro(res, new Error('falha de conexão'));

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({ error: 'falha de conexão' });
    });
});
