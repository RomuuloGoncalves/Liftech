import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { resetar } from '../../src/feature/reset/resetController.js';
import { resetarBanco } from '../../src/scripts/resetData.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';

vi.mock('../../src/scripts/resetData.js', () => ({ resetarBanco: vi.fn() }));

const CONTAGEM = { empresas: 1, filiais: 3, operadores: 12 };
const envOriginal = { ...process.env };

describe('resetController', () => {
    let json: ReturnType<typeof vi.fn>;
    let status: ReturnType<typeof vi.fn>;
    let res: Response;
    const req = {} as Request;

    beforeEach(() => {
        vi.clearAllMocks();
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { status, json } as unknown as Response;
        process.env.PERMITIR_RESET = 'true';
        vi.mocked(resetarBanco).mockResolvedValue(CONTAGEM as any);
    });

    afterEach(() => {
        process.env = { ...envOriginal };
    });

    test('com PERMITIR_RESET=true: reseta e responde 200 com a contagem do seed', async () => {
        await resetar(req, res);

        expect(resetarBanco).toHaveBeenCalledTimes(1);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(CONTAGEM);
    });

    test.each([undefined, 'false', 'TRUE', '1'])('com PERMITIR_RESET=%s: 404 sem tocar no banco', async (valor) => {
        if (valor === undefined) delete process.env.PERMITIR_RESET;
        else process.env.PERMITIR_RESET = valor;

        await resetar(req, res);

        expect(resetarBanco).not.toHaveBeenCalled();
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: 'Rota não encontrada.' });
    });

    test('um segundo reset enquanto o primeiro roda responde 409 e não reseta de novo', async () => {
        let terminar!: (valor: unknown) => void;
        vi.mocked(resetarBanco).mockReturnValueOnce(new Promise((resolve) => { terminar = resolve; }) as any);

        const primeiro = resetar(req, res);
        await resetar(req, res);

        expect(resetarBanco).toHaveBeenCalledTimes(1);
        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({ error: 'Reset em andamento.' });

        terminar(CONTAGEM);
        await primeiro;
    });

    test('depois que o reset termina, mesmo com erro, um novo reset é aceito', async () => {
        vi.mocked(resetarBanco).mockRejectedValueOnce(new ErroHttp(500 as any, 'falha no banco'));

        await resetar(req, res);
        expect(status).toHaveBeenLastCalledWith(500);

        await resetar(req, res);
        expect(resetarBanco).toHaveBeenCalledTimes(2);
        expect(status).toHaveBeenLastCalledWith(200);
    });
});
