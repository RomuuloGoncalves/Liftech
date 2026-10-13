import { describe, test, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';
import { User } from '../../src/schemas/user.js';

// Só o mongoose, sem conectar: validate() e schema.indexes() não tocam no banco.
vi.mock('../../src/config/conn.js', async () => ({ conn: { mongoose: (await import('mongoose')).default } }));

// Caminhos que falham na validação do documento.
const erros = async (doc: { validate(): Promise<unknown> }): Promise<string[]> => {
    try {
        await doc.validate();
        return [];
    } catch (e: any) {
        return Object.keys(e.errors);
    }
};

describe('schema company', () => {
    test('nome é obrigatório', async () => {
        expect(await erros(new Company({}))).toEqual(['nome']);
        expect(await erros(new Company({ nome: 'Liftech Logística' }))).toEqual([]);
    });

    test('nome tem índice único', () => {
        expect(Company.schema.indexes()).toContainEqual([{ nome: 1 }, expect.objectContaining({ unique: true })]);
    });
});

describe('schema user', () => {
    const empresaId = new mongoose.Types.ObjectId();

    test('empresaId é obrigatório', async () => {
        expect(await erros(new User({ nome: 'Ana', role: 'admin' }))).toEqual(['empresaId']);
    });

    test('sem escopo e filiaisIds, valem "filiais" e lista vazia', () => {
        const usuario = new User({ nome: 'Ana', role: 'admin', empresaId });

        expect(usuario.escopo).toBe('filiais');
        expect(usuario.filiaisIds).toHaveLength(0);
    });

    test('escopo "todos" é rejeitado', async () => {
        expect(await erros(new User({ nome: 'Ana', role: 'admin', empresaId, escopo: 'todos' }))).toEqual(['escopo']);
    });

    test('escopo "empresa" e "filiais" são aceitos', async () => {
        expect(await erros(new User({ nome: 'Ana', role: 'admin', empresaId, escopo: 'empresa' }))).toEqual([]);
        expect(await erros(new User({ nome: 'Ana', role: 'admin', empresaId, escopo: 'filiais', filiaisIds: [empresaId] }))).toEqual([]);
    });
});

describe('schema branch', () => {
    const empresaId = new mongoose.Types.ObjectId();

    test('nome e empresaId são obrigatórios', async () => {
        expect((await erros(new Branch({}))).sort()).toEqual(['empresaId', 'nome']);
        expect(await erros(new Branch({ nome: 'Matriz', empresaId }))).toEqual([]);
    });

    test('matriz vale false quando omitido', () => {
        expect(new Branch({ nome: 'Unidade Norte', empresaId }).matriz).toBe(false);
    });

    test('empresaId + nome têm índice único', () => {
        expect(Branch.schema.indexes()).toContainEqual([{ empresaId: 1, nome: 1 }, expect.objectContaining({ unique: true })]);
    });

    test('empresaId tem índice único restrito a matriz: true', () => {
        expect(Branch.schema.indexes()).toContainEqual([
            { empresaId: 1 },
            expect.objectContaining({ unique: true, partialFilterExpression: { matriz: true } }),
        ]);
    });
});
