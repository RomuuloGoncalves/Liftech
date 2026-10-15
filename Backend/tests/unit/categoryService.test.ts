import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { Category } from '../../src/schemas/category.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { atualizar, criar, criarQuadroInicial, excluir, listar, posicionarSemCategoria } from '../../src/feature/category/categoryService.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/category.js', () => ({
    Category: { find: vi.fn(), exists: vi.fn(), create: vi.fn(), findOneAndUpdate: vi.fn(), findOne: vi.fn(), deleteOne: vi.fn(), insertMany: vi.fn() },
}));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { updateMany: vi.fn() } }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: {} }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const EMPRESA = new Types.ObjectId().toHexString();
const ESCOPO: Escopo = { empresaId: EMPRESA, tipo: 'empresa', filiais: [] };
const DA_EMPRESA = { empresaId: { $in: [EMPRESA] } };
const ID = new Types.ObjectId().toHexString();
const doc = (extra: object = {}) => ({ _id: new Types.ObjectId(ID), nome: 'Pátio', cor: '#3A9CFF', chave: null, statusVinculados: [], ...extra });
const lean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) }) as any;

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Category.exists).mockResolvedValue(null);
});

describe('listar', () => {
    test('só as da empresa, na ordem de criação, no formato da API', async () => {
        const sort = vi.fn().mockReturnValue(lean([doc({ chave: 'ativas', statusVinculados: ['em_uso'] })]));
        vi.mocked(Category.find).mockReturnValue({ sort } as any);

        const lista = await listar(ESCOPO);

        expect(Category.find).toHaveBeenCalledWith(DA_EMPRESA);
        expect(sort).toHaveBeenCalledWith({ _id: 1 });
        expect(lista).toEqual([{ _id: ID, nome: 'Pátio', cor: '#3A9CFF', chave: 'ativas', statusVinculados: ['em_uso'] }]);
    });

    test('usuário sem empresa: filtro vazio, nunca todas', async () => {
        const sort = vi.fn().mockReturnValue(lean([]));
        vi.mocked(Category.find).mockReturnValue({ sort } as any);

        await listar({ tipo: 'filiais', filiais: [] });

        expect(Category.find).toHaveBeenCalledWith({ empresaId: { $in: [] } });
    });
});

describe('criar', () => {
    test('cria na empresa do usuário com statusVinculados vazio por padrão', async () => {
        vi.mocked(Category.create).mockResolvedValue(doc() as any);

        const criada = await criar(ESCOPO, { nome: 'Pátio', cor: '#3A9CFF' });

        expect(Category.create).toHaveBeenCalledWith({ empresaId: EMPRESA, nome: 'Pátio', cor: '#3A9CFF', statusVinculados: [] });
        expect(criada).toEqual({ _id: ID, nome: 'Pátio', cor: '#3A9CFF', chave: null, statusVinculados: [] });
    });

    test('status ligado a outra categoria: 409 sem criar', async () => {
        vi.mocked(Category.exists).mockResolvedValue({ _id: 'x' } as any);

        await expect(criar(ESCOPO, { nome: 'Pátio', cor: '#3A9CFF', statusVinculados: ['offline'] })).rejects.toMatchObject({ status: 409 });
        expect(Category.exists).toHaveBeenCalledWith({ ...DA_EMPRESA, statusVinculados: { $in: ['offline'] } });
        expect(Category.create).not.toHaveBeenCalled();
    });

    test.each([
        ['status desconhecido', ['acidente']],
        ['status repetido', ['offline', 'offline']],
        ['não lista', 'offline'],
    ])('%s: 400 sem criar', async (_caso, statusVinculados) => {
        await expect(criar(ESCOPO, { nome: 'Pátio', cor: '#3A9CFF', statusVinculados })).rejects.toMatchObject({ status: 400 });
        expect(Category.create).not.toHaveBeenCalled();
    });

    test('nome repetido (11000): 409', async () => {
        vi.mocked(Category.create).mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));
        await expect(criar(ESCOPO, { nome: 'pátio', cor: '#3A9CFF' })).rejects.toMatchObject({ status: 409 });
    });
});

