import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ForkliftService } from '../forkliftService.js';
import { ForkliftRepository } from '../forkliftRepository.js';
import { forkliftModel } from '../../../models/forkliftModel.js';
import mongoose from 'mongoose';
import { Forklift } from '../../../schemas/forklift.js';

describe('ForkliftService', () => {
    let service: ForkliftService;
    let repositoryMock: Partial<ForkliftRepository>;

    beforeEach(() => {
        repositoryMock = {
            obterTodos: vi.fn(),
            obterPorId: vi.fn(),
            criar: vi.fn(),
            atualizarPorId: vi.fn(),
            deletarPorId: vi.fn(),
            obterPorIdentificacao: vi.fn(),
        };

        // Casting to avoid TS errors on protected properties and missing Mongoose properties
        service = new ForkliftService(repositoryMock as ForkliftRepository);
    });

    test('criar: deve criar empilhadeira quando identificação não existe', async () => {
        const fakeForklift = new forkliftModel('EMP-001', 'disp-123', 'op-123');
        const mockSaved = new forkliftModel('EMP-001', 'disp-123', 'op-123', new mongoose.Types.ObjectId().toHexString());

        vi.mocked(repositoryMock.obterPorIdentificacao!).mockResolvedValue(null);
        vi.mocked(repositoryMock.criar!).mockResolvedValue(mockSaved);

        const result = await service.criar(fakeForklift);
        expect(result.getID()).toBeDefined();
        expect(result.getIdentificacao()).toBe('EMP-001');
    });

    test('criar: deve lançar erro se identificação já existe', async () => {
        const fakeForklift = new forkliftModel('EMP-001');
        
        // Simula que a empilhadeira já existe no banco
        vi.mocked(repositoryMock.obterPorIdentificacao!).mockResolvedValue(fakeForklift);

        await expect(service.criar(fakeForklift)).rejects.toThrow('Já existe uma empilhadeira com a identificação "EMP-001".');
    });

    test('obterPorId: deve retornar empilhadeira existente', async () => {
        const mockSaved = new forkliftModel('EMP-002', undefined, undefined, 'some-id');
        vi.mocked(repositoryMock.obterPorId!).mockResolvedValue(mockSaved);

        const result = await service.obterPorId('some-id');
        expect(result).toEqual(mockSaved);
    });

    test('obterPorId: deve lançar erro se empilhadeira não existir', async () => {
        vi.mocked(repositoryMock.obterPorId!).mockResolvedValue(null);

        await expect(service.obterPorId('invalid-id')).rejects.toThrow('Empilhadeira não encontrado(a).');
    });

    test('listar: deve retornar array de empilhadeiras', async () => {
        const mockArray = [new forkliftModel('EMP-001'), new forkliftModel('EMP-002')];
        vi.mocked(repositoryMock.obterTodos!).mockResolvedValue(mockArray);

        const result = await service.listar();
        expect(result.length).toBe(2);
    });

    test('atualizar: deve retornar empilhadeira atualizada', async () => {
        const mockUpdated = new forkliftModel('EMP-MODIFIED', undefined, undefined, 'some-id');
        vi.mocked(repositoryMock.atualizarPorId!).mockResolvedValue(mockUpdated);

        const result = await service.atualizar('some-id', { identificacao: 'EMP-MODIFIED' });
        expect(result.getIdentificacao()).toBe('EMP-MODIFIED');
    });

    test('atualizar: deve lançar erro se não encontrar empilhadeira', async () => {
        vi.mocked(repositoryMock.atualizarPorId!).mockResolvedValue(null);

        await expect(service.atualizar('some-id', { identificacao: 'EMP-MODIFIED' })).rejects.toThrow('Empilhadeira não encontrado(a).');
    });

    test('deletar: deve retornar empilhadeira deletada', async () => {
        const mockDeleted = new forkliftModel('EMP-TO-DELETE', undefined, undefined, 'some-id');
        vi.mocked(repositoryMock.deletarPorId!).mockResolvedValue(mockDeleted);

        const result = await service.deletar('some-id');
        expect(result.getIdentificacao()).toBe('EMP-TO-DELETE');
    });

    test('deletar: deve lançar erro se empilhadeira não existir', async () => {
        vi.mocked(repositoryMock.deletarPorId!).mockResolvedValue(null);

        await expect(service.deletar('invalid-id')).rejects.toThrow('Empilhadeira não encontrado(a).');
    });
});
