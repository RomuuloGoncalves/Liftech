import { describe, test, expect, vi, beforeEach } from 'vitest';
import { garantirEmpresa } from '../../src/scripts/seedEmpresa.js';
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';

vi.mock('../../src/schemas/company.js', () => ({ Company: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { findOneAndUpdate: vi.fn() } }));

const idDe = (nome: string, filtro: object) => `${nome}:${JSON.stringify(filtro)}`;

function mockarModelos() {
    for (const [nome, m] of Object.entries({ Company, Branch })) {
        vi.mocked(m.findOneAndUpdate).mockImplementation(((filtro: unknown) => ({
            lean: () => Promise.resolve({ _id: idDe(nome, filtro as object) }),
        })) as any);
    }
}

const chamadas = (m: { findOneAndUpdate: unknown }) => vi.mocked(m.findOneAndUpdate as any).mock.calls as any[][];

const chamas = () => chamadas(Branch);

describe('garantirEmpresa', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockarModelos();
    });

    test('faz upsert da empresa pela chave nome', async () => {
        await garantirEmpresa();

        expect(chamadas(Company)).toHaveLength(1);
        const [filtro, atualizacao, opcoes] = chamadas(Company)[0]!;
        expect(filtro).toEqual({ nome: 'Liftech Logística' });
        expect(atualizacao).toEqual({ $set: { nome: 'Liftech Logística' } });
        expect(opcoes).toMatchObject({ upsert: true });
    });

    test('sem extras cria só a matriz, pela chave empresaId + nome, com matriz: true', async () => {
        const { empresaId } = await garantirEmpresa();

        expect(chamas()).toHaveLength(1);
        const [filtro, atualizacao, opcoes] = chamas()[0]!;
        expect(filtro).toEqual({ empresaId, nome: 'Matriz' });
        expect(atualizacao.$set).toEqual({ empresaId, nome: 'Matriz', matriz: true });
        expect(opcoes).toMatchObject({ upsert: true });
    });

    test('com extras cria a matriz e elas, só a matriz com matriz: true', async () => {
        const { empresaId } = await garantirEmpresa(['Unidade Centro', 'Unidade Norte']);

        expect(chamas().map((c) => [c[0].nome, c[1].$set.matriz])).toEqual([
            ['Matriz', true],
            ['Unidade Centro', false],
            ['Unidade Norte', false],
        ]);
        for (const c of chamas()) expect(c[0].empresaId).toBe(empresaId);
    });

    test('devolve o id da empresa e o id de cada filial pelo nome', async () => {
        const { empresaId, filialIds } = await garantirEmpresa(['Unidade Centro']);

        expect(empresaId).toBe(idDe('Company', { nome: 'Liftech Logística' }));
        expect(filialIds.get('Matriz')).toBe(idDe('Branch', { empresaId, nome: 'Matriz' }));
        expect(filialIds.get('Unidade Centro')).toBe(idDe('Branch', { empresaId, nome: 'Unidade Centro' }));
        expect([...filialIds.keys()]).toEqual(['Matriz', 'Unidade Centro']);
    });
});
