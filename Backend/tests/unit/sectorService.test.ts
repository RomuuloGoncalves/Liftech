import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { Sector } from '../../src/schemas/sector.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { atualizar, criar, excluir, exigirSetorDaFilial, listar } from '../../src/feature/sector/sectorService.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/sector.js', () => ({
    Sector: { find: vi.fn(), findOne: vi.fn(), exists: vi.fn(), create: vi.fn(), findOneAndUpdate: vi.fn(), deleteOne: vi.fn() },
}));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { countDocuments: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const F1 = new Types.ObjectId().toHexString();
const F2 = new Types.ObjectId().toHexString();
const FORA = new Types.ObjectId().toHexString();
const ID = new Types.ObjectId().toHexString();
const filiais = [{ _id: F1, nome: 'Matriz', matriz: true }, { _id: F2, nome: 'Unidade Centro', matriz: false }];
const EMPRESA: Escopo = { empresaId: 'e1', tipo: 'empresa', filiais };
const RESTRITO: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais };
const doc = (extra: object = {}) => ({ _id: new Types.ObjectId(ID), nome: 'Doca', filialId: new Types.ObjectId(F1), ...extra });
const lean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) }) as any;
const DUPLICADO = Object.assign(new Error('dup'), { code: 11000 });

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Forklift.countDocuments).mockResolvedValue(0 as any);
});

describe('listar', () => {
    const mockFind = (lista: unknown[]) => {
        const sort = vi.fn().mockReturnValue(lean(lista));
        vi.mocked(Sector.find).mockReturnValue({ sort } as any);
        return sort;
    };

    test('setores das filiais do escopo, por nome, no formato { _id, nome, filialId, filial: { nome } }', async () => {
        const sort = mockFind([doc(), doc({ nome: 'Pátio', filialId: new Types.ObjectId(F2) })]);

        const lista = await listar(EMPRESA);

        expect(Sector.find).toHaveBeenCalledWith({ filialId: { $in: [F1, F2] } });
        expect(sort).toHaveBeenCalledWith({ nome: 1 });
        expect(lista).toEqual([
            { _id: ID, nome: 'Doca', filialId: F1, filial: { nome: 'Matriz' } },
            { _id: ID, nome: 'Pátio', filialId: F2, filial: { nome: 'Unidade Centro' } },
        ]);
    });

    test('filialId do escopo filtra só essa filial', async () => {
        mockFind([]);
        await listar(EMPRESA, F2);
        expect(Sector.find).toHaveBeenCalledWith({ filialId: { $in: [F2] } });
    });

    test('filialId fora do escopo: filtro vazio (lista vazia)', async () => {
        mockFind([]);
        expect(await listar(EMPRESA, FORA)).toEqual([]);
        expect(Sector.find).toHaveBeenCalledWith({ filialId: { $in: [] } });
    });
});

describe('criar', () => {
    test('cria na filial informada e devolve o formato da API', async () => {
        vi.mocked(Sector.create).mockResolvedValue(doc() as any);

        const criado = await criar(EMPRESA, { nome: 'Doca', filialId: F1 });

        expect(Sector.create).toHaveBeenCalledWith({ nome: 'Doca', filialId: F1 });
        expect(criado).toEqual({ _id: ID, nome: 'Doca', filialId: F1, filial: { nome: 'Matriz' } });
    });

    test('nome repetido na filial (11000): 409', async () => {
        vi.mocked(Sector.create).mockRejectedValue(DUPLICADO);
        await expect(criar(EMPRESA, { nome: 'doca', filialId: F1 })).rejects.toMatchObject({
            status: 409, message: 'Já existe um setor com este nome nesta filial.',
        });
    });
});

