import { describe, test, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';
import { User } from '../../src/schemas/user.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Device } from '../../src/schemas/device.js';
import { Operator } from '../../src/schemas/operator.js';
import { Incident } from '../../src/schemas/incident.js';

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

describe('filialId nos recursos', () => {
    test.each([
        ['forklift', Forklift],
        ['device', Device],
        ['operator', Operator],
        ['incident', Incident],
    ])('%s: filialId é obrigatório', async (_nome, Modelo) => {
        expect(await erros(new Modelo({}))).toEqual(['filialId']);
        expect(await erros(new Modelo({ filialId: new mongoose.Types.ObjectId() }))).toEqual([]);
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

describe('schema category', async () => {
    const { Category } = await import('../../src/schemas/category.js');
    const empresaId = new mongoose.Types.ObjectId();
    const valida = { empresaId, nome: 'Pátio', cor: '#3A9CFF' };

    test('categoria válida passa e statusVinculados começa vazio', async () => {
        const categoria = new Category(valida);
        expect(await erros(categoria)).toEqual([]);
        expect(categoria.statusVinculados).toHaveLength(0);
        expect(categoria.chave).toBeNull();
    });

    test('nome vazio ou com mais de 40 caracteres falha', async () => {
        expect(await erros(new Category({ ...valida, nome: '   ' }))).toEqual(['nome']);
        expect(await erros(new Category({ ...valida, nome: 'a'.repeat(41) }))).toEqual(['nome']);
        expect(await erros(new Category({ ...valida, nome: 'a'.repeat(40) }))).toEqual([]);
    });

    test.each(['#12345', '#GGGGGG', '3A9CFF', '#3A9CFF0'])('cor %s falha', async (cor) => {
        expect(await erros(new Category({ ...valida, cor }))).toEqual(['cor']);
    });

    test('nome único por empresa sem diferenciar caixa', () => {
        expect(Category.schema.indexes()).toContainEqual([
            { empresaId: 1, nome: 1 },
            expect.objectContaining({ unique: true, collation: { locale: 'pt', strength: 2 } }),
        ]);
    });
});

describe('status e categoria na empilhadeira', () => {
    const filialId = new mongoose.Types.ObjectId();

    test('padrões: status null, sem categoria e destravada', () => {
        const f = new Forklift({ filialId });
        expect(f.status).toBeNull();
        expect(f.categoriaId).toBeNull();
        expect(f.categoriaTravada).toBe(false);
    });

    test.each(['disponivel', 'em_uso', 'manutencao', 'alerta', 'offline'])('status %s é aceito', async (status) => {
        expect(await erros(new Forklift({ filialId, status }))).toEqual([]);
    });

    test('status fora da lista falha', async () => {
        expect(await erros(new Forklift({ filialId, status: 'Disponível' }))).toEqual(['status']);
    });

    test('categoriaId tem índice', () => {
        expect(Forklift.schema.indexes()).toContainEqual([{ categoriaId: 1 }, expect.anything()]);
    });
});

describe('forcaImpacto na telemetria', async () => {
    const { Telemetry } = await import('../../src/schemas/telemetry.js');

    test('guarda forcaImpacto numérico', () => {
        expect(new Telemetry({ dataDados: new Date(), forcaImpacto: 7 }).forcaImpacto).toBe(7);
    });
});

describe('sessão do funcionário', async () => {
    const { WorkSession } = await import('../../src/schemas/workSession.js');
    const id = () => new mongoose.Types.ObjectId();

    test('user: operadorId é opcional e guarda o operator', async () => {
        const empresaId = id();
        expect(await erros(new User({ nome: 'Ana', role: 'colaborador', empresaId }))).toEqual([]);
        const operadorId = id();
        expect(new User({ nome: 'Ana', role: 'colaborador', empresaId, operadorId }).operadorId).toEqual(operadorId);
    });

    test('workSession: operador, empilhadeira, filial e inicio são obrigatórios; fim começa null', async () => {
        expect((await erros(new WorkSession({}))).sort()).toEqual(['empilhadeiraId', 'filialId', 'inicio', 'operadorId']);
        const sessao = new WorkSession({ operadorId: id(), empilhadeiraId: id(), filialId: id(), inicio: new Date() });
        expect(await erros(sessao)).toEqual([]);
        expect(sessao.fim).toBeNull();
    });

    test('workSession: filialId tem índice e há índices únicos parciais de sessão aberta', () => {
        const indices = WorkSession.schema.indexes();
        expect(indices).toContainEqual([{ filialId: 1 }, expect.anything()]);
        for (const campo of ['operadorId', 'empilhadeiraId']) {
            expect(indices).toContainEqual([{ [campo]: 1 }, expect.objectContaining({ unique: true, partialFilterExpression: { fim: null } })]);
        }
    });

    test('incident: origem padrão sensor, aceita funcionario e recusa outra', async () => {
        const filialId = id();
        expect(new Incident({ filialId }).origem).toBe('sensor');
        expect(await erros(new Incident({ filialId, origem: 'funcionario' }))).toEqual([]);
        expect(await erros(new Incident({ filialId, origem: 'outro' }))).toEqual(['origem']);
    });

    test('incident: descricao até 500 caracteres', async () => {
        const filialId = id();
        expect(await erros(new Incident({ filialId, descricao: 'a'.repeat(500) }))).toEqual([]);
        expect(await erros(new Incident({ filialId, descricao: 'a'.repeat(501) }))).toEqual(['descricao']);
    });
});

describe('cadastro de máquina e equipe', () => {
    const filialId = new mongoose.Types.ObjectId();

    test('operator: guarda matricula, telefone, cargo e horários sem espaços nas pontas', () => {
        const o = new Operator({
            filialId, nome: 'Ana', matricula: ' EMP-001 ', telefone: ' (11) 99999-0000 ',
            cargo: ' Operadora ', horarioEntrada: ' 08:00 ', horarioSaida: ' 17:00 ',
        });
        expect(o.matricula).toBe('EMP-001');
        expect(o.telefone).toBe('(11) 99999-0000');
        expect(o.cargo).toBe('Operadora');
        expect(o.horarioEntrada).toBe('08:00');
        expect(o.horarioSaida).toBe('17:00');
    });

    test('user: acessoNegado nasce false e guarda true', () => {
        const empresaId = new mongoose.Types.ObjectId();
        expect(new User({ nome: 'Ana', role: 'colaborador', empresaId }).acessoNegado).toBe(false);
        expect(new User({ nome: 'Ana', role: 'colaborador', empresaId, acessoNegado: true }).acessoNegado).toBe(true);
    });

    test('device: guarda nome e enderecoMac tem índice único', () => {
        expect(new Device({ filialId, nome: 'Sensor 01' }).nome).toBe('Sensor 01');
        expect(Device.schema.indexes()).toContainEqual([{ enderecoMac: 1 }, expect.objectContaining({ unique: true })]);
    });
});
