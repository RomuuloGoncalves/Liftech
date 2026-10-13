import { describe, test, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { carregarEscopo, exigirEmpresa, filtroPorEmpresa, filtroPorFilial, resolverFilial, type Escopo } from '../../src/core/escopo.js';
import { Branch } from '../../src/schemas/branch.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';

vi.mock('../../src/schemas/branch.js', () => ({ Branch: { find: vi.fn() } }));

const EMPRESA = new mongoose.Types.ObjectId();
const MATRIZ = new mongoose.Types.ObjectId();
const CENTRO = new mongoose.Types.ObjectId();

function mockarFiliais(documentos: unknown[]) {
    const lean = vi.fn().mockResolvedValue(documentos);
    const sort = vi.fn().mockReturnValue({ lean });
    vi.mocked(Branch.find).mockReturnValue({ sort } as any);
    return { sort };
}

describe('carregarEscopo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('escopo empresa: tipo empresa e todas as filiais da empresa, sem filtrar por id', async () => {
        mockarFiliais([{ _id: MATRIZ, nome: 'Matriz', matriz: true }, { _id: CENTRO, nome: 'Unidade Centro', matriz: false }]);

        const escopo = await carregarEscopo({ empresaId: EMPRESA, escopo: 'empresa', filiaisIds: [CENTRO] });

        expect(Branch.find).toHaveBeenCalledWith({ empresaId: EMPRESA });
        expect(escopo).toEqual({
            empresaId: EMPRESA.toHexString(),
            tipo: 'empresa',
            filiais: [
                { _id: MATRIZ.toHexString(), nome: 'Matriz', matriz: true },
                { _id: CENTRO.toHexString(), nome: 'Unidade Centro', matriz: false },
            ],
        });
    });

    test('escopo filiais: tipo filiais e só as filiais da empresa cujo id está em filiaisIds', async () => {
        mockarFiliais([{ _id: CENTRO, nome: 'Unidade Centro', matriz: false }]);

        const escopo = await carregarEscopo({ empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [CENTRO] });

        expect(Branch.find).toHaveBeenCalledWith({ empresaId: EMPRESA, _id: { $in: [CENTRO] } });
        expect(escopo.tipo).toBe('filiais');
        expect(escopo.filiais).toEqual([{ _id: CENTRO.toHexString(), nome: 'Unidade Centro', matriz: false }]);
    });

    test('filiaisIds vazio: consulta com $in vazio e devolve filiais vazio', async () => {
        mockarFiliais([]);

        const escopo = await carregarEscopo({ empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [] });

        expect(Branch.find).toHaveBeenCalledWith({ empresaId: EMPRESA, _id: { $in: [] } });
        expect(escopo.filiais).toEqual([]);
    });

    test('filiaisIds ausente é tratado como lista vazia', async () => {
        mockarFiliais([]);

        await carregarEscopo({ empresaId: EMPRESA, escopo: 'filiais' });

        expect(Branch.find).toHaveBeenCalledWith({ empresaId: EMPRESA, _id: { $in: [] } });
    });

    test('a consulta sempre inclui a empresa do usuário, então filial de outra empresa ou apagada não entra', async () => {
        const outraEmpresa = new mongoose.Types.ObjectId();
        mockarFiliais([]);

        await carregarEscopo({ empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [outraEmpresa] });

        expect(vi.mocked(Branch.find).mock.calls[0]![0]).toMatchObject({ empresaId: EMPRESA });
    });

    test('ordena a matriz primeiro e depois por nome', async () => {
        const { sort } = mockarFiliais([]);

        await carregarEscopo({ empresaId: EMPRESA, escopo: 'empresa' });

        expect(sort).toHaveBeenCalledWith({ matriz: -1, nome: 1 });
    });

    test('sem empresaId: filiais vazio, tipo filiais e nenhuma consulta', async () => {
        const escopo = await carregarEscopo({ escopo: 'empresa', filiaisIds: [CENTRO] });

        expect(escopo).toEqual({ tipo: 'filiais', filiais: [] });
        expect(Branch.find).not.toHaveBeenCalled();
    });

    test('escopo indefinido com empresaId é tratado como filiais', async () => {
        mockarFiliais([]);

        const escopo = await carregarEscopo({ empresaId: EMPRESA, filiaisIds: [CENTRO] });

        expect(escopo.tipo).toBe('filiais');
        expect(Branch.find).toHaveBeenCalledWith({ empresaId: EMPRESA, _id: { $in: [CENTRO] } });
    });
});

