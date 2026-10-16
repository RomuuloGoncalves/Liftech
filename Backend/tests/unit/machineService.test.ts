import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { criarMaquina, definirTrava, listarMaquinas, moverParaCategoria, obterMaquina } from '../../src/feature/machine/machineService.js';
import { Types } from 'mongoose';
import { Forklift } from '../../src/schemas/forklift.js';
import { Incident } from '../../src/schemas/incident.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { find: vi.fn(), updateOne: vi.fn(), countDocuments: vi.fn(), updateMany: vi.fn(), exists: vi.fn(), create: vi.fn(), deleteOne: vi.fn() } }));
import { Category } from '../../src/schemas/category.js';
vi.mock('../../src/schemas/category.js', () => ({ Category: { exists: vi.fn(), findOne: vi.fn() } }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: { find: vi.fn() } }));
import { Device } from '../../src/schemas/device.js';
import { Branch } from '../../src/schemas/branch.js';
vi.mock('../../src/schemas/device.js', () => ({ Device: { exists: vi.fn(), create: vi.fn(), deleteOne: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: {} }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { findById: vi.fn() } }));

const AGORA = new Date('2026-10-13T12:00:00Z');

function mockarLista(documentos: unknown[]) {
    const lean = vi.fn().mockResolvedValue(documentos);
    const populateOperador = vi.fn().mockReturnValue({ lean });
    const populateDispositivo = vi.fn().mockReturnValue({ populate: populateOperador });
    const sort = vi.fn().mockReturnValue({ populate: populateDispositivo });
    vi.mocked(Forklift.find).mockReturnValue({ sort } as any);
    return { sort, populateDispositivo, populateOperador };
}

const dispositivo = { _id: 'd1', enderecoMac: 'A2:C9:9B:1D:F7', status: 'Disponível' };
const operador = { _id: 'o1', nome: 'Carlos Silva' };
const ID = new Types.ObjectId();
const F1 = new Types.ObjectId().toHexString();
const F2 = new Types.ObjectId().toHexString();
const ESCOPO: Escopo = {
    empresaId: 'e1',
    tipo: 'filiais',
    filiais: [{ _id: F1, nome: 'Matriz', matriz: true }, { _id: F2, nome: 'Unidade Norte', matriz: false }],
};
const base = {
    _id: ID,
    identificacao: 'EMP-081',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    filialId: new Types.ObjectId(F1),
    dispositivoConectadoId: dispositivo,
    operadorConectadoId: operador,
    sessaoIniciadaEm: new Date(AGORA.getTime() - 34 * 60_000),
};

