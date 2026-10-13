import { Company } from '../schemas/company.js';
import { Branch } from '../schemas/branch.js';
import { EMPRESA_NOME, MATRIZ_NOME } from './seedDataset.js';

// Upsert pela chave natural: rodar de novo atualiza em vez de duplicar. Devolve o _id.
export async function upsert(modelo: any, filtro: object, dados: object) {
    const doc = await modelo.findOneAndUpdate(filtro, { $set: dados }, { upsert: true, returnDocument: 'after' }).lean();
    return doc._id;
}

// Garante a empresa padrão, a matriz e as filiais `extras`. Devolve o id da empresa e o id de cada filial pelo nome.
export async function garantirEmpresa(extras: string[] = []) {
    const empresaId = await upsert(Company, { nome: EMPRESA_NOME }, { nome: EMPRESA_NOME });
    const filialIds = new Map<string, unknown>();
    for (const nome of [MATRIZ_NOME, ...extras]) {
        filialIds.set(nome, await upsert(Branch, { empresaId, nome }, { empresaId, nome, matriz: nome === MATRIZ_NOME }));
    }
    return { empresaId, filialIds };
}