describe('filtros de escopo', () => {
    const escopo: Escopo = {
        empresaId: 'e1',
        tipo: 'filiais',
        filiais: [{ _id: 'f1', nome: 'Matriz', matriz: true }, { _id: 'f2', nome: 'Unidade Norte', matriz: false }],
    };

    test('filtroPorFilial: $in com os ids das filiais do escopo', () => {
        expect(filtroPorFilial(escopo)).toEqual({ filialId: { $in: ['f1', 'f2'] } });
    });

    test('filtroPorFilial: escopo sem filiais ou ausente devolve $in vazio', () => {
        expect(filtroPorFilial({ ...escopo, filiais: [] })).toEqual({ filialId: { $in: [] } });
        expect(filtroPorFilial(undefined)).toEqual({ filialId: { $in: [] } });
    });

    test('filtroPorEmpresa: $in com a empresa do escopo', () => {
        expect(filtroPorEmpresa(escopo)).toEqual({ empresaId: { $in: ['e1'] } });
    });

    test('filtroPorEmpresa: escopo sem empresa ou ausente devolve $in vazio', () => {
        expect(filtroPorEmpresa({ tipo: 'filiais', filiais: [] })).toEqual({ empresaId: { $in: [] } });
        expect(filtroPorEmpresa(undefined)).toEqual({ empresaId: { $in: [] } });
    });
});

describe('resolverFilial', () => {
    const F1 = '665f1c2b9a1e4b00123456b1';
    const F2 = '665f1c2b9a1e4b00123456b2';
    const filial = (_id: string) => ({ _id, nome: 'x', matriz: false });
    const escopo = (tipo: 'empresa' | 'filiais', ids: string[]): Escopo => ({ empresaId: 'e1', tipo, filiais: ids.map(filial) });
    const erro = (chamar: () => unknown) => {
        try {
            chamar();
        } catch (e) {
            return e as ErroHttp;
        }
        throw new Error('não lançou');
    };

    test('filialId de uma filial do escopo é devolvido', () => {
        expect(resolverFilial(escopo('filiais', [F1, F2]), F2)).toBe(F2);
        expect(resolverFilial(escopo('empresa', [F1, F2]), F1)).toBe(F1);
    });

    test('filialId fora do escopo: 403', () => {
        expect(erro(() => resolverFilial(escopo('filiais', [F1]), F2)).status).toBe(403);
    });

    test.each([['abc'], [123], [{}]])('filialId %j que não é ObjectId: 400', (valor) => {
        expect(erro(() => resolverFilial(escopo('filiais', [F1]), valor)).status).toBe(400);
    });

    test.each([[undefined], [null], ['']])('sem filialId (%j) e escopo filiais com uma filial: usa essa filial', (valor) => {
        expect(resolverFilial(escopo('filiais', [F1]), valor)).toBe(F1);
    });

    test.each([
        ['escopo empresa com uma filial', escopo('empresa', [F1])],
        ['escopo filiais com duas filiais', escopo('filiais', [F1, F2])],
        ['escopo filiais sem filiais', escopo('filiais', [])],
    ])('sem filialId e %s: 400', (_caso, e) => {
        expect(erro(() => resolverFilial(e)).status).toBe(400);
    });
});

describe('exigirEmpresa', () => {
    test('escopo empresa passa sem lançar', () => {
        expect(() => exigirEmpresa({ empresaId: 'e1', tipo: 'empresa', filiais: [] }, 'não')).not.toThrow();
    });

    test('escopo filiais lança ErroHttp 403 com a mensagem dada', () => {
        const chamar = () => exigirEmpresa({ empresaId: 'e1', tipo: 'filiais', filiais: [] }, 'Só a empresa.');

        expect(chamar).toThrow(ErroHttp);
        expect(chamar).toThrow('Só a empresa.');
        try {
            chamar();
        } catch (e) {
            expect((e as ErroHttp).status).toBe(403);
        }
    });
});