describe('listarMaquinas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(AGORA);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('monta o item no formato Machine com id em texto, dispositivo e operador', async () => {
        mockarLista([base]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item).toEqual({
            id: ID.toHexString(),
            identificacao: 'EMP-081',
            nome: 'Empilhadeira Elétrica Titan-X',
            setor: 'Expedição - Bloco B',
            filialId: F1,
            status: 'disponivel',
            categoriaId: null,
            categoriaTravada: false,
            alertaEm: null,
            dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F7' },
            operadorConectado: { nome: 'Carlos Silva' },
            tempoSessaoMinutos: 34,
        });
    });

    test('ordena por identificacao crescente e popula dispositivo e operador', async () => {
        const { sort, populateDispositivo, populateOperador } = mockarLista([base]);

        await listarMaquinas(ESCOPO);

        expect(sort).toHaveBeenCalledWith({ identificacao: 1 });
        expect(populateDispositivo).toHaveBeenCalledWith('dispositivoConectadoId');
        expect(populateOperador).toHaveBeenCalledWith('operadorConectadoId');
    });

    test('sem operador ligado: o item não tem a propriedade operadorConectado', async () => {
        mockarLista([{ ...base, operadorConectadoId: undefined }]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item).not.toHaveProperty('operadorConectado');
    });

    test('operador apagado (populate devolve null): o item não tem operadorConectado', async () => {
        mockarLista([{ ...base, operadorConectadoId: null }]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item).not.toHaveProperty('operadorConectado');
    });

    test('tempoSessaoMinutos é o número inteiro de minutos desde sessaoIniciadaEm', async () => {
        mockarLista([{ ...base, sessaoIniciadaEm: new Date(AGORA.getTime() - (47 * 60_000 + 59_000)) }]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item!.tempoSessaoMinutos).toBe(47);
    });

    test('sem sessaoIniciadaEm: tempoSessaoMinutos é 0', async () => {
        mockarLista([{ ...base, sessaoIniciadaEm: undefined }]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item!.tempoSessaoMinutos).toBe(0);
    });

    test('sessaoIniciadaEm no futuro: tempoSessaoMinutos é 0, nunca negativo', async () => {
        mockarLista([{ ...base, sessaoIniciadaEm: new Date(AGORA.getTime() + 10 * 60_000) }]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item!.tempoSessaoMinutos).toBe(0);
    });

    test.each([
        ['sem dispositivo ligado', undefined],
        ['dispositivo apagado (populate devolve null)', null],
    ])('%s: dispositivoConectado é { enderecoMac: "" }', async (_nome, valor) => {
        mockarLista([{ ...base, dispositivoConectadoId: valor }]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item!.dispositivoConectado).toEqual({ enderecoMac: '' });
    });

    test('a consulta falha: o erro do banco se propaga', async () => {
        vi.mocked(Forklift.find).mockImplementation(() => {
            throw new Error('falha de conexão');
        });

        await expect(listarMaquinas(ESCOPO)).rejects.toThrow('falha de conexão');
    });

    test('consulta só as filiais do escopo', async () => {
        mockarLista([base]);

        await listarMaquinas(ESCOPO);

        expect(Forklift.find).toHaveBeenCalledWith({ filialId: { $in: [F1, F2] } });
    });

    test('o item traz o filialId em texto', async () => {
        mockarLista([base]);

        const [item] = await listarMaquinas(ESCOPO);

        expect(item!.filialId).toBe(F1);
    });

    test('com filialId do escopo, o $in fica só com ela', async () => {
        mockarLista([base]);

        await listarMaquinas(ESCOPO, F2);

        expect(Forklift.find).toHaveBeenCalledWith({ filialId: { $in: [F2] } });
    });

    test('com filialId fora do escopo, o $in fica vazio e a lista é vazia', async () => {
        mockarLista([]);

        const lista = await listarMaquinas(ESCOPO, new Types.ObjectId().toHexString());

        expect(Forklift.find).toHaveBeenCalledWith({ filialId: { $in: [] } });
        expect(lista).toEqual([]);
    });

    test('escopo sem filiais consulta com $in vazio, e filialId não amplia', async () => {
        mockarLista([]);

        await listarMaquinas({ ...ESCOPO, filiais: [] }, F1);

        expect(Forklift.find).toHaveBeenCalledWith({ filialId: { $in: [] } });
    });
});

function mockarIncidentes(documentos: unknown[]) {
    const lean = vi.fn().mockResolvedValue(documentos);
    const sort = vi.fn().mockReturnValue({ lean });
    vi.mocked(Incident.find).mockReturnValue({ sort } as any);
    return { sort };
}

