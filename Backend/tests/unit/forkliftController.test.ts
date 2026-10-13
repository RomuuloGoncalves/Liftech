import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { criar, servicoForklift } from '../../src/feature/forklift/forkliftController.js';
import { forkliftModel } from '../../src/models/forkliftModel.js';

vi.mock('../../src/feature/forklift/forkliftService.js');
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: {} }));

const FILIAL = '665f1c2b9a1e4b0012345679';

describe('forkliftController.criar: filialId', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const chamar = (body: unknown) => criar({ body } as Request, res);

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
        vi.mocked(servicoForklift.criar).mockImplementation(async (f: forkliftModel) => f);
    });

    test('201 e o service recebe o model com o filialId do corpo', async () => {
        await chamar({ id: 'EMP-001', filialId: FILIAL });

        const enviado = vi.mocked(servicoForklift.criar).mock.calls[0]![0].obterDados();
        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(enviado).toMatchObject({ id: 'EMP-001', filialId: FILIAL });
        expect(mockJson).toHaveBeenCalledWith(enviado);
    });

    test.each([
        ['ausente', undefined],
        ['que não é ObjectId', 'abc'],
    ])('400 com filialId %s', async (_caso, filialId) => {
        await chamar({ id: 'EMP-001', filialId });

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson.mock.calls[0]![0].error).toEqual([expect.objectContaining({ field: 'filialId' })]);
        expect(servicoForklift.criar).not.toHaveBeenCalled();
    });

    test('id vazio continua sendo rejeitado no mesmo formato', async () => {
        await chamar({ id: '', filialId: FILIAL });

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: [{ field: 'id', message: 'This field is required!' }] });
    });
});
