import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { listar, criar, atualizar, excluir, criarLogin, atualizarLogin, removerLogin } from '../../src/feature/operator/operatorService.js';
import { verificarSenha } from '../../src/utils/senha.js';
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
            nome: 'Ana Souza', telefone: '1', cargo: 'Op', horarioEntrada: '08:00', horarioSaida: '', filialId: F1, empresaId: 'e1', matricula: 'EMP-093',
        });
        expect(operador).toMatchObject({ id: ID, matricula: 'EMP-093', filialId: F1, usuario: null, acesso: 'Negado' });
    });

    test('sem operadores na empresa a matrícula é EMP-001', async () => {
        vi.mocked(Operator.distinct).mockResolvedValue([] as any);

        await criar(ESCOPO, { nome: 'Ana', filialId: F1 });

        expect(Operator.create).toHaveBeenCalledWith(expect.objectContaining({ matricula: 'EMP-001' }));
    });

    test('matrícula repetida numa corrida (11000): recalcula e tenta de novo', async () => {
        vi.mocked(Operator.distinct).mockResolvedValueOnce(['EMP-001'] as any).mockResolvedValueOnce(['EMP-001', 'EMP-002'] as any);
        vi.mocked(Operator.create).mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));

        const operador = await criar(ESCOPO, { nome: 'Ana', filialId: F1 });

        expect(Operator.create).toHaveBeenCalledTimes(2);
        expect(operador.matricula).toBe('EMP-003');
    });

    test('desiste depois de 5 colisões seguidas', async () => {
        vi.mocked(Operator.distinct).mockResolvedValue([] as any);
        vi.mocked(Operator.create).mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));

        await expect(criar(ESCOPO, { nome: 'Ana', filialId: F1 })).rejects.toMatchObject({ code: 11000 });
        expect(Operator.create).toHaveBeenCalledTimes(5);
    });

    describe('com login', () => {
        const login = { usuario: 'ana', senha: 'segredo123' };
        beforeEach(() => {
            vi.mocked(Operator.distinct).mockResolvedValue([] as any);
            vi.mocked(User.exists).mockResolvedValue(null as any);
            vi.mocked(User.create).mockResolvedValue({} as any);
            mockarOperador(DOC, DOC);
            mockarLogins([{ operadorId: DOC._id, usuario: 'ana' }]);
        });

        test('cria o operador e o login numa chamada só', async () => {
            const operador = await criar(ESCOPO, { nome: 'Ana', filialId: F1, login });

            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ usuario: 'ana', operadorId: String(DOC._id), filiaisIds: [DOC.filialId] }));
            expect(operador).toMatchObject({ usuario: 'ana', acesso: 'Permitido' });
        });

        test('usuário já usado: 409 sem criar o operador', async () => {
            vi.mocked(User.exists).mockResolvedValue({ _id: 'u' } as any);

            await expect(criar(ESCOPO, { nome: 'Ana', filialId: F1, login })).rejects.toMatchObject({ status: 409 });
            expect(Operator.create).not.toHaveBeenCalled();
        });

        test('login recusado depois do operador: desfaz o operador', async () => {
            vi.mocked(User.create).mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));

            await expect(criar(ESCOPO, { nome: 'Ana', filialId: F1, login })).rejects.toMatchObject({ status: 409 });
            expect(Operator.deleteOne).toHaveBeenCalledWith({ _id: DOC._id });
        });
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
        // Login antes do operador: uma falha no meio nunca deixa login órfão.
        expect(vi.mocked(User.deleteMany).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(Operator.deleteOne).mock.invocationCallOrder[0]);
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

