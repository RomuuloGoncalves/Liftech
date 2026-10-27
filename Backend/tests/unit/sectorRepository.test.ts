import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { SectorRepository } from '../../src/feature/sector/sectorRepository.js';
import { sectorModel } from '../../src/models/sectorModel.js';

describe('SectorRepository', () => {
    test('criar grava só nome e filialId', async () => {
        const create = vi.fn().mockResolvedValue({ _id: 's1', nome: 'Doca', filialId: 'f1' });

        await new SectorRepository({ create } as any).criar(new sectorModel('Doca', 'f1'));

        expect(create).toHaveBeenCalledWith({ nome: 'Doca', filialId: 'f1' });
    });

    test('converte o documento com ids em texto', async () => {
        const id = new Types.ObjectId();
        const filialId = new Types.ObjectId();
        const find = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([{ _id: id, nome: 'Doca', filialId }]) });

        const [setor] = await new SectorRepository({ find } as any).obterTodos();

        expect(setor).toBeInstanceOf(sectorModel);
        expect(setor!.getID()).toBe(String(id));
        expect(setor!.getFilialId()).toBe(String(filialId));
        expect(setor!.obterDados()).toEqual({ _id: String(id), nome: 'Doca', filialId: String(filialId) });
    });
});
