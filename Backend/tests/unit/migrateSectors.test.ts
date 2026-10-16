import { describe, test, expect, vi, beforeEach } from 'vitest';
import { migrarSetores, migrarSetoresEDesconectar } from '../../src/scripts/migrateSectors.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Sector } from '../../src/schemas/sector.js';
import { logger } from '../../src/utils/logger.js';

vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { find: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../../src/schemas/sector.js', () => ({ Sector: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../../src/config/conn.js', () => ({ conn: { mongoose: { disconnect: vi.fn() } } }));
vi.mock('../../src/utils/logger.js', () => ({ logger: { info: vi.fn() } }));

// Banco em memória: as consultas dos mocks seguem as mesmas regras do Mongo que a migração usa.
let empilhadeiras: any[];
let setores: any[];

function banco(iniciais: any[], setoresIniciais: any[] = []) {
    empilhadeiras = iniciais.map((f) => ({ setorId: null, ...f }));
    setores = [...setoresIniciais];
    vi.mocked(Forklift.find).mockImplementation(((filtro: any) => {
        expect(filtro).toEqual({ setorId: null, setor: { $type: 'string' } });
        const achadas = empilhadeiras.filter((f) => f.setorId == null && typeof f.setor === 'string').map((f) => ({ ...f }));
        return { lean: vi.fn().mockResolvedValue(achadas) };
    }) as any);
    vi.mocked(Sector.findOne).mockImplementation(((filtro: any) => ({
        collation: (c: unknown) => {
            expect(c).toEqual({ locale: 'pt', strength: 2 });
            const achado = setores.find((s) => s.filialId === filtro.filialId && s.nome.toLowerCase() === filtro.nome.toLowerCase());
            return { lean: vi.fn().mockResolvedValue(achado ?? null) };
        },
    })) as any);
    vi.mocked(Sector.create).mockImplementation((async (doc: any) => {
        const criado = { _id: `s${setores.length + 1}`, ...doc };
        setores.push(criado);
        return criado;
    }) as any);
    vi.mocked(Forklift.updateOne).mockImplementation((async (filtro: any, update: any) => {
        const f = empilhadeiras.find((x) => x._id === filtro._id && x.setorId == null);
        if (f) f.setorId = update.$set.setorId;
        return {};
    }) as any);
}

const setorDe = (id: string) => setores.find((s) => s._id === empilhadeiras.find((f) => f._id === id).setorId);

beforeEach(() => vi.clearAllMocks());

describe('migrarSetores', () => {
    test('cria um setor por texto distinto em cada filial (trim, sem caixa) e liga as empilhadeiras', async () => {
        banco([
            { _id: 'a', filialId: 'f1', setor: 'Expedição - Bloco B' },
            { _id: 'b', filialId: 'f1', setor: '  expedição - bloco b ' },
            { _id: 'c', filialId: 'f2', setor: 'Expedição - Bloco B' },
            { _id: 'd', filialId: 'f1', setor: 'Doca' },
        ]);

        const contagem = await migrarSetores();

        expect(setores).toEqual([
            { _id: 's1', filialId: 'f1', nome: 'Expedição - Bloco B' },
            { _id: 's2', filialId: 'f2', nome: 'Expedição - Bloco B' },
            { _id: 's3', filialId: 'f1', nome: 'Doca' },
        ]);
        expect(setorDe('a')._id).toBe('s1');
        expect(setorDe('b')._id).toBe('s1');
        expect(setorDe('c')._id).toBe('s2');
        expect(setorDe('d')._id).toBe('s3');
        expect(contagem).toEqual({ setores: 3, empilhadeiras: 4, ignoradas: 0 });
    });

    test('usa o setor que já existe na filial em vez de criar outro', async () => {
        banco([{ _id: 'a', filialId: 'f1', setor: 'DOCA' }], [{ _id: 'existente', filialId: 'f1', nome: 'Doca' }]);

        const contagem = await migrarSetores();

        expect(Sector.create).not.toHaveBeenCalled();
        expect(setorDe('a')._id).toBe('existente');
        expect(contagem).toEqual({ setores: 0, empilhadeiras: 1, ignoradas: 0 });
    });

    test('texto vazio, só espaços ou com mais de 60 caracteres: fica sem setor e conta em ignoradas', async () => {
        banco([
            { _id: 'a', filialId: 'f1', setor: '' },
            { _id: 'b', filialId: 'f1', setor: '   ' },
            { _id: 'c', filialId: 'f1', setor: 'a'.repeat(61) },
            { _id: 'd', filialId: 'f1', setor: 'a'.repeat(60) },
        ]);

        const contagem = await migrarSetores();

        expect(empilhadeiras.filter((f) => f.setorId === null).map((f) => f._id)).toEqual(['a', 'b', 'c']);
        expect(contagem).toEqual({ setores: 1, empilhadeiras: 1, ignoradas: 3 });
    });

    test('segunda execução sobre os mesmos dados não cria setor nem altera empilhadeira', async () => {
        banco([
            { _id: 'a', filialId: 'f1', setor: 'Doca' },
            { _id: 'b', filialId: 'f1', setor: '' },
        ]);
        await migrarSetores();
        vi.mocked(Sector.create).mockClear();
        vi.mocked(Forklift.updateOne).mockClear();

        const contagem = await migrarSetores();

        expect(Sector.create).not.toHaveBeenCalled();
        expect(Forklift.updateOne).not.toHaveBeenCalled();
        expect(contagem).toEqual({ setores: 0, empilhadeiras: 0, ignoradas: 1 });
    });

    test('registra no log setores, empilhadeiras e ignoradas', async () => {
        banco([{ _id: 'a', filialId: 'f1', setor: 'Doca' }, { _id: 'b', filialId: 'f1', setor: ' ' }]);

        await migrarSetores();

        expect(logger.info).toHaveBeenCalledWith('Migração de setores concluída: 1 setores criados, 1 empilhadeiras ligadas, 1 ignoradas.');
    });
});

describe('migrarSetoresEDesconectar', () => {
    test('desconecta depois do sucesso', async () => {
        banco([]);
        const desconectar = vi.fn().mockResolvedValue(undefined);
        await migrarSetoresEDesconectar(desconectar);
        expect(desconectar).toHaveBeenCalledTimes(1);
    });

    test('desconecta também na falha, e o erro sobe', async () => {
        vi.mocked(Forklift.find).mockImplementation(() => { throw new Error('falha'); });
        const desconectar = vi.fn().mockResolvedValue(undefined);
        await expect(migrarSetoresEDesconectar(desconectar)).rejects.toThrow('falha');
        expect(desconectar).toHaveBeenCalledTimes(1);
    });
});
