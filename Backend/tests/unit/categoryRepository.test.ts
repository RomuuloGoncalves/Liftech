import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { CategoryRepository } from '../../src/feature/category/categoryRepository.js';
import { categoryModel } from '../../src/models/categoryModel.js';

describe('CategoryRepository', () => {
    test('criar sem chave não grava a chave (fica com o default do schema)', async () => {
        const create = vi.fn().mockResolvedValue({ _id: 'c1', nome: 'Pátio', cor: '#3A9CFF', statusVinculados: [] });

        await new CategoryRepository({ create } as any).criar(new categoryModel('e1', 'Pátio', '#3A9CFF'));

        expect(create).toHaveBeenCalledWith({ empresaId: 'e1', nome: 'Pátio', cor: '#3A9CFF', statusVinculados: [] });
    });

    test('criarVarios grava a chave das categorias iniciais', async () => {
        const insertMany = vi.fn().mockResolvedValue([{ _id: 'c1' }]);

        await new CategoryRepository({ insertMany } as any).criarVarios([new categoryModel('e1', 'Ativas', '#3A9CFF', ['em_uso'], 'ativas')]);

        expect(insertMany).toHaveBeenCalledWith([{ empresaId: 'e1', chave: 'ativas', nome: 'Ativas', cor: '#3A9CFF', statusVinculados: ['em_uso'] }]);
    });

    test('converte o documento; sem chave e sem status vira null e []', async () => {
        const id = new Types.ObjectId();
        const find = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([{ _id: id, empresaId: 'e1', nome: 'Pátio', cor: '#3A9CFF' }]) });

        const [categoria] = await new CategoryRepository({ find } as any).obterTodos();

        expect(categoria).toBeInstanceOf(categoryModel);
        expect(categoria!.getID()).toBe(String(id));
        expect(categoria!.getChave()).toBeNull();
        expect(categoria!.getStatusVinculados()).toEqual([]);
    });
});
