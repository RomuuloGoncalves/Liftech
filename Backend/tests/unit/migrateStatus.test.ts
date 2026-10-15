import { describe, test, expect, vi, beforeEach } from 'vitest';
import { migrarStatus, migrarStatusEDesconectar } from '../../src/scripts/migrateStatus.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';
import { criarQuadroInicial, posicionarSemCategoria } from '../../src/feature/category/categoryService.js';

vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { find: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../../src/schemas/company.js', () => ({ Company: { find: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { find: vi.fn() } }));
vi.mock('../../src/schemas/device.js', () => ({ Device: {} }));
vi.mock('../../src/feature/category/categoryService.js', () => ({ criarQuadroInicial: vi.fn(), posicionarSemCategoria: vi.fn() }));
vi.mock('../../src/config/conn.js', () => ({ conn: { mongoose: { disconnect: vi.fn() } } }));
vi.mock('../../src/utils/logger.js', () => ({ logger: { info: vi.fn() } }));

function mockar(empilhadeiras: unknown[], empresas: unknown[] = []) {
    const populate = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(empilhadeiras) });
    vi.mocked(Forklift.find).mockReturnValue({ populate } as any);
    vi.mocked(Company.find).mockReturnValue({ lean: vi.fn().mockResolvedValue(empresas) } as any);
    vi.mocked(Branch.find).mockReturnValue({ distinct: vi.fn().mockResolvedValue(['f1', 'f2']) } as any);
    return populate;
}

const gravados = () => vi.mocked(Forklift.updateOne).mock.calls.map((c) => [(c[0] as any)._id, (c[1] as any).$set.status]);

describe('migrarStatus', () => {
    beforeEach(() => vi.clearAllMocks());

    test('só busca empilhadeiras sem status, com o dispositivo', async () => {
        const populate = mockar([]);
        await migrarStatus();
        expect(Forklift.find).toHaveBeenCalledWith({ status: null });
        expect(populate).toHaveBeenCalledWith('dispositivoConectadoId');
    });

    test('cada texto antigo do dispositivo vira o código; sem dispositivo vira offline', async () => {
        mockar([
            { _id: 'a', dispositivoConectadoId: { status: 'Disponível' } },
            { _id: 'b', dispositivoConectadoId: { status: 'Em uso' } },
            { _id: 'c', dispositivoConectadoId: { status: 'Manutenção' } },
            { _id: 'd', dispositivoConectadoId: { status: 'Offline' } },
            { _id: 'e', dispositivoConectadoId: null },
            { _id: 'f', dispositivoConectadoId: { status: 'online' } },
        ]);

        await migrarStatus();

        expect(gravados()).toEqual([
            ['a', 'disponivel'], ['b', 'em_uso'], ['c', 'manutencao'], ['d', 'offline'], ['e', 'offline'], ['f', 'disponivel'],
        ]);
        expect(vi.mocked(Forklift.updateOne).mock.calls[0]![0]).toEqual({ _id: 'a', status: null });
    });

    test('cria o quadro da empresa sem categorias e posiciona as empilhadeiras das filiais dela', async () => {
        mockar([], [{ _id: 'e1' }, { _id: 'e2' }]);
        const quadro = new Map([['alerta', 'c1']]);
        vi.mocked(criarQuadroInicial).mockImplementation((async (id: string) => (id === 'e1' ? quadro : null)) as any);

        const contagem = await migrarStatus();

        expect(criarQuadroInicial).toHaveBeenCalledTimes(2);
        expect(Branch.find).toHaveBeenCalledWith({ empresaId: 'e1' });
        expect(posicionarSemCategoria).toHaveBeenCalledTimes(1);
        expect(posicionarSemCategoria).toHaveBeenCalledWith(['f1', 'f2'], quadro);
        expect(contagem).toEqual({ empilhadeiras: 0, quadros: 1 });
    });

    test('o status é gravado antes de posicionar', async () => {
        mockar([{ _id: 'a', dispositivoConectadoId: { status: 'Em uso' } }], [{ _id: 'e1' }]);
        vi.mocked(criarQuadroInicial).mockResolvedValue(new Map() as any);

        await migrarStatus();

        expect(vi.mocked(Forklift.updateOne).mock.invocationCallOrder[0]!).toBeLessThan(
            vi.mocked(posicionarSemCategoria).mock.invocationCallOrder[0]!
        );
    });

    test('segunda execução com tudo migrado não escreve nada', async () => {
        mockar([], [{ _id: 'e1' }]);
        vi.mocked(criarQuadroInicial).mockResolvedValue(null);

        await migrarStatus();

        expect(Forklift.updateOne).not.toHaveBeenCalled();
        expect(posicionarSemCategoria).not.toHaveBeenCalled();
    });
});

describe('migrarStatusEDesconectar', () => {
    beforeEach(() => vi.clearAllMocks());

    test('desconecta depois do sucesso', async () => {
        mockar([]);
        const desconectar = vi.fn().mockResolvedValue(undefined);
        await migrarStatusEDesconectar(desconectar);
        expect(desconectar).toHaveBeenCalledTimes(1);
    });

    test('desconecta também na falha, e o erro sobe', async () => {
        vi.mocked(Forklift.find).mockImplementation(() => { throw new Error('falha'); });
        const desconectar = vi.fn().mockResolvedValue(undefined);
        await expect(migrarStatusEDesconectar(desconectar)).rejects.toThrow('falha');
        expect(desconectar).toHaveBeenCalledTimes(1);
    });
});
