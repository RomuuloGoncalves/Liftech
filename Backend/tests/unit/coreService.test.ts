import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ServiceBase } from '../../src/core/coreService.js';
import { RepositoryBase } from '../../src/core/coreRepository.js';
import { coreModel } from '../../src/core/coreModel.js';

class Item extends coreModel {
    obterDados() {
        return {};
    }
}

class ItemService extends ServiceBase<Item, RepositoryBase<Item>> {
    protected readonly nomeEntidade = 'Item';
}

const FILTRO = { filialId: { $in: ['f1'] } };

describe('ServiceBase: filtro de escopo', () => {
    let repositorio: Record<string, ReturnType<typeof vi.fn>>;
    let service: ItemService;

    beforeEach(() => {
        repositorio = {
            obterTodos: vi.fn().mockResolvedValue([new Item()]),
            obterPorId: vi.fn().mockResolvedValue(new Item()),
            atualizarPorId: vi.fn().mockResolvedValue(new Item()),
            deletarPorId: vi.fn().mockResolvedValue(new Item()),
        };
        service = new ItemService(repositorio as unknown as RepositoryBase<Item>);
    });

    test('listar repassa o filtro', async () => {
        await service.listar(FILTRO);

        expect(repositorio.obterTodos).toHaveBeenCalledWith(FILTRO);
    });

    test('obterPorId repassa o id e o filtro', async () => {
        await service.obterPorId('i1', FILTRO);

        expect(repositorio.obterPorId).toHaveBeenCalledWith('i1', FILTRO);
    });

    test('atualizar repassa id, dados e o filtro na quarta posição', async () => {
        await service.atualizar('i1', { nome: 'x' }, FILTRO);

        expect(repositorio.atualizarPorId).toHaveBeenCalledWith('i1', { nome: 'x' }, undefined, FILTRO);
    });

    test('deletar repassa o id e o filtro', async () => {
        await service.deletar('i1', FILTRO);

        expect(repositorio.deletarPorId).toHaveBeenCalledWith('i1', FILTRO);
    });

    test.each([
        ['obterPorId', (s: ItemService) => s.obterPorId('i1', FILTRO), 'obterPorId'],
        ['atualizar', (s: ItemService) => s.atualizar('i1', {}, FILTRO), 'atualizarPorId'],
        ['deletar', (s: ItemService) => s.deletar('i1', FILTRO), 'deletarPorId'],
    ])('%s: repository sem resultado (fora do filtro) lança "Item não encontrado(a)."', async (_nome, chamar, metodo) => {
        repositorio[metodo]!.mockResolvedValue(null);

        await expect(chamar(service)).rejects.toThrow('Item não encontrado(a).');
    });
});
