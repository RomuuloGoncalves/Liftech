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

    test('obterTodos com opções aplica ordenação, limite e populate antes do lean', async () => {
        const consulta: Record<string, ReturnType<typeof vi.fn>> = {};
        for (const etapa of ['sort', 'limit', 'populate']) consulta[etapa] = vi.fn(() => consulta);
        consulta.lean = vi.fn().mockResolvedValue([{ _id: 'a' }]);
        const bd = { find: vi.fn().mockReturnValue(consulta) };
        const repositorio = new ItemRepository(bd as unknown as mongoose.Model<any>);

        const itens = await repositorio.obterTodos(FILTRO, {
            ordenacao: { inicio: -1 }, limite: 500, popular: { caminho: 'responsavelId', campos: 'nome' },
        });

        expect(bd.find).toHaveBeenCalledWith(FILTRO);
        expect(consulta.sort).toHaveBeenCalledWith({ inicio: -1 });
        expect(consulta.limit).toHaveBeenCalledWith(500);
        expect(consulta.populate).toHaveBeenCalledWith('responsavelId', 'nome');
        expect(itens.map((i) => i.dados)).toEqual([{ _id: 'a' }]);
    });

    test('obterTodos com lista de populate popula na ordem; sem campos chama populate com um argumento', async () => {
        const consulta: Record<string, ReturnType<typeof vi.fn>> = {};
        for (const etapa of ['sort', 'populate']) consulta[etapa] = vi.fn(() => consulta);
        consulta.lean = vi.fn().mockResolvedValue([]);
        const bd = { find: vi.fn().mockReturnValue(consulta) };

        await new ItemRepository(bd as unknown as mongoose.Model<any>).obterTodos({}, {
            ordenacao: { identificacao: 1 }, popular: [{ caminho: 'dispositivoConectadoId' }, { caminho: 'operadorConectadoId' }],
        });

        expect(consulta.populate!.mock.calls).toEqual([['dispositivoConectadoId'], ['operadorConectadoId']]);
    });

    test('criarDados grava os dados como vieram e converte o documento', async () => {
        const bd = { create: vi.fn().mockResolvedValue({ toObject: () => ({ _id: 'a', x: 1 }) }) };

        const criado = await new ItemRepository(bd as unknown as mongoose.Model<any>).criarDados({ x: 1 });

        expect(bd.create).toHaveBeenCalledWith({ x: 1 });
        expect(criado.dados).toEqual({ _id: 'a', x: 1 });
    });

    test('obterTodos com limite 0 ainda aplica o limite', async () => {
        const consulta: Record<string, ReturnType<typeof vi.fn>> = { limit: vi.fn(() => consulta), lean: vi.fn().mockResolvedValue([]) };
        const bd = { find: vi.fn().mockReturnValue(consulta) };

        await new ItemRepository(bd as unknown as mongoose.Model<any>).obterTodos({}, { limite: 0 });

        expect(consulta.limit).toHaveBeenCalledWith(0);
    });

    test.each([[1, true], [0, false]])('atualizarUm com %i documento casado devolve %s', async (casados, esperado) => {
        const bd = { updateOne: vi.fn().mockResolvedValue({ matchedCount: casados }) };
        const repositorio = new ItemRepository(bd as unknown as mongoose.Model<any>);

        await expect(repositorio.atualizarUm({ empilhadeiraId: 'e1', fim: null }, { $set: { fim: 'x' } })).resolves.toBe(esperado);
        expect(bd.updateOne).toHaveBeenCalledWith({ empilhadeiraId: 'e1', fim: null }, { $set: { fim: 'x' } });
    });

    test.each([[{ _id: 'a' }, true], [null, false]])('existe com %j devolve %s', async (retorno, esperado) => {
        const bd = { exists: vi.fn().mockResolvedValue(retorno) };

        await expect(new ItemRepository(bd as unknown as mongoose.Model<any>).existe(FILTRO)).resolves.toBe(esperado);
        expect(bd.exists).toHaveBeenCalledWith(FILTRO);
    });

    test('criarVarios grava os dados dos modelos e devolve os _id do banco na ordem', async () => {
        const ids = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
        const bd = { insertMany: vi.fn().mockResolvedValue(ids.map((_id) => ({ _id }))) };

        const criados = await new ItemRepository(bd as unknown as mongoose.Model<any>).criarVarios([new Item({ n: 1 }), new Item({ n: 2 })]);

        expect(bd.insertMany).toHaveBeenCalledWith([{ n: 1 }, { n: 2 }]);
        expect(criados[0]).toBe(ids[0]);
        expect(criados[1]).toBe(ids[1]);
    });

    test('atualizarVarios repassa filtro e dados ao updateMany', async () => {
        const bd = { updateMany: vi.fn().mockResolvedValue({ matchedCount: 2 }) };

        await new ItemRepository(bd as unknown as mongoose.Model<any>).atualizarVarios({ categoriaId: 'c1' }, { $set: { categoriaId: null } });

        expect(bd.updateMany).toHaveBeenCalledWith({ categoriaId: 'c1' }, { $set: { categoriaId: null } });
    });

    test('buscarPorId busca pelo _id com os campos pedidos', async () => {
        const lean = vi.fn().mockResolvedValue({ _id: ID, senhaHash: 'h' });
        const select = vi.fn().mockReturnValue({ lean });
        const bd = { findById: vi.fn().mockReturnValue({ select }) };

        const item = await new ItemRepository(bd as unknown as mongoose.Model<any>).buscarPorId(ID, '+senhaHash');

        expect(bd.findById).toHaveBeenCalledWith(ID);
        expect(select).toHaveBeenCalledWith('+senhaHash');
        expect(item!.dados).toEqual({ _id: ID, senhaHash: 'h' });
    });

    test('buscarPorId devolve null sem documento ou com id inválido (sem consultar)', async () => {
        const bd = { findById: vi.fn().mockReturnValue({ select: () => ({ lean: vi.fn().mockResolvedValue(null) }) }) };
        const repositorio = new ItemRepository(bd as unknown as mongoose.Model<any>);

        expect(await repositorio.buscarPorId(ID, '+senhaHash')).toBeNull();
        expect(await repositorio.buscarPorId('abc', '+senhaHash')).toBeNull();
        expect(bd.findById).toHaveBeenCalledTimes(1);
    });

    test('buscarPorId sem campos não chama select', async () => {
        const bd = { findById: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: ID }) }) };

        const item = await new ItemRepository(bd as unknown as mongoose.Model<any>).buscarPorId(ID);

        expect(bd.findById).toHaveBeenCalledWith(ID);
        expect(item!.dados).toEqual({ _id: ID });
    });

    test('obterUm busca pelo filtro, com select só quando há campos', async () => {
        const lean = vi.fn().mockResolvedValue({ _id: ID });
        const select = vi.fn().mockReturnValue({ lean });
        const bd = { findOne: vi.fn().mockReturnValueOnce({ select }).mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) }) };
        const repositorio = new ItemRepository(bd as unknown as mongoose.Model<any>);

        expect((await repositorio.obterUm({ email: 'a@b.c' }, '+senhaHash'))!.dados).toEqual({ _id: ID });
        expect(select).toHaveBeenCalledWith('+senhaHash');
        expect(await repositorio.obterUm({ email: 'x@y.z' })).toBeNull();
        expect(bd.findOne).toHaveBeenNthCalledWith(2, { email: 'x@y.z' });
    });

    test('atualizarPorId com returnDocument repassa as opções sem acrescentar new', async () => {
        const { bd, repositorio } = criarRepositorio({ _id: ID });

        await repositorio.atualizarPorId(ID, { $set: { a: 1 } }, { returnDocument: 'after', runValidators: true });

        expect(bd.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID }, { $set: { a: 1 } }, { returnDocument: 'after', runValidators: true });
    });

    test('contar devolve o countDocuments do filtro', async () => {
        const bd = { countDocuments: vi.fn().mockResolvedValue(3) };

        await expect(new ItemRepository(bd as unknown as mongoose.Model<any>).contar({ setorId: 's1' })).resolves.toBe(3);
        expect(bd.countDocuments).toHaveBeenCalledWith({ setorId: 's1' });
    });

    test.each([[{ deletedCount: 1 }, true], [{ deletedCount: 0 }, false], [{}, false]])('deletarUm apaga pelo filtro; com %j devolve %s', async (resultado, esperado) => {
        const bd = { deleteOne: vi.fn().mockResolvedValue(resultado) };

        await expect(new ItemRepository(bd as unknown as mongoose.Model<any>).deletarUm({ _id: ID })).resolves.toBe(esperado);
        expect(bd.deleteOne).toHaveBeenCalledWith({ _id: ID });
    });

    test('deletarVarios repassa o filtro ao deleteMany', async () => {
        const bd = { deleteMany: vi.fn().mockResolvedValue({ deletedCount: 2 }) };

        await new ItemRepository(bd as unknown as mongoose.Model<any>).deletarVarios({ operadorId: 'o1' });

        expect(bd.deleteMany).toHaveBeenCalledWith({ operadorId: 'o1' });
    });

    test('obterIds devolve os _id do filtro', async () => {
        const distinct = vi.fn().mockResolvedValue(['a', 'b']);
        const bd = { find: vi.fn().mockReturnValue({ distinct }) };

        await expect(new ItemRepository(bd as unknown as mongoose.Model<any>).obterIds(FILTRO)).resolves.toEqual(['a', 'b']);
        expect(bd.find).toHaveBeenCalledWith(FILTRO);
        expect(distinct).toHaveBeenCalledWith('_id');
    });

    test('distinto devolve o distinct do campo no filtro', async () => {
        const bd = { distinct: vi.fn().mockResolvedValue(['EMP-001']) };

        await expect(new ItemRepository(bd as unknown as mongoose.Model<any>).distinto('matricula', { filialId: 'f1' })).resolves.toEqual(['EMP-001']);
        expect(bd.distinct).toHaveBeenCalledWith('matricula', { filialId: 'f1' });
    });

    test('criar sem options grava o objeto do modelo e aceita documento sem toObject', async () => {
        const bd = { create: vi.fn().mockResolvedValue({ _id: 'a', nome: 'x' }) };
        const repositorio = new ItemRepository(bd as unknown as mongoose.Model<any>);

        const criado = await repositorio.criar(new Item({ nome: 'x' }));

        expect(bd.create).toHaveBeenCalledWith({ nome: 'x' });
        expect(criado!.dados).toEqual({ _id: 'a', nome: 'x' });
    });

    test('criar com options usa a forma em lista e lê o documento com toObject', async () => {
        const options = { session: {} } as mongoose.SaveOptions;
        const bd = { create: vi.fn().mockResolvedValue([{ toObject: () => ({ _id: 'a', nome: 'x' }) }]) };
        const repositorio = new ItemRepository(bd as unknown as mongoose.Model<any>);

        const criado = await repositorio.criar(new Item({ nome: 'x' }), options);

        expect(bd.create).toHaveBeenCalledWith([{ nome: 'x' }], options);
        expect(criado!.dados).toEqual({ _id: 'a', nome: 'x' });
    });

    test.each([[undefined], [[]]])('criar devolve null quando o model não devolve documento (%j)', async (retorno) => {
        const bd = { create: vi.fn().mockResolvedValue(retorno) };
        const repositorio = new ItemRepository(bd as unknown as mongoose.Model<any>);
        const options = Array.isArray(retorno) ? ({} as mongoose.SaveOptions) : undefined;

        expect(await repositorio.criar(new Item({}), options)).toBeNull();
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
