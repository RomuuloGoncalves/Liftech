import { describe, test, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { forkliftModel } from '../../src/models/forkliftModel.js';
import { ForkliftRepository } from '../../src/feature/forklift/forkliftRepository.js';

describe('forkliftModel', () => {
    test('obterDados inclui filialId', () => {
        const empilhadeira = new forkliftModel('EMP-001', undefined, undefined, 'f1', 'filial1');

        expect(empilhadeira.obterDados()).toMatchObject({ _id: 'f1', id: 'EMP-001', filialId: 'filial1' });
    });
});

describe('ForkliftRepository: filialId', () => {
    test('converte o filialId do documento em texto', async () => {
        const filialId = new mongoose.Types.ObjectId();
        const bd = { findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 'f1', identificacao: 'EMP-001', filialId }) }) };
        const repositorio = new ForkliftRepository(bd as unknown as mongoose.Model<any>);

        const empilhadeira = await repositorio.obterPorIdentificacao('EMP-001');

        expect(empilhadeira!.obterDados()).toMatchObject({ id: 'EMP-001', filialId: filialId.toHexString() });
    });
});