describe('status, categoria e trava na lista', () => {
    beforeEach(() => vi.clearAllMocks());

    test.each(['disponivel', 'em_uso', 'manutencao', 'offline'])('status %s passa direto', async (status) => {
        mockarLista([{ ...base, status }]);
        const [item] = await listarMaquinas(ESCOPO);
        expect(item!.status).toBe(status);
        expect(item!.alertaEm).toBeNull();
    });

    test('status null vira disponivel', async () => {
        mockarLista([{ ...base, status: null }]);
        const [item] = await listarMaquinas(ESCOPO);
        expect(item!.status).toBe('disponivel');
    });

    test('status vem da empilhadeira, não do dispositivo', async () => {
        mockarLista([{ ...base, status: 'manutencao', dispositivoConectadoId: { ...dispositivo, status: 'Offline' } }]);
        const [item] = await listarMaquinas(ESCOPO);
        expect(item!.status).toBe('manutencao');
    });

    test('categoriaId em texto e trava ligada', async () => {
        const categoria = new Types.ObjectId();
        mockarLista([{ ...base, categoriaId: categoria, categoriaTravada: true }]);
        const [item] = await listarMaquinas(ESCOPO);
        expect(item!.categoriaId).toBe(categoria.toHexString());
        expect(item!.categoriaTravada).toBe(true);
    });

    test('alerta: alertaEm é a data do pendente mais recente da máquina', async () => {
        const outra = new Types.ObjectId();
        mockarLista([{ ...base, status: 'alerta' }, { ...base, _id: outra, identificacao: 'EMP-085', status: 'alerta' }]);
        const { sort } = mockarIncidentes([
            { empilhadeiraId: ID, dataIncidente: new Date('2026-10-14T10:00:00Z') },
            { empilhadeiraId: ID, dataIncidente: new Date('2026-10-01T10:00:00Z') },
        ]);

        const [item, semIncidente] = await listarMaquinas(ESCOPO);

        expect(Incident.find).toHaveBeenCalledWith({ empilhadeiraId: { $in: [ID, outra] }, status: 'pendente' });
        expect(sort).toHaveBeenCalledWith({ dataIncidente: -1 });
        expect(item!.alertaEm).toBe('2026-10-14T10:00:00.000Z');
        expect(semIncidente!.alertaEm).toBeNull();
    });

    test('sem máquina em alerta não consulta incidentes', async () => {
        mockarLista([base]);
        await listarMaquinas(ESCOPO);
        expect(Incident.find).not.toHaveBeenCalled();
    });
});

describe('obterMaquina', () => {
    beforeEach(() => vi.clearAllMocks());

    test('busca pela id dentro do escopo e devolve a máquina', async () => {
        mockarLista([base]);
        const id = ID.toHexString();

        const maquina = await obterMaquina(ESCOPO, id);

        expect(Forklift.find).toHaveBeenCalledWith({ _id: id, filialId: { $in: [F1, F2] } });
        expect(maquina.id).toBe(id);
    });

    test('fora do escopo: 404', async () => {
        mockarLista([]);
        await expect(obterMaquina(ESCOPO, ID.toHexString())).rejects.toMatchObject({ status: 404 });
    });
});

describe('definirTrava', () => {
    beforeEach(() => vi.clearAllMocks());

    test.each([true, false])('grava categoriaTravada %s sem tocar na categoria', async (valor) => {
        mockarLista([{ ...base, categoriaTravada: valor }]);
        const id = ID.toHexString();

        const maquina = await definirTrava(ESCOPO, id, valor);

        expect(Forklift.updateOne).toHaveBeenCalledWith({ _id: id }, { $set: { categoriaTravada: valor } });
        expect(maquina.categoriaTravada).toBe(valor);
    });

    test('fora do escopo: 404 sem gravar', async () => {
        mockarLista([]);
        await expect(definirTrava(ESCOPO, ID.toHexString(), true)).rejects.toMatchObject({ status: 404 });
        expect(Forklift.updateOne).not.toHaveBeenCalled();
    });
});

