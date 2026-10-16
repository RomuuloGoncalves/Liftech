import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { listar, criar, atualizar, excluir } from '../../src/feature/operator/operatorService.js';
import { Operator } from '../../src/schemas/operator.js';
import { User } from '../../src/schemas/user.js';
import { WorkSession } from '../../src/schemas/workSession.js';
import { Branch } from '../../src/schemas/branch.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/operator.js', () => ({
    Operator: { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn(), distinct: vi.fn() },
}));
vi.mock('../../src/schemas/user.js', () => ({
    User: { find: vi.fn(), updateOne: vi.fn(), deleteMany: vi.fn(), deleteOne: vi.fn(), exists: vi.fn(), create: vi.fn() },
}));
vi.mock('../../src/schemas/workSession.js', () => ({ WorkSession: { exists: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { distinct: vi.fn() } }));

const F1 = new Types.ObjectId().toHexString();
const F2 = new Types.ObjectId().toHexString();
const FORA = new Types.ObjectId().toHexString();
const ID = new Types.ObjectId().toHexString();
const ESCOPO: Escopo = {
    empresaId: 'e1',
    tipo: 'filiais',
    filiais: [{ _id: F1, nome: 'Matriz', matriz: true }, { _id: F2, nome: 'Norte', matriz: false }],
};
const DOC = {
    _id: new Types.ObjectId(ID),
    matricula: 'EMP-092',
    nome: 'Ana Souza',
    telefone: '(11) 99999-0000',
    cargo: 'Operadora',
    horarioEntrada: '08:00',
    horarioSaida: '17:00',
    filialId: new Types.ObjectId(F1),
};
const FORMATADO = {
    id: ID,
    matricula: 'EMP-092',
    nome: 'Ana Souza',
    telefone: '(11) 99999-0000',
    cargo: 'Operadora',
    horarioEntrada: '08:00',
    horarioSaida: '17:00',
    filialId: F1,
    usuario: null,
    acesso: 'Negado',
};

const lean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) });
function mockarLista(documentos: unknown[]) {
    const sort = vi.fn().mockReturnValue(lean(documentos));
    vi.mocked(Operator.find).mockReturnValue({ sort } as any);
    return sort;
}
const mockarLogins = (logins: unknown[]) => vi.mocked(User.find).mockReturnValue(lean(logins) as any);
const mockarOperador = (...docs: unknown[]) => {
    for (const doc of docs) vi.mocked(Operator.findOne).mockReturnValueOnce(lean(doc) as any);
};

beforeEach(() => {
    vi.resetAllMocks();
    mockarLogins([]);
});

describe('listar', () => {
    test('devolve os operadores das filiais do escopo, por nome, no formato da API', async () => {
        const sort = mockarLista([DOC]);

        const lista = await listar(ESCOPO);

        expect(Operator.find).toHaveBeenCalledWith({ filialId: { $in: [F1, F2] } });
        expect(sort).toHaveBeenCalledWith({ nome: 1 });
        expect(lista).toEqual([FORMATADO]);
    });

    test('usuario e acesso vêm do login, numa consulta só', async () => {
        const OUTRO = new Types.ObjectId();
        const NEGADO = new Types.ObjectId();
        mockarLista([DOC, { _id: OUTRO, nome: 'Bruno', filialId: F2 }, { _id: NEGADO, nome: 'Caio', filialId: F2 }]);
        mockarLogins([
            { operadorId: new Types.ObjectId(ID), usuario: 'ana', acessoNegado: false },
            { operadorId: NEGADO, usuario: 'caio', acessoNegado: true },
        ]);

        const [ana, bruno, caio] = await listar(ESCOPO);

        expect(User.find).toHaveBeenCalledTimes(1);
        expect(User.find).toHaveBeenCalledWith({ operadorId: { $in: [DOC._id, OUTRO, NEGADO] } });
        expect(ana).toMatchObject({ usuario: 'ana', acesso: 'Permitido' });
        expect(caio).toMatchObject({ usuario: 'caio', acesso: 'Negado' });
        // Campos vazios vêm como ''.
        expect(bruno).toEqual({
            id: OUTRO.toHexString(), matricula: '', nome: 'Bruno', telefone: '', cargo: '',
            horarioEntrada: '', horarioSaida: '', filialId: F2, usuario: null, acesso: 'Negado',
        });
    });

    test('filialId do escopo reduz a lista a essa filial', async () => {
        mockarLista([]);

        await listar(ESCOPO, F2);

        expect(Operator.find).toHaveBeenCalledWith({ filialId: { $in: [F2] } });
    });

    test('filialId fora do escopo não amplia: lista vazia', async () => {
        mockarLista([]);

        await listar(ESCOPO, FORA);

        expect(Operator.find).toHaveBeenCalledWith({ filialId: { $in: [] } });
    });
});