describe('atualizar', () => {
    const atualizado = () => vi.mocked(Category.findOneAndUpdate).mock.calls[0]!;

    beforeEach(() => vi.mocked(Category.findOneAndUpdate).mockReturnValue(lean(doc())));

    test('mudar o nome zera a chave', async () => {
        await atualizar(ESCOPO, ID, { nome: 'Pátio' });

        expect(atualizado()[0]).toEqual({ _id: ID, ...DA_EMPRESA });
        expect(atualizado()[1]).toEqual({ $set: { nome: 'Pátio', chave: null } });
    });

    test('mudar só a cor mantém a chave', async () => {
        await atualizar(ESCOPO, ID, { cor: '#000000' });
        expect(atualizado()[1]).toEqual({ $set: { cor: '#000000' } });
    });

    test('statusVinculados: confere conflito ignorando a própria categoria e não move máquinas', async () => {
        await atualizar(ESCOPO, ID, { statusVinculados: ['offline'] });

        expect(Category.exists).toHaveBeenCalledWith({ ...DA_EMPRESA, statusVinculados: { $in: ['offline'] }, _id: { $ne: ID } });
        expect(atualizado()[1]).toEqual({ $set: { statusVinculados: ['offline'] } });
        expect(Forklift.updateMany).not.toHaveBeenCalled();
    });

    test('status ocupado: 409 sem gravar', async () => {
        vi.mocked(Category.exists).mockResolvedValue({ _id: 'x' } as any);
        await expect(atualizar(ESCOPO, ID, { statusVinculados: ['alerta'] })).rejects.toMatchObject({ status: 409 });
        expect(Category.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('categoria de outra empresa: 404', async () => {
        vi.mocked(Category.findOneAndUpdate).mockReturnValue(lean(null));
        await expect(atualizar(ESCOPO, ID, { cor: '#000000' })).rejects.toMatchObject({ status: 404 });
    });

    test('nome repetido (11000): 409', async () => {
        vi.mocked(Category.findOneAndUpdate).mockReturnValue({ lean: vi.fn().mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 })) } as any);
        await expect(atualizar(ESCOPO, ID, { nome: 'Ativas' })).rejects.toMatchObject({ status: 409 });
    });
});

describe('excluir', () => {
    test('solta as máquinas e destrava antes de apagar', async () => {
        vi.mocked(Category.findOne).mockReturnValue(lean(doc()));
        const ordem: string[] = [];
        vi.mocked(Forklift.updateMany).mockImplementation((async () => { ordem.push('maquinas'); }) as any);
        vi.mocked(Category.deleteOne).mockImplementation((async () => { ordem.push('categoria'); }) as any);

        const resposta = await excluir(ESCOPO, ID);

        expect(Category.findOne).toHaveBeenCalledWith({ _id: ID, ...DA_EMPRESA });
        expect(Forklift.updateMany).toHaveBeenCalledWith({ categoriaId: ID }, { $set: { categoriaId: null, categoriaTravada: false } });
        expect(Category.deleteOne).toHaveBeenCalledWith({ _id: ID });
        expect(ordem).toEqual(['maquinas', 'categoria']);
        expect(resposta).toEqual({ _id: ID, message: 'Categoria excluída com sucesso.' });
    });

    test('de outra empresa: 404 sem apagar', async () => {
        vi.mocked(Category.findOne).mockReturnValue(lean(null));
        await expect(excluir(ESCOPO, ID)).rejects.toMatchObject({ status: 404 });
        expect(Forklift.updateMany).not.toHaveBeenCalled();
        expect(Category.deleteOne).not.toHaveBeenCalled();
    });
});

describe('criarQuadroInicial', () => {
    test('cria as 4 categorias do Figma com chave, cor e status ligado', async () => {
        const ids = [1, 2, 3, 4].map(() => new Types.ObjectId());
        vi.mocked(Category.insertMany).mockResolvedValue(ids.map((_id) => ({ _id })) as any);

        const mapa = await criarQuadroInicial(EMPRESA);

        expect(Category.insertMany).toHaveBeenCalledWith([
            { empresaId: EMPRESA, chave: 'acidentes', nome: 'Acidentes', cor: '#EF4444', statusVinculados: ['alerta'] },
            { empresaId: EMPRESA, chave: 'ativas', nome: 'Ativas', cor: '#3A9CFF', statusVinculados: ['em_uso'] },
            { empresaId: EMPRESA, chave: 'manutencao', nome: 'Manutenção', cor: '#FFC93A', statusVinculados: ['manutencao'] },
            { empresaId: EMPRESA, chave: 'disponiveis', nome: 'Disponíveis', cor: '#22C55E', statusVinculados: ['disponivel'] },
        ]);
        expect(mapa!.get('alerta')).toBe(ids[0]);
        expect(mapa!.get('disponivel')).toBe(ids[3]);
        expect(mapa!.has('offline')).toBe(false);
    });

    test('empresa que já tem categoria: não cria nada', async () => {
        vi.mocked(Category.exists).mockResolvedValue({ _id: 'x' } as any);

        expect(await criarQuadroInicial(EMPRESA)).toBeNull();
        expect(Category.exists).toHaveBeenCalledWith({ empresaId: EMPRESA });
        expect(Category.insertMany).not.toHaveBeenCalled();
    });
});

describe('posicionarSemCategoria', () => {
    test('cada status ligado manda as empilhadeiras sem categoria das filiais para a sua categoria', async () => {
        const filiais = ['f1', 'f2'];
        await posicionarSemCategoria(filiais, new Map([['alerta', 'c-alerta'], ['disponivel', 'c-disp']]) as any);

        expect(vi.mocked(Forklift.updateMany).mock.calls).toEqual([
            [{ filialId: { $in: filiais }, categoriaId: null, status: 'alerta' }, { $set: { categoriaId: 'c-alerta' } }],
            [{ filialId: { $in: filiais }, categoriaId: null, status: 'disponivel' }, { $set: { categoriaId: 'c-disp' } }],
        ]);
    });
});
