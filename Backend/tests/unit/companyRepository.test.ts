import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { CompanyRepository } from '../../src/feature/company/companyRepository.js';
import { companyModel } from '../../src/models/companyModel.js';

describe('CompanyRepository', () => {
    test('buscarPorId converte a empresa com id em texto', async () => {
        const id = new Types.ObjectId();
        const bd = { findById: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: id, nome: 'Liftech Logística' }) }) };

        const empresa = await new CompanyRepository(bd as any).buscarPorId(String(id));

        expect(empresa).toBeInstanceOf(companyModel);
        expect(empresa!.getID()).toBe(String(id));
        expect(empresa!.getNome()).toBe('Liftech Logística');
    });

    test('criar grava só o nome', async () => {
        const create = vi.fn().mockResolvedValue({ _id: 'c1', nome: 'Acme' });

        await new CompanyRepository({ create } as any).criar(new companyModel('Acme'));

        expect(create).toHaveBeenCalledWith({ nome: 'Acme' });
    });
});