describe('moverParaCategoria', () => {
    const CATEGORIA = new Types.ObjectId().toHexString();
    const OUTRA = new Types.ObjectId().toHexString();
    const ids = [ID.toHexString(), OUTRA];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Forklift.countDocuments).mockResolvedValue(2 as any);
        vi.mocked(Category.exists).mockResolvedValue({ _id: CATEGORIA } as any);
    });

    test('grava a categoria em todas e devolve as máquinas', async () => {
        mockarLista([{ ...base, categoriaId: new Types.ObjectId(CATEGORIA) }]);

        const lista = await moverParaCategoria(ESCOPO, ids, CATEGORIA);

        expect(Forklift.countDocuments).toHaveBeenCalledWith({ _id: { $in: ids }, filialId: { $in: [F1, F2] } });
        expect(Category.exists).toHaveBeenCalledWith({ _id: CATEGORIA, empresaId: 'e1' });
        expect(Forklift.updateMany).toHaveBeenCalledWith({ _id: { $in: ids } }, { $set: { categoriaId: CATEGORIA } });
        expect(lista[0]!.categoriaId).toBe(CATEGORIA);
    });

    test('null tira de qualquer categoria sem consultar categoria', async () => {
        mockarLista([base]);

        await moverParaCategoria(ESCOPO, ids, null);

        expect(Category.exists).not.toHaveBeenCalled();
        expect(Forklift.updateMany).toHaveBeenCalledWith({ _id: { $in: ids } }, { $set: { categoriaId: null } });
    });

    test('só grava categoriaId: status e trava não entram', async () => {
        mockarLista([base]);
        await moverParaCategoria(ESCOPO, ids, CATEGORIA);
        expect(Object.keys((vi.mocked(Forklift.updateMany).mock.calls[0]![1] as any).$set)).toEqual(['categoriaId']);
    });

    test('uma máquina fora do escopo: 404 sem gravar nenhuma', async () => {
        vi.mocked(Forklift.countDocuments).mockResolvedValue(1 as any);
        await expect(moverParaCategoria(ESCOPO, ids, CATEGORIA)).rejects.toMatchObject({ status: 404 });
        expect(Forklift.updateMany).not.toHaveBeenCalled();
    });

    test('categoria de outra empresa: 404 sem gravar', async () => {
        vi.mocked(Category.exists).mockResolvedValue(null);
        await expect(moverParaCategoria(ESCOPO, ids, CATEGORIA)).rejects.toMatchObject({ status: 404 });
        expect(Forklift.updateMany).not.toHaveBeenCalled();
    });

    test('ids repetidas contam uma vez', async () => {
        vi.mocked(Forklift.countDocuments).mockResolvedValue(1 as any);
        mockarLista([base]);
        await moverParaCategoria(ESCOPO, [ID.toHexString(), ID.toHexString()], null);
        expect(Forklift.updateMany).toHaveBeenCalledWith({ _id: { $in: [ID.toHexString()] } }, { $set: { categoriaId: null } });
    });
});

