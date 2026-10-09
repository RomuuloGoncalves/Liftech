import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { criar } from '../../src/feature/accessRequest/accessRequestController.js';
import { AccessRequest } from '../../src/schemas/accessRequest.js';

vi.mock('../../src/schemas/accessRequest.js', () => ({ AccessRequest: { findOne: vi.fn(), create: vi.fn() } }));

const findOne = vi.mocked(AccessRequest.findOne) as unknown as ReturnType<typeof vi.fn>;
const create = vi.mocked(AccessRequest.create) as unknown as ReturnType<typeof vi.fn>;

const valido = { email: '  Ana@Empresa.COM ', nomeEmpresa: ' Acme ', nomeAdministrador: ' Ana ' };

describe('AccessRequestController.criar', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const chamar = (body: unknown) => criar({ body } as Request, res);
    const pendente = (doc: unknown) => findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(doc) });

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
    });

    test('201 com o documento criado e email normalizado', async () => {
        pendente(null);
        const criado = { _id: '1', email: 'ana@empresa.com', nomeEmpresa: 'Acme', nomeAdministrador: 'Ana', status: 'pendente' };
        create.mockResolvedValue({ toObject: () => criado });

        await chamar(valido);

        expect(findOne).toHaveBeenCalledWith({ email: 'ana@empresa.com', status: 'pendente' });
        expect(create).toHaveBeenCalledWith({ email: 'ana@empresa.com', nomeEmpresa: 'Acme', nomeAdministrador: 'Ana' });
        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith(criado);
    });

    test.each([
        ['email ausente', { ...valido, email: undefined }],
        ['email vazio', { ...valido, email: '   ' }],
        ['email inválido', { ...valido, email: 'ana@empresa' }],
        ['nomeEmpresa ausente', { ...valido, nomeEmpresa: undefined }],
        ['nomeEmpresa vazio', { ...valido, nomeEmpresa: '  ' }],
        ['nomeAdministrador ausente', { ...valido, nomeAdministrador: undefined }],
        ['nomeAdministrador vazio', { ...valido, nomeAdministrador: '' }],
        ['body ausente', undefined],
    ])('400 quando %s', async (_caso, body) => {
        await chamar(body);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson.mock.calls[0]![0]).toHaveProperty('error');
        expect(create).not.toHaveBeenCalled();
    });

    test('409 quando já existe solicitação pendente', async () => {
        pendente({ _id: 'x' });

        await chamar(valido);

        expect(mockStatus).toHaveBeenCalledWith(409);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Já existe uma solicitação pendente para este email.' });
        expect(create).not.toHaveBeenCalled();
    });

    test('500 quando create rejeita', async () => {
        pendente(null);
        create.mockRejectedValue(new Error('falha'));

        await chamar(valido);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'falha' });
    });
});
