import { describe, test, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../src/feature/user/userService.js';
import { UserRepository } from '../../src/feature/user/userRepository.js';
import { userModel } from '../../src/models/userModel.js';
import mongoose from 'mongoose';

describe('UserService', () => {
    let service: UserService;
    let repositoryMock: Partial<UserRepository>;

    beforeEach(() => {
        repositoryMock = {
            obterTodos: vi.fn(),
            obterPorId: vi.fn(),
            criar: vi.fn(),
            atualizarPorId: vi.fn(),
            deletarPorId: vi.fn(),
            obterPorNome: vi.fn(),
        };

        service = new UserService(repositoryMock as UserRepository);
    });

    test('criar: deve criar usuário quando nome não existe', async () => {
        const fakeUser = new userModel('Fulano', 'admin');
        const mockSaved = new userModel('Fulano', 'admin', new mongoose.Types.ObjectId().toHexString());

        vi.mocked(repositoryMock.obterPorNome!).mockResolvedValue(null);
        vi.mocked(repositoryMock.criar!).mockResolvedValue(mockSaved);

        const result = await service.criar(fakeUser);
        expect(result.getID()).toBeDefined();
        expect(result.getNome()).toBe('Fulano');
    });

    test('criar: deve lançar erro se nome já existe', async () => {
        const fakeUser = new userModel('Fulano', 'admin');

        vi.mocked(repositoryMock.obterPorNome!).mockResolvedValue(fakeUser);

        await expect(service.criar(fakeUser)).rejects.toThrow('Já existe um usuário com o nome "Fulano".');
    });

    test('obterPorId: deve retornar usuário existente', async () => {
        const mockSaved = new userModel('Ciclano', 'user', 'some-id');
        vi.mocked(repositoryMock.obterPorId!).mockResolvedValue(mockSaved);

        const result = await service.obterPorId('some-id');
        expect(result).toEqual(mockSaved);
    });

    test('obterPorId: deve lançar erro se usuário não existir', async () => {
        vi.mocked(repositoryMock.obterPorId!).mockResolvedValue(null);

        await expect(service.obterPorId('invalid-id')).rejects.toThrow('Usuário não encontrado(a).');
    });

    test('listar: deve retornar array de usuários', async () => {
        const mockArray = [new userModel('Fulano', 'admin'), new userModel('Ciclano', 'user')];
        vi.mocked(repositoryMock.obterTodos!).mockResolvedValue(mockArray);

        const result = await service.listar();
        expect(result.length).toBe(2);
    });

    test('atualizar: deve retornar usuário atualizado', async () => {
        const mockUpdated = new userModel('Fulano Atualizado', 'admin', 'some-id');
        vi.mocked(repositoryMock.atualizarPorId!).mockResolvedValue(mockUpdated);

        const result = await service.atualizar('some-id', { nome: 'Fulano Atualizado' });
        expect(result.getNome()).toBe('Fulano Atualizado');
    });

    test('atualizar: deve lançar erro se não encontrar usuário', async () => {
        vi.mocked(repositoryMock.atualizarPorId!).mockResolvedValue(null);

        await expect(service.atualizar('some-id', { nome: 'Fulano Atualizado' })).rejects.toThrow('Usuário não encontrado(a).');
    });

    test('deletar: deve retornar usuário deletado', async () => {
        const mockDeleted = new userModel('Fulano', 'admin', 'some-id');
        vi.mocked(repositoryMock.deletarPorId!).mockResolvedValue(mockDeleted);

        const result = await service.deletar('some-id');
        expect(result.getNome()).toBe('Fulano');
    });

    test('deletar: deve lançar erro se usuário não existir', async () => {
        vi.mocked(repositoryMock.deletarPorId!).mockResolvedValue(null);

        await expect(service.deletar('invalid-id')).rejects.toThrow('Usuário não encontrado(a).');
    });
});
