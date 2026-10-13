import { describe, test, expect, vi } from 'vitest';
import { Company } from '../../src/schemas/company.js';

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
