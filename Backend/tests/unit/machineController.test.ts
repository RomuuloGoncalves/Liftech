import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar } from '../../src/feature/machine/machineController.js';
import { listarMaquinas } from '../../src/feature/machine/machineService.js';
import machineRouter from '../../src/feature/machine/machineRouter.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/machine/machineService.js', () => ({ listarMaquinas: vi.fn() }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const ESCOPO: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [{ _id: '665f1c2b9a1e4b00123456b1', nome: 'Matriz', matriz: true }] };
const req = (query: object = {}) => ({ escopo: ESCOPO, query }) as unknown as Request;

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

        await listar(req(), res);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(maquinas);
        expect(listarMaquinas).toHaveBeenCalledWith(ESCOPO, undefined);
    });

    test('passa o filialId da query ao service junto com o escopo', async () => {
        vi.mocked(listarMaquinas).mockResolvedValue([]);

        await listar(req({ filialId: '665f1c2b9a1e4b00123456b1' }), res);

        expect(listarMaquinas).toHaveBeenCalledWith(ESCOPO, '665f1c2b9a1e4b00123456b1');
        expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test.each([
        ['que não é ObjectId', 'abc'],
        ['vazio', ''],
        ['repetido na query', ['665f1c2b9a1e4b00123456b1', '665f1c2b9a1e4b00123456b2']],
    ])('400 com filialId %s, sem chamar o service', async (_caso, filialId) => {
        await listar(req({ filialId }), res);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson.mock.calls[0]![0]).toHaveProperty('error');
        expect(listarMaquinas).not.toHaveBeenCalled();
    });

    test('500 com { error: mensagem } quando o service lança', async () => {
        vi.mocked(listarMaquinas).mockRejectedValue(new Error('falha de conexão'));

        await listar(req(), res);

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