describe('criarLogin', () => {
    test('cria o user colaborador ligado ao operador, com hash da senha, e devolve o operador com acesso Permitido', async () => {
        mockarOperador(DOC, DOC);
        vi.mocked(User.exists).mockResolvedValue(null);
        vi.mocked(User.create).mockResolvedValue({} as any);
        mockarLogins([{ operadorId: DOC._id, usuario: 'ana.souza', acessoNegado: false, senhaHash: 'x' }]);

        const operador = await criarLogin(ESCOPO, ID, { usuario: 'ana.souza', senha: 'segredo123' });

        const criado = vi.mocked(User.create).mock.calls[0]![0] as any;
        expect(criado).toEqual({
            nome: 'Ana Souza', role: 'colaborador', usuario: 'ana.souza', senhaHash: expect.any(String),
            empresaId: 'e1', escopo: 'filiais', filiaisIds: [DOC.filialId], operadorId: ID,
        });
        expect(verificarSenha('segredo123', criado.senhaHash)).toBe(true);
        expect(operador).toEqual({ ...FORMATADO, usuario: 'ana.souza', acesso: 'Permitido' });
        expect(operador).not.toHaveProperty('senha');
        expect(operador).not.toHaveProperty('senhaHash');
    });

    test('operador que já tem login: 409 sem criar', async () => {
        mockarOperador(DOC);
        vi.mocked(User.exists).mockResolvedValueOnce({ _id: 'u1' } as any);

        await expect(criarLogin(ESCOPO, ID, { usuario: 'ana', senha: 'segredo123' }))
            .rejects.toMatchObject({ status: 409, message: 'Este operador já tem login.' });
        expect(User.exists).toHaveBeenCalledWith({ operadorId: ID });
        expect(User.create).not.toHaveBeenCalled();
    });

    test('usuário já usado por outro user: 409 sem criar', async () => {
        mockarOperador(DOC);
        vi.mocked(User.exists).mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: 'u2' } as any);

        await expect(criarLogin(ESCOPO, ID, { usuario: 'ana', senha: 'segredo123' }))
            .rejects.toMatchObject({ status: 409, message: 'Este usuário já está em uso.' });
        expect(User.exists).toHaveBeenLastCalledWith({ usuario: 'ana' });
        expect(User.create).not.toHaveBeenCalled();
    });

    test('índice único recusa o usuário numa corrida (11000): mesmo 409', async () => {
        mockarOperador(DOC);
        vi.mocked(User.exists).mockResolvedValue(null);
        vi.mocked(User.create).mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));

        await expect(criarLogin(ESCOPO, ID, { usuario: 'ana', senha: 'segredo123' }))
            .rejects.toMatchObject({ status: 409, message: 'Este usuário já está em uso.' });
    });

    test('operador fora do escopo: 404', async () => {
        mockarOperador(null);

        await expect(criarLogin(ESCOPO, ID, { usuario: 'ana', senha: 'segredo123' }))
            .rejects.toMatchObject({ status: 404, message: 'Operador não encontrado.' });
        expect(User.create).not.toHaveBeenCalled();
    });
});

describe('atualizarLogin', () => {
    test('senha nova grava um hash novo dessa senha', async () => {
        mockarOperador(DOC, DOC);
        vi.mocked(User.updateOne).mockResolvedValue({ matchedCount: 1 } as any);

        await atualizarLogin(ESCOPO, ID, { senha: 'novaSenha99' });

        const [filtro, { $set }] = vi.mocked(User.updateOne).mock.calls[0] as any;
        expect(filtro).toEqual({ operadorId: ID });
        expect(Object.keys($set)).toEqual(['senhaHash']);
        expect(verificarSenha('novaSenha99', $set.senhaHash)).toBe(true);
    });

    test('acessoNegado é gravado e o acesso da resposta acompanha', async () => {
        mockarOperador(DOC, DOC);
        vi.mocked(User.updateOne).mockResolvedValue({ matchedCount: 1 } as any);
        mockarLogins([{ operadorId: DOC._id, usuario: 'ana', acessoNegado: true }]);

        const operador = await atualizarLogin(ESCOPO, ID, { acessoNegado: true });

        expect(User.updateOne).toHaveBeenCalledWith({ operadorId: ID }, { $set: { acessoNegado: true } });
        expect(operador).toMatchObject({ usuario: 'ana', acesso: 'Negado' });
        expect(operador).not.toHaveProperty('senhaHash');
    });

    test('operador sem login: 404 "Operador sem login."', async () => {
        mockarOperador(DOC);
        vi.mocked(User.updateOne).mockResolvedValue({ matchedCount: 0 } as any);

        await expect(atualizarLogin(ESCOPO, ID, { acessoNegado: false }))
            .rejects.toMatchObject({ status: 404, message: 'Operador sem login.' });
    });

    test('operador fora do escopo: 404 sem gravar', async () => {
        mockarOperador(null);

        await expect(atualizarLogin(ESCOPO, ID, { acessoNegado: true }))
            .rejects.toMatchObject({ status: 404, message: 'Operador não encontrado.' });
        expect(User.updateOne).not.toHaveBeenCalled();
    });
});

describe('removerLogin', () => {
    test('apaga o user do operador e devolve usuario null e acesso Negado', async () => {
        mockarOperador(DOC, DOC);
        vi.mocked(User.deleteOne).mockResolvedValue({ deletedCount: 1 } as any);

        const operador = await removerLogin(ESCOPO, ID);

        expect(User.deleteOne).toHaveBeenCalledWith({ operadorId: ID });
        expect(operador).toEqual(FORMATADO);
    });

    test('operador sem login: 404 "Operador sem login."', async () => {
        mockarOperador(DOC);
        vi.mocked(User.deleteOne).mockResolvedValue({ deletedCount: 0 } as any);

        await expect(removerLogin(ESCOPO, ID)).rejects.toMatchObject({ status: 404, message: 'Operador sem login.' });
    });

    test('operador fora do escopo: 404 sem apagar', async () => {
        mockarOperador(null);

        await expect(removerLogin(ESCOPO, ID)).rejects.toMatchObject({ status: 404, message: 'Operador não encontrado.' });
        expect(User.deleteOne).not.toHaveBeenCalled();
    });
});
