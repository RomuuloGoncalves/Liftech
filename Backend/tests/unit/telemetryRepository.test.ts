import { describe, test, expect, vi } from 'vitest';
import { TelemetryRepository } from '../../src/feature/telemetry/telemetryRepository.js';
import { telemetryModel } from '../../src/models/telemetryModel.js';

describe('TelemetryRepository', () => {
    const data = new Date('2026-10-15T12:00:00Z');
    const doc = { _id: 't1', dispositivoId: 'd1', dataDados: data, forcaImpacto: 5 };

    function criarMockBd() {
        const lean = vi.fn().mockResolvedValue([doc]);
        const limit = vi.fn().mockReturnValue({ lean });
        const sort = vi.fn().mockReturnValue({ limit });
        const find = vi.fn().mockReturnValue({ sort });
        return { bd: { find } as any, find, sort, limit, lean };
    }

    test('obterTodos aplica sort({ dataDados: -1 }) e limit(500)', async () => {
        const { bd, find, sort, limit } = criarMockBd();
        const repo = new TelemetryRepository(bd);

        const resultado = await repo.obterTodos({ filialId: 'f1' });

        expect(find).toHaveBeenCalledWith({ filialId: 'f1' });
        expect(sort).toHaveBeenCalledWith({ dataDados: -1 });
        expect(limit).toHaveBeenCalledWith(500);
        expect(resultado).toHaveLength(1);
        expect(resultado[0]).toBeInstanceOf(telemetryModel);
        expect(resultado[0]!.obterDados()).toEqual({
            id: 't1',
            dispositivoId: 'd1',
            dataDados: data,
            forcaImpacto: 5,
        });
    });

    test('obterPorDispositivo aplica sort({ dataDados: -1 }) e limit(500)', async () => {
        const { bd, find, sort, limit } = criarMockBd();
        const repo = new TelemetryRepository(bd);

        const resultado = await repo.obterPorDispositivo('d1', '2026-10-01', '2026-10-15');

        expect(find).toHaveBeenCalledWith({
            dispositivoId: 'd1',
            dataDados: {
                $gte: new Date('2026-10-01'),
                $lte: new Date('2026-10-15'),
            },
        });
        expect(sort).toHaveBeenCalledWith({ dataDados: -1 });
        expect(limit).toHaveBeenCalledWith(500);
        expect(resultado).toHaveLength(1);
        expect(resultado[0]!.obterDados()).toEqual({
            id: 't1',
            dispositivoId: 'd1',
            dataDados: data,
            forcaImpacto: 5,
        });
    });
});
