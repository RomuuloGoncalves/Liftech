import { describe, test, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { userModel } from '../../src/models/userModel.js';
import { UserRepository } from '../../src/feature/user/userRepository.js';

function repositorioCom(documento: Record<string, unknown> | null) {
    const bd = { findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(documento) }) };
    return new UserRepository(bd as unknown as mongoose.Model<any>);
}

describe('userModel', () => {
    test('obterDados inclui empresaId, escopo e filiaisIds', () => {
        const usuario = new userModel('Ana', 'admin', 'u1', { empresaId: 'e1', escopo: 'empresa', filiaisIds: ['f1', 'f2'] });

        expect(usuario.obterDados()).toEqual({
            _id: 'u1',
            nome: 'Ana',
            role: 'admin',
            empresaId: 'e1',
            escopo: 'empresa',
            filiaisIds: ['f1', 'f2'],
        });
    });
});

describe('UserRepository: campos de escopo', () => {
    test('converte os ids do documento em texto', async () => {
        const empresaId = new mongoose.Types.ObjectId();
        const filialId = new mongoose.Types.ObjectId();
        const repositorio = repositorioCom({ _id: new mongoose.Types.ObjectId(), nome: 'Ana', role: 'admin', empresaId, escopo: 'filiais', filiaisIds: [filialId] });

        const usuario = await repositorio.obterPorNome('Ana');

        expect(usuario!.obterDados()).toMatchObject({
            empresaId: empresaId.toHexString(),
            escopo: 'filiais',
            filiaisIds: [filialId.toHexString()],
        });
    });

    test('documento sem os campos de escopo vira filiaisIds vazio e sem empresaId nem escopo', async () => {
        const repositorio = repositorioCom({ _id: 'u1', nome: 'Ana', role: 'admin' });

        const dados = (await repositorio.obterPorNome('Ana'))!.obterDados();

        expect(dados.filiaisIds).toEqual([]);
        expect(dados.empresaId).toBeUndefined();
        expect(dados.escopo).toBeUndefined();
    });
});
