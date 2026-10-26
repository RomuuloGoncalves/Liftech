import { describe, test, expect, vi, beforeEach } from 'vitest';
import { migrarParaFiliais, migrarEDesconectar } from '../../src/scripts/migrateToBranches.js';
import { garantirEmpresa } from '../../src/scripts/seedEmpresa.js';
import { User } from '../../src/schemas/user.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Device } from '../../src/schemas/device.js';
import { Operator } from '../../src/schemas/operator.js';
import { Incident } from '../../src/schemas/incident.js';
import { logger } from '../../src/utils/logger.js';

vi.mock('../../src/schemas/user.js', () => ({ User: { updateMany: vi.fn() } }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { updateMany: vi.fn() } }));
vi.mock('../../src/schemas/device.js', () => ({ Device: { updateMany: vi.fn() } }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: { updateMany: vi.fn() } }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: { updateMany: vi.fn() } }));
vi.mock('../../src/scripts/seedEmpresa.js', () => ({ garantirEmpresa: vi.fn() }));
vi.mock('../../src/config/conn.js', () => ({ conn: { mongoose: { disconnect: vi.fn() } } }));
vi.mock('../../src/utils/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

const EMPRESA = 'empresa-1';
const MATRIZ = 'matriz-1';
const RECURSOS = { Forklift, Device, Operator, Incident } as const;

describe('migrarParaFiliais', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(garantirEmpresa).mockResolvedValue({ empresaId: EMPRESA, filialIds: new Map([['Matriz', MATRIZ]]) });
        for (const m of [User, ...Object.values(RECURSOS)]) vi.mocked(m.updateMany).mockResolvedValue({ modifiedCount: 3 } as any);
    });

    test('garante a empresa padrão e a matriz, sem filiais extras', async () => {
        await migrarParaFiliais();

        expect(garantirEmpresa).toHaveBeenCalledWith();
    });

    test('admins sem empresaId recebem empresaId e escopo empresa', async () => {
        await migrarParaFiliais();

        expect(vi.mocked(User.updateMany).mock.calls[0]).toEqual([
            { empresaId: null, role: 'admin' },
            { $set: { empresaId: EMPRESA, escopo: 'empresa' } },
        ]);
    });

    test('os demais usuários sem empresaId recebem empresaId, escopo filiais e a matriz, depois dos admins', async () => {
        await migrarParaFiliais();

        expect(vi.mocked(User.updateMany).mock.calls[1]).toEqual([
            { empresaId: null },
            { $set: { empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [MATRIZ] } },
        ]);
        expect(User.updateMany).toHaveBeenCalledTimes(2);
    });

    test.each(Object.keys(RECURSOS) as (keyof typeof RECURSOS)[])('%s sem filialId recebem o filialId da matriz, e só eles', async (nome) => {
        await migrarParaFiliais();

        expect(RECURSOS[nome].updateMany).toHaveBeenCalledTimes(1);
        expect(RECURSOS[nome].updateMany).toHaveBeenCalledWith({ filialId: null }, { $set: { filialId: MATRIZ } });
    });

    test('devolve e registra quantos documentos mudaram por collection', async () => {
        vi.mocked(Forklift.updateMany).mockResolvedValue({ modifiedCount: 16 } as any);
        vi.mocked(Incident.updateMany).mockResolvedValue({ modifiedCount: 0 } as any);

        const contagem = await migrarParaFiliais();

        expect(contagem).toEqual({ admins: 3, colaboradores: 3, empilhadeiras: 16, dispositivos: 3, operadores: 3, incidentes: 0 });
        const mensagem = String(vi.mocked(logger.info).mock.calls[0]![0]);
        for (const trecho of ['3 admins', '3 colaboradores', '16 empilhadeiras', '3 dispositivos', '3 operadores', '0 incidentes']) {
            expect(mensagem).toContain(trecho);
        }
    });
});

describe('migrarEDesconectar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(garantirEmpresa).mockResolvedValue({ empresaId: EMPRESA, filialIds: new Map([['Matriz', MATRIZ]]) });
        for (const m of [User, ...Object.values(RECURSOS)]) vi.mocked(m.updateMany).mockResolvedValue({ modifiedCount: 0 } as any);
    });

    test('fecha a conexão uma vez depois de migrar e devolve a contagem', async () => {
        const desconectar = vi.fn().mockResolvedValue(undefined);

        const contagem = await migrarEDesconectar(desconectar);

        expect(desconectar).toHaveBeenCalledTimes(1);
        expect(contagem.admins).toBe(0);
    });

    test('fecha a conexão também quando a migração falha, e o erro continua subindo', async () => {
        vi.mocked(garantirEmpresa).mockRejectedValue(new Error('falha no banco'));
        const desconectar = vi.fn().mockResolvedValue(undefined);

        await expect(migrarEDesconectar(desconectar)).rejects.toThrow('falha no banco');

        expect(desconectar).toHaveBeenCalledTimes(1);
    });
});
