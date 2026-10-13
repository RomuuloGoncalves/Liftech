import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar } from '../../src/feature/machine/machineController.js';
import { listarMaquinas } from '../../src/feature/machine/machineService.js';
import machineRouter from '../../src/feature/machine/machineRouter.js';

vi.mock('../../src/feature/machine/machineService.js', () => ({ listarMaquinas: vi.fn() }));

describe('machineController.listar', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
    });

    test('200 com o array devolvido pelo service', async () => {
        const maquinas = [{ id: 'f1', identificacao: 'EMP-081' }, { id: 'f2', identificacao: 'EMP-082' }];
        vi.mocked(listarMaquinas).mockResolvedValue(maquinas as any);

        await listar({} as Request, res);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(maquinas);
    });

    test('500 com { error: mensagem } quando o service lança', async () => {
        vi.mocked(listarMaquinas).mockRejectedValue(new Error('falha de conexão'));

        await listar({} as Request, res);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'falha de conexão' });
    });
});

describe('machineRouter', () => {
    test('expõe GET / ligado ao controller listar', () => {
        const layer = (machineRouter as any).stack.find((l: any) => l.route?.path === '/');

        expect(layer.route.methods).toEqual({ get: true });
        expect(layer.route.stack[0].handle).toBe(listar);
    });
});
