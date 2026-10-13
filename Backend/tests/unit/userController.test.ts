import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { criar, servicoUser } from '../../src/feature/user/userController.js';
import { userModel } from '../../src/models/userModel.js';

vi.mock('../../src/feature/user/userService.js');
vi.mock('../../src/schemas/user.js', () => ({ User: {} }));

const EMPRESA = '665f1c2b9a1e4b0012345678';
const FILIAL = '665f1c2b9a1e4b0012345679';

describe('userController.criar: campos de escopo', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const chamar = (body: unknown) => criar({ body } as Request, res);
    const modeloEnviado = () => vi.mocked(servicoUser.criar).mock.calls[0]![0].obterDados();

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
        vi.mocked(servicoUser.criar).mockImplementation(async (u: userModel) => u);
    });

    test('201 e o service recebe empresaId, escopo e filiaisIds do corpo', async () => {
        await chamar({ nome: 'Ana', role: 'admin', empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [FILIAL] });

        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(modeloEnviado()).toMatchObject({ nome: 'Ana', role: 'admin', empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [FILIAL] });
        expect(mockJson).toHaveBeenCalledWith(modeloEnviado());
    });

    test('sem escopo e filiaisIds no corpo, o model fica sem escopo e com filiaisIds vazio', async () => {
        await chamar({ nome: 'Ana', role: 'admin', empresaId: EMPRESA });

        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(modeloEnviado().escopo).toBeUndefined();
        expect(modeloEnviado().filiaisIds).toEqual([]);
    });

    test.each([
        ['empresaId ausente', { nome: 'Ana', role: 'admin' }, 'empresaId'],
        ['empresaId que não é ObjectId', { nome: 'Ana', role: 'admin', empresaId: 'abc' }, 'empresaId'],
        ['escopo fora da lista', { nome: 'Ana', role: 'admin', empresaId: EMPRESA, escopo: 'todos' }, 'escopo'],
        ['filiaisIds com item inválido', { nome: 'Ana', role: 'admin', empresaId: EMPRESA, filiaisIds: [FILIAL, 'x'] }, 'filiaisIds'],
    ])('400 com %s', async (_caso, body, campo) => {
        await chamar(body);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson.mock.calls[0]![0].error).toEqual([expect.objectContaining({ field: campo })]);
        expect(servicoUser.criar).not.toHaveBeenCalled();
    });
});