describe('criarMaquina', () => {
    const DEVICE = new Types.ObjectId();
    const EMPRESA = new Types.ObjectId();
    const CATEGORIA = new Types.ObjectId();
    const dados = { nome: 'Titan-X', identificacao: 'EMP-200', setor: 'Doca 1', nomeDispositivo: 'Sensor 01', enderecoMac: ' aa:bb:cc:dd:ee ', filialId: F1 };
    const lean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) }) as any;
    const criada = { _id: ID, identificacao: 'EMP-200', nome: 'Titan-X', setor: 'Doca 1', filialId: new Types.ObjectId(F1), status: 'disponivel', categoriaId: CATEGORIA, dispositivoConectadoId: { _id: DEVICE, enderecoMac: 'AA:BB:CC:DD:EE', nome: 'Sensor 01' } };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(AGORA);
        vi.mocked(Forklift.exists).mockResolvedValue(null);
        vi.mocked(Device.exists).mockResolvedValue(null);
        vi.mocked(Device.create).mockResolvedValue({ _id: DEVICE } as any);
        vi.mocked(Forklift.create).mockResolvedValue({ _id: ID } as any);
        vi.mocked(Branch.findById).mockReturnValue(lean({ _id: F1, empresaId: EMPRESA }));
        vi.mocked(Category.findOne).mockReturnValue(lean({ _id: CATEGORIA }));
        mockarLista([criada]);
    });
    afterEach(() => vi.useRealTimers());

    test('cria o device e o forklift ligados na filial, disponível e na categoria do status', async () => {
        await criarMaquina(ESCOPO, dados);

        expect(Device.create).toHaveBeenCalledWith({ enderecoMac: 'AA:BB:CC:DD:EE', nome: 'Sensor 01', filialId: F1 });
        expect(Category.findOne).toHaveBeenCalledWith({ empresaId: EMPRESA, statusVinculados: 'disponivel' });
        expect(Forklift.create).toHaveBeenCalledWith({
            identificacao: 'EMP-200',
            nome: 'Titan-X',
            setor: 'Doca 1',
            status: 'disponivel',
            statusAlteradoEm: AGORA,
            categoriaId: CATEGORIA,
            filialId: F1,
            dispositivoConectadoId: DEVICE,
        });
    });

    test('devolve a máquina no formato do GET, com nomeDispositivo', async () => {
        const maquina = await criarMaquina(ESCOPO, dados);

        expect(Forklift.find).toHaveBeenCalledWith({ _id: ID.toHexString(), filialId: { $in: [F1, F2] } });
        expect(maquina).toMatchObject({
            id: ID.toHexString(),
            identificacao: 'EMP-200',
            filialId: F1,
            status: 'disponivel',
            categoriaId: CATEGORIA.toHexString(),
            dispositivoConectado: { enderecoMac: 'AA:BB:CC:DD:EE', nomeDispositivo: 'Sensor 01' },
        });
    });

    test('sem categoria ligada a disponivel: categoriaId null', async () => {
        vi.mocked(Category.findOne).mockReturnValue(lean(null));

        await criarMaquina(ESCOPO, dados);

        expect(vi.mocked(Forklift.create).mock.calls[0]![0]).toMatchObject({ categoriaId: null });
    });

    test('identificação já usada: 409 sem gravar nada', async () => {
        vi.mocked(Forklift.exists).mockResolvedValue({ _id: new Types.ObjectId() } as any);

        await expect(criarMaquina(ESCOPO, dados)).rejects.toMatchObject({ status: 409, message: 'Já existe uma empilhadeira com a identificação "EMP-200".' });
        expect(Forklift.exists).toHaveBeenCalledWith({ identificacao: 'EMP-200' });
        expect(Device.create).not.toHaveBeenCalled();
        expect(Forklift.create).not.toHaveBeenCalled();
    });

    test('MAC já usado (comparado em maiúsculas): 409 sem gravar nada', async () => {
        vi.mocked(Device.exists).mockResolvedValue({ _id: new Types.ObjectId() } as any);

        await expect(criarMaquina(ESCOPO, dados)).rejects.toMatchObject({ status: 409, message: 'Já existe um dispositivo com este endereço MAC.' });
        expect(Device.exists).toHaveBeenCalledWith({ enderecoMac: 'AA:BB:CC:DD:EE' });
        expect(Device.create).not.toHaveBeenCalled();
        expect(Forklift.create).not.toHaveBeenCalled();
    });

    test('o Mongo recusa o MAC (11000): 409 com a mesma mensagem, sem criar o forklift', async () => {
        vi.mocked(Device.create).mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }));

        await expect(criarMaquina(ESCOPO, dados)).rejects.toMatchObject({ status: 409, message: 'Já existe um dispositivo com este endereço MAC.' });
        expect(Forklift.create).not.toHaveBeenCalled();
    });

    test('o forklift falha: apaga o device criado e repassa o erro', async () => {
        vi.mocked(Forklift.create).mockRejectedValue(new Error('falha no forklift'));

        await expect(criarMaquina(ESCOPO, dados)).rejects.toThrow('falha no forklift');
        expect(Device.deleteOne).toHaveBeenCalledWith({ _id: DEVICE });
    });
});

describe('nomeDispositivo na lista', () => {
    beforeEach(() => vi.clearAllMocks());

    test('vem de device.nome', async () => {
        mockarLista([{ ...base, dispositivoConectadoId: { ...dispositivo, nome: 'Sensor 07' } }]);
        const [item] = await listarMaquinas(ESCOPO);
        expect(item!.dispositivoConectado).toEqual({ enderecoMac: 'A2:C9:9B:1D:F7', nomeDispositivo: 'Sensor 07' });
    });
});
