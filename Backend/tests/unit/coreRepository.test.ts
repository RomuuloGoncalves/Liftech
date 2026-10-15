import { describe, test, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { RepositoryBase } from '../../src/core/coreRepository.js';
import { coreModel } from '../../src/core/coreModel.js';

class Item extends coreModel {
    constructor(readonly dados: Record<string, unknown>) {
        super();
    }
    obterDados() {
        return this.dados;
    }
}

class ItemRepository extends RepositoryBase<Item> {
    protected converterParaModelo(documento: Record<string, unknown>) {
        return new Item(documento);
    }
}

const ID = new mongoose.Types.ObjectId().toHexString();
const FILTRO = { filialId: { $in: ['f1'] } };

function criarRepositorio(resultado: unknown) {
    const lean = vi.fn().mockResolvedValue(resultado);
    const bd = {
        find: vi.fn().mockReturnValue({ lean }),
        findOne: vi.fn().mockReturnValue({ lean }),
        findOneAndUpdate: vi.fn().mockReturnValue({ lean }),
        findOneAndDelete: vi.fn().mockReturnValue({ lean }),
    };
    return { bd, repositorio: new ItemRepository(bd as unknown as mongoose.Model<any>) };
}

describe('RepositoryBase: filtro de escopo', () => {
    beforeEach(() => vi.clearAllMocks());

    test('obterTodos(filtro) consulta com o filtro; sem filtro consulta com {}', async () => {
        const { bd, repositorio } = criarRepositorio([{ _id: 'a' }]);

        const comFiltro = await repositorio.obterTodos(FILTRO);
        await repositorio.obterTodos();

        expect(bd.find).toHaveBeenNthCalledWith(1, FILTRO);
        expect(bd.find).toHaveBeenNthCalledWith(2, {});
        expect(comFiltro.map((i) => i.dados)).toEqual([{ _id: 'a' }]);
    });

    test('obterPorId(id, filtro) busca pelo _id e pelo filtro juntos', async () => {
        const { bd, repositorio } = criarRepositorio({ _id: ID });

        const item = await repositorio.obterPorId(ID, FILTRO);

        expect(bd.findOne).toHaveBeenCalledWith({ filialId: { $in: ['f1'] }, _id: ID });
        expect(item!.dados).toEqual({ _id: ID });
    });

    test('obterPorId devolve null quando o documento está fora do filtro', async () => {
        const { repositorio } = criarRepositorio(null);

        expect(await repositorio.obterPorId(ID, FILTRO)).toBeNull();
    });

    test('atualizarPorId(id, dados, options, filtro) atualiza só o documento do _id que casa o filtro', async () => {
        const { bd, repositorio } = criarRepositorio({ _id: ID, nome: 'novo' });

        const item = await repositorio.atualizarPorId(ID, { nome: 'novo' }, undefined, FILTRO);

        expect(bd.findOneAndUpdate).toHaveBeenCalledWith({ filialId: { $in: ['f1'] }, _id: ID }, { nome: 'novo' }, { new: true });
        expect(item!.dados).toEqual({ _id: ID, nome: 'novo' });
    });

    test('atualizarPorId devolve null quando o documento está fora do filtro', async () => {
        const { repositorio } = criarRepositorio(null);

        expect(await repositorio.atualizarPorId(ID, { nome: 'x' }, undefined, FILTRO)).toBeNull();
    });

    test('deletarPorId(id, filtro) apaga só o documento do _id que casa o filtro', async () => {
        const { bd, repositorio } = criarRepositorio({ _id: ID });

        const item = await repositorio.deletarPorId(ID, FILTRO);

        expect(bd.findOneAndDelete).toHaveBeenCalledWith({ filialId: { $in: ['f1'] }, _id: ID });
        expect(item!.dados).toEqual({ _id: ID });
    });

    test('deletarPorId devolve null quando o documento está fora do filtro', async () => {
        const { repositorio } = criarRepositorio(null);

        expect(await repositorio.deletarPorId(ID, FILTRO)).toBeNull();
    });

    test('um _id dentro do filtro nunca vence o _id pedido', async () => {
        const { bd, repositorio } = criarRepositorio(null);
        const outro = new mongoose.Types.ObjectId().toHexString();

        await repositorio.obterPorId(ID, { _id: outro });
        await repositorio.atualizarPorId(ID, {}, undefined, { _id: outro });
        await repositorio.deletarPorId(ID, { _id: outro });

        expect(bd.findOne).toHaveBeenCalledWith({ _id: ID });
        expect(bd.findOneAndUpdate.mock.calls[0]![0]).toEqual({ _id: ID });
        expect(bd.findOneAndDelete).toHaveBeenCalledWith({ _id: ID });
    });

    test('id inválido devolve null sem consultar o model', async () => {
        const { bd, repositorio } = criarRepositorio({ _id: ID });

        expect(await repositorio.obterPorId('abc', FILTRO)).toBeNull();
        expect(await repositorio.atualizarPorId('abc', {}, undefined, FILTRO)).toBeNull();
        expect(await repositorio.deletarPorId('abc', FILTRO)).toBeNull();
        expect(bd.findOne).not.toHaveBeenCalled();
        expect(bd.findOneAndUpdate).not.toHaveBeenCalled();
        expect(bd.findOneAndDelete).not.toHaveBeenCalled();
    });
});