describe('criar', () => {
    beforeEach(() => {
        vi.mocked(Branch.distinct).mockResolvedValue([F1, F2, FORA] as any);
        vi.mocked(Operator.create).mockImplementation(async (dados: any) => ({ _id: DOC._id, ...dados }) as any);
    });

    test('grava o operador na filial com a matrícula seguinte à maior da empresa', async () => {
        vi.mocked(Operator.distinct).mockResolvedValue(['EMP-007', 'EMP-092', 'EMP-010', 'outra'] as any);

        const operador = await criar(ESCOPO, { nome: 'Ana Souza', telefone: '1', cargo: 'Op', horarioEntrada: '08:00', horarioSaida: '', filialId: F1 });

        expect(Branch.distinct).toHaveBeenCalledWith('_id', { empresaId: 'e1' });
        expect(Operator.distinct).toHaveBeenCalledWith('matricula', { filialId: { $in: [F1, F2, FORA] } });
        expect(Operator.create).toHaveBeenCalledWith({
            nome: 'Ana Souza', telefone: '1', cargo: 'Op', horarioEntrada: '08:00', horarioSaida: '', filialId: F1, matricula: 'EMP-093',
        });
        expect(operador).toMatchObject({ id: ID, matricula: 'EMP-093', filialId: F1, usuario: null, acesso: 'Negado' });
    });

    test('sem operadores na empresa a matrícula é EMP-001', async () => {
        vi.mocked(Operator.distinct).mockResolvedValue([] as any);

        await criar(ESCOPO, { nome: 'Ana', filialId: F1 });

        expect(Operator.create).toHaveBeenCalledWith(expect.objectContaining({ matricula: 'EMP-001' }));
    });
});

describe('atualizar', () => {
    test('grava só os campos livres e devolve o operador atualizado', async () => {
        mockarOperador(DOC, { ...DOC, cargo: 'Líder' });

        const operador = await atualizar(ESCOPO, ID, { cargo: 'Líder', filialId: F2 } as any);

        expect(Operator.findOne).toHaveBeenCalledWith({ _id: ID, filialId: { $in: [F1, F2] } });
        expect(Operator.updateOne).toHaveBeenCalledWith({ _id: ID }, { $set: { cargo: 'Líder' } });
        expect(User.updateOne).not.toHaveBeenCalled();
        expect(operador).toEqual({ ...FORMATADO, cargo: 'Líder' });
    });

    test('nome novo vai também ao login ligado', async () => {
        mockarOperador(DOC, { ...DOC, nome: 'Ana Lima' });

        await atualizar(ESCOPO, ID, { nome: 'Ana Lima' });

        expect(Operator.updateOne).toHaveBeenCalledWith({ _id: ID }, { $set: { nome: 'Ana Lima' } });
        expect(User.updateOne).toHaveBeenCalledWith({ operadorId: ID }, { $set: { nome: 'Ana Lima' } });
    });

    test('fora do escopo ou inexistente: 404 sem gravar', async () => {
        mockarOperador(null);

        await expect(atualizar(ESCOPO, ID, { nome: 'X' })).rejects.toMatchObject({ status: 404, message: 'Operador não encontrado.' });
        expect(Operator.updateOne).not.toHaveBeenCalled();
    });
});

describe('excluir', () => {
    test('sem sessão aberta apaga o operador e o login dele', async () => {
        mockarOperador(DOC);
        vi.mocked(WorkSession.exists).mockResolvedValue(null);

        const resposta = await excluir(ESCOPO, ID);

        expect(WorkSession.exists).toHaveBeenCalledWith({ operadorId: ID, fim: null });
        expect(Operator.deleteOne).toHaveBeenCalledWith({ _id: ID });
        expect(User.deleteMany).toHaveBeenCalledWith({ operadorId: ID });
        expect(resposta).toEqual({ _id: ID, message: expect.any(String) });
    });

    test('com sessão aberta: 409 sem apagar nada', async () => {
        mockarOperador(DOC);
        vi.mocked(WorkSession.exists).mockResolvedValue({ _id: 's1' } as any);

        await expect(excluir(ESCOPO, ID)).rejects.toMatchObject({ status: 409, message: 'Operador com sessão aberta.' });
        expect(Operator.deleteOne).not.toHaveBeenCalled();
        expect(User.deleteMany).not.toHaveBeenCalled();
    });

    test('fora do escopo: 404', async () => {
        mockarOperador(null);

        await expect(excluir(ESCOPO, ID)).rejects.toMatchObject({ status: 404, message: 'Operador não encontrado.' });
        expect(Operator.deleteOne).not.toHaveBeenCalled();
    });
});
