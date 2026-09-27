import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, buscar, criar, deletar, atualizar, servicoForklift } from '../../src/feature/forklift/forkliftController.js';
import { forkliftModel } from '../../src/models/forkliftModel.js';

vi.mock('../../src/feature/forklift/forkliftService.js');
vi.mock('../../src/schemas/forklift.js');

describe('ForkliftController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        
        mockReq = {
            params: {},
            body: {}
        };
        
        mockRes = {
            status: mockStatus as unknown as (code: number) => Response,
            json: mockJson as unknown as Response['json']
        };
        
        vi.clearAllMocks();
    });

    test('listar: deve retornar 200 e lista de empilhadeiras', async () => {
        const mockArray = [new forkliftModel('EMP-001'), new forkliftModel('EMP-002')];
        vi.mocked(servicoForklift.listar).mockResolvedValue(mockArray);

        await listar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith([mockArray[0]!.obterDados(), mockArray[1]!.obterDados()]);
    });

    test('buscar: deve retornar 200 e empilhadeira quando id válido fornecido nos params', async () => {
        const mockModel = new forkliftModel('EMP-001', undefined, undefined, '123');
        vi.mocked(servicoForklift.obterPorId).mockResolvedValue(mockModel);
        
        mockReq.params = { id: '123' };

        await buscar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(mockModel.obterDados());
    });

    test('buscar: deve retornar 400 se id não for fornecido', async () => {
        await buscar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: 'ID não informado.' });
    });

    test('buscar: deve retornar 404 se serviço não encontrar empilhadeira', async () => {
        mockReq.params = { id: 'invalid-id' };
        vi.mocked(servicoForklift.obterPorId).mockRejectedValue(new Error('Empilhadeira não encontrado(a).'));

        await buscar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Empilhadeira não encontrado(a).' });
    });

    test('criar: deve retornar 201 quando dados são válidos', async () => {
        const mockModel = new forkliftModel('EMP-001', undefined, undefined, 'some-id');
        vi.mocked(servicoForklift.criar).mockResolvedValue(mockModel);

        mockReq.body = { id: 'EMP-001' };

        await criar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith(mockModel.obterDados());
    });

    test('criar: deve retornar 400 quando identificação é inválida', async () => {
        mockReq.body = { id: '' };

        await criar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            error: [
                {
                    field: "id",
                    message: "This field is required!"
                }
            ]
        });
    });

    test('criar: deve retornar 409 quando há conflito de identificação', async () => {
        mockReq.body = { id: 'EMP-001' };
        vi.mocked(servicoForklift.criar).mockRejectedValue(new Error('Já existe uma empilhadeira com a identificação "EMP-001".'));

        await criar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(409);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Já existe uma empilhadeira com a identificação "EMP-001".' });
    });

    test('atualizar: deve retornar 200 com empilhadeira atualizada', async () => {
        const mockModel = new forkliftModel('EMP-MOD', undefined, undefined, '123');
        vi.mocked(servicoForklift.atualizar).mockResolvedValue(mockModel);

        mockReq.params = { id: '123' };
        mockReq.body = { id: 'EMP-MOD' };

        await atualizar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(mockModel.obterDados());
    });

    test('atualizar: deve retornar 404 se empilhadeira não for encontrada', async () => {
        mockReq.params = { id: 'invalid-id' };
        mockReq.body = { id: 'EMP-MOD' };
        vi.mocked(servicoForklift.atualizar).mockRejectedValue(new Error('Empilhadeira não encontrado(a).'));

        await atualizar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Empilhadeira não encontrado(a).' });
    });

    test('deletar: deve retornar 200 ao excluir empilhadeira', async () => {
        const mockModel = new forkliftModel('EMP-001', undefined, undefined, '123');
        vi.mocked(servicoForklift.deletar).mockResolvedValue(mockModel);

        mockReq.params = { id: '123' };

        await deletar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({ _id: '123', message: 'Empilhadeira excluída com sucesso.' });
    });

    test('deletar: deve retornar 404 se empilhadeira não existir para exclusão', async () => {
        mockReq.params = { id: 'invalid-id' };
        vi.mocked(servicoForklift.deletar).mockRejectedValue(new Error('Empilhadeira não encontrado(a).'));

        await deletar(mockReq as Request, mockRes as Response);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Empilhadeira não encontrado(a).' });
    });
});