describe('atualizar', () => {
    beforeEach(() => {
        vi.mocked(Sector.findOne).mockReturnValue(lean(doc()));
    });

    test('renomeia dentro do escopo', async () => {
        vi.mocked(Sector.findOneAndUpdate).mockReturnValue(lean(doc({ nome: 'Doca 2' })));

        const setor = await atualizar(RESTRITO, ID, { nome: 'Doca 2' });

        expect(Sector.findOne).toHaveBeenCalledWith({ _id: ID, filialId: { $in: [F1, F2] } });
        expect(Sector.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID }, { $set: { nome: 'Doca 2' } }, expect.objectContaining({ runValidators: true }));
        expect(setor).toEqual({ _id: ID, nome: 'Doca 2', filialId: F1, filial: { nome: 'Matriz' } });
    });

    test('nome repetido (11000): 409', async () => {
        vi.mocked(Sector.findOneAndUpdate).mockReturnValue({ lean: vi.fn().mockRejectedValue(DUPLICADO) } as any);
        await expect(atualizar(EMPRESA, ID, { nome: 'Pátio' })).rejects.toMatchObject({ status: 409 });
    });

    test('escopo empresa move o setor sem máquinas para outra filial', async () => {
        vi.mocked(Sector.findOneAndUpdate).mockReturnValue(lean(doc({ filialId: new Types.ObjectId(F2) })));

        const setor = await atualizar(EMPRESA, ID, { filialId: F2 });

        expect(Forklift.countDocuments).toHaveBeenCalledWith({ setorId: ID });
        expect(Sector.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID }, { $set: { filialId: F2 } }, expect.anything());
        expect(setor.filial).toEqual({ nome: 'Unidade Centro' });
    });

    test('escopo filiais mudando a filial: 403 sem gravar', async () => {
        await expect(atualizar(RESTRITO, ID, { filialId: F2 })).rejects.toMatchObject({
            status: 403, message: 'Apenas o escopo de empresa pode mover um setor de filial.',
        });
        expect(Sector.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('escopo filiais com a mesma filial: ignora e grava o nome', async () => {
        vi.mocked(Sector.findOneAndUpdate).mockReturnValue(lean(doc({ nome: 'X' })));
        await atualizar(RESTRITO, ID, { nome: 'X', filialId: F1 });
        expect(Sector.findOneAndUpdate).toHaveBeenCalledWith({ _id: ID }, { $set: { nome: 'X' } }, expect.anything());
    });

    test('filial de destino fora do escopo: 403 sem gravar', async () => {
        await expect(atualizar(EMPRESA, ID, { filialId: FORA })).rejects.toMatchObject({ status: 403 });
        expect(Sector.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('setor com máquinas mudando de filial: 409 com a contagem, sem gravar', async () => {
        vi.mocked(Forklift.countDocuments).mockResolvedValue(3 as any);
        await expect(atualizar(EMPRESA, ID, { filialId: F2 })).rejects.toMatchObject({
            status: 409, message: 'Setor com 3 máquina(s) ligada(s) não pode mudar de filial.',
        });
        expect(Sector.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('fora do escopo ou inexistente: 404', async () => {
        vi.mocked(Sector.findOne).mockReturnValue(lean(null));
        await expect(atualizar(EMPRESA, ID, { nome: 'X' })).rejects.toMatchObject({ status: 404, message: 'Setor não encontrado.' });
    });
});

describe('excluir', () => {
    test('sem máquinas: apaga e devolve { _id, message }', async () => {
        vi.mocked(Sector.exists).mockResolvedValue({ _id: ID } as any);

        expect(await excluir(EMPRESA, ID)).toEqual({ _id: ID, message: 'Setor excluído com sucesso.' });
        expect(Sector.exists).toHaveBeenCalledWith({ _id: ID, filialId: { $in: [F1, F2] } });
        expect(Sector.deleteOne).toHaveBeenCalledWith({ _id: ID });
    });

    test('com N máquinas: 409 com a contagem, sem apagar', async () => {
        vi.mocked(Sector.exists).mockResolvedValue({ _id: ID } as any);
        vi.mocked(Forklift.countDocuments).mockResolvedValue(2 as any);

        await expect(excluir(EMPRESA, ID)).rejects.toMatchObject({ status: 409, message: 'Setor com 2 máquina(s) ligada(s).' });
        expect(Sector.deleteOne).not.toHaveBeenCalled();
    });

    test('fora do escopo ou inexistente: 404', async () => {
        vi.mocked(Sector.exists).mockResolvedValue(null);
        await expect(excluir(EMPRESA, ID)).rejects.toMatchObject({ status: 404 });
        expect(Sector.deleteOne).not.toHaveBeenCalled();
    });
});

describe('exigirSetorDaFilial', () => {
    test('setor da filial: passa', async () => {
        vi.mocked(Sector.exists).mockResolvedValue({ _id: ID } as any);
        await expect(exigirSetorDaFilial(ID, F1)).resolves.toBeUndefined();
        expect(Sector.exists).toHaveBeenCalledWith({ _id: ID, filialId: F1 });
    });

    test('setor de outra filial ou inexistente: 400', async () => {
        vi.mocked(Sector.exists).mockResolvedValue(null);
        await expect(exigirSetorDaFilial(ID, F2)).rejects.toMatchObject({
            status: 400, message: 'O setor informado não pertence à filial da máquina.',
        });
    });
});
