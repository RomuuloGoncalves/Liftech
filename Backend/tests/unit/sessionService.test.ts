import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkSession } from '../../src/schemas/workSession.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Operator } from '../../src/schemas/operator.js';
import { obterMaquina } from '../../src/feature/machine/machineService.js';
import { aplicarStatus } from '../../src/feature/machine/statusService.js';
import { atual, iniciar, encerrar, listar, lerPeriodo, lerFilialId, LIMITE_HISTORICO } from '../../src/feature/session/sessionService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/workSession.js', () => ({
    WorkSession: { findOne: vi.fn(), find: vi.fn(), exists: vi.fn(), create: vi.fn(), updateOne: vi.fn() },
}));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { find: vi.fn(), findById: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: { find: vi.fn() } }));
vi.mock('../../src/schemas/sector.js', () => ({ Sector: { find: vi.fn() } }));
import { Sector } from '../../src/schemas/sector.js';
const SETOR = '665f1c2b9a1e4b00123456c1';
vi.mock('../../src/feature/machine/machineService.js', () => ({ obterMaquina: vi.fn() }));
vi.mock('../../src/feature/machine/statusService.js', () => ({ aplicarStatus: vi.fn() }));

const lean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) }) as any;

const AGORA = new Date('2026-10-15T12:00:00Z');
const OPERADOR = '665f1c2b9a1e4b00123456c1';
const MAQUINA = '665f1c2b9a1e4b00123456d1';
const SESSAO = '665f1c2b9a1e4b00123456e1';
const FILIAL = '665f1c2b9a1e4b00123456b1';
const escopo: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [{ _id: FILIAL, nome: 'Matriz', matriz: true }] };
const usuario = { _id: 'u1', role: 'colaborador', operadorId: OPERADOR };
const semOperador = { _id: 'u1', role: 'colaborador', operadorId: null };
const admin = { _id: 'u2', role: 'admin', operadorId: null };

const ABERTA = { _id: SESSAO, operadorId: OPERADOR, empilhadeiraId: MAQUINA, filialId: FILIAL, inicio: AGORA, fim: null };
const FORMATADA = {
    _id: SESSAO,
    machineId: MAQUINA,
    maquina: { nome: 'Titan', identificacao: 'EMP-081', setor: 'Expedição' },
    operador: { nome: 'Carlos Silva' },
    inicio: AGORA.toISOString(),
    fim: null,
};

function mockarRelacionados(maquinas: unknown[] = [{ _id: MAQUINA, nome: 'Titan', identificacao: 'EMP-081', setor: 'Texto legado', setorId: SETOR }]) {
    vi.mocked(Forklift.find).mockReturnValue(lean(maquinas));
    vi.mocked(Operator.find).mockReturnValue(lean([{ _id: OPERADOR, nome: 'Carlos Silva' }]));
    vi.mocked(Sector.find).mockReturnValue(lean([{ _id: SETOR, nome: 'Expedição' }]));
}

const erro = async (promessa: Promise<unknown>) => {
    try {
        await promessa;
    } catch (e) {
        expect(e).toBeInstanceOf(ErroHttp);
        return (e as ErroHttp).status;
    }
    throw new Error('não lançou');
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(AGORA);
    mockarRelacionados();
});
afterEach(() => vi.useRealTimers());

describe('atual', () => {
    test('devolve a sessão aberta do operador formatada', async () => {
        vi.mocked(WorkSession.findOne).mockReturnValue(lean(ABERTA));

        expect(await atual(usuario)).toEqual(FORMATADA);
        expect(WorkSession.findOne).toHaveBeenCalledWith({ operadorId: OPERADOR, fim: null });
    });

    test("máquina sem setor: maquina.setor ''", async () => {
        mockarRelacionados([{ _id: MAQUINA, nome: 'Titan', identificacao: 'EMP-081', setor: 'Texto legado', setorId: null }]);
        vi.mocked(WorkSession.findOne).mockReturnValue(lean(ABERTA));

        expect((await atual(usuario))!.maquina).toEqual({ nome: 'Titan', identificacao: 'EMP-081', setor: '' });
    });

    test('sem sessão aberta: null', async () => {
        vi.mocked(WorkSession.findOne).mockReturnValue(lean(null));
        expect(await atual(usuario)).toBeNull();
    });

    test('sem operador: 403', async () => {
        expect(await erro(atual(semOperador))).toBe(403);
    });
});

describe('iniciar', () => {
    beforeEach(() => {
        vi.mocked(obterMaquina).mockResolvedValue({ id: MAQUINA, filialId: FILIAL, status: 'disponivel' } as any);
        vi.mocked(WorkSession.exists).mockResolvedValue(null);
        vi.mocked(WorkSession.create).mockResolvedValue({ _id: SESSAO } as any);
        vi.mocked(WorkSession.findOne).mockReturnValue(lean(ABERTA));
    });

    test('cria a sessão, liga operador e início na máquina, aplica em_uso e devolve a sessão', async () => {
        expect(await iniciar(escopo, usuario, MAQUINA)).toEqual(FORMATADA);

        expect(obterMaquina).toHaveBeenCalledWith(escopo, MAQUINA);
        expect(WorkSession.create).toHaveBeenCalledWith({ operadorId: OPERADOR, empilhadeiraId: MAQUINA, filialId: FILIAL, inicio: AGORA });
        expect(Forklift.updateOne).toHaveBeenCalledWith({ _id: MAQUINA }, { $set: { operadorConectadoId: OPERADOR, sessaoIniciadaEm: AGORA } });
        expect(aplicarStatus).toHaveBeenCalledWith(MAQUINA, 'em_uso');
    });

    const nadaGravado = () => {
        expect(WorkSession.create).not.toHaveBeenCalled();
        expect(Forklift.updateOne).not.toHaveBeenCalled();
        expect(aplicarStatus).not.toHaveBeenCalled();
    };

    test('máquina não disponível: 409 sem gravar', async () => {
        vi.mocked(obterMaquina).mockResolvedValue({ id: MAQUINA, filialId: FILIAL, status: 'manutencao' } as any);
        expect(await erro(iniciar(escopo, usuario, MAQUINA))).toBe(409);
        nadaGravado();
    });

    test('operador ou máquina com sessão aberta: 409 sem gravar', async () => {
        vi.mocked(WorkSession.exists).mockResolvedValue({ _id: SESSAO } as any);
        expect(await erro(iniciar(escopo, usuario, MAQUINA))).toBe(409);
        expect(WorkSession.exists).toHaveBeenCalledWith({ fim: null, $or: [{ operadorId: OPERADOR }, { empilhadeiraId: MAQUINA }] });
        nadaGravado();
    });

    test('corrida recusada pelo índice (11000): 409 sem mexer na máquina', async () => {
        vi.mocked(WorkSession.create).mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));
        expect(await erro(iniciar(escopo, usuario, MAQUINA))).toBe(409);
        expect(Forklift.updateOne).not.toHaveBeenCalled();
        expect(aplicarStatus).not.toHaveBeenCalled();
    });

    test('outro erro do banco sobe como está', async () => {
        vi.mocked(WorkSession.create).mockRejectedValue(new Error('falha'));
        await expect(iniciar(escopo, usuario, MAQUINA)).rejects.toThrow('falha');
    });

    test('máquina inexistente ou fora do escopo: 404', async () => {
        vi.mocked(obterMaquina).mockRejectedValue(new ErroHttp(404, 'Máquina não encontrada.'));
        expect(await erro(iniciar(escopo, usuario, MAQUINA))).toBe(404);
        nadaGravado();
    });

    test('sem operador: 403 antes de consultar a máquina', async () => {
        expect(await erro(iniciar(escopo, semOperador, MAQUINA))).toBe(403);
        expect(obterMaquina).not.toHaveBeenCalled();
    });
});

describe('encerrar', () => {
    beforeEach(() => {
        vi.mocked(WorkSession.findOne)
            .mockReturnValueOnce(lean(ABERTA))
            .mockReturnValueOnce(lean({ ...ABERTA, fim: AGORA }));
    });

    test('grava fim, limpa operador e início, aplica disponivel se em_uso e devolve a sessão encerrada', async () => {
        vi.mocked(Forklift.findById).mockReturnValue(lean({ _id: MAQUINA, status: 'em_uso' }));

        expect(await encerrar(usuario)).toEqual({ ...FORMATADA, fim: AGORA.toISOString() });

        expect(WorkSession.updateOne).toHaveBeenCalledWith({ _id: SESSAO }, { $set: { fim: AGORA } });
        expect(Forklift.updateOne).toHaveBeenCalledWith({ _id: MAQUINA }, { $unset: { operadorConectadoId: 1, sessaoIniciadaEm: 1 } });
        expect(aplicarStatus).toHaveBeenCalledWith(MAQUINA, 'disponivel');
    });

    test('máquina em alerta: limpa a sessão mas mantém o status', async () => {
        vi.mocked(Forklift.findById).mockReturnValue(lean({ _id: MAQUINA, status: 'alerta' }));

        await encerrar(usuario);

        expect(Forklift.updateOne).toHaveBeenCalled();
        expect(aplicarStatus).not.toHaveBeenCalled();
    });

    test('máquina apagada: grava fim e responde com maquina null', async () => {
        vi.mocked(Forklift.findById).mockReturnValue(lean(null));
        mockarRelacionados([]);

        const sessao = await encerrar(usuario);

        expect(WorkSession.updateOne).toHaveBeenCalled();
        expect(Forklift.updateOne).not.toHaveBeenCalled();
        expect(sessao).toMatchObject({ machineId: MAQUINA, maquina: null, fim: AGORA.toISOString() });
    });

    test('sem sessão aberta: 409', async () => {
        vi.mocked(WorkSession.findOne).mockReset().mockReturnValue(lean(null));
        expect(await erro(encerrar(usuario))).toBe(409);
        expect(WorkSession.updateOne).not.toHaveBeenCalled();
    });

    test('sem operador: 403', async () => {
        expect(await erro(encerrar(semOperador))).toBe(403);
    });
});

describe('listar', () => {
    const limit = vi.fn();
    const sort = vi.fn();
    beforeEach(() => {
        limit.mockReturnValue(lean([ABERTA]));
        sort.mockReturnValue({ limit });
        vi.mocked(WorkSession.find).mockReturnValue({ sort } as any);
    });

    test('colaborador: só as sessões do seu operador no escopo, mais recente primeiro limitado a 500', async () => {
        expect(await listar(escopo, usuario, {})).toEqual([FORMATADA]);
        expect(WorkSession.find).toHaveBeenCalledWith({ filialId: { $in: [FILIAL] }, operadorId: OPERADOR });
        expect(sort).toHaveBeenCalledWith({ inicio: -1 });
        expect(limit).toHaveBeenCalledWith(500);
    });

    test('admin: lista sessões de todos os operadores do escopo sem operadorId', async () => {
        expect(await listar(escopo, admin, {})).toEqual([FORMATADA]);
        expect(WorkSession.find).toHaveBeenCalledWith({ filialId: { $in: [FILIAL] } });
        expect(sort).toHaveBeenCalledWith({ inicio: -1 });
        expect(limit).toHaveBeenCalledWith(500);
    });

    test('admin com filialId do escopo: reduz o filtro', async () => {
        await listar(escopo, admin, { filialId: FILIAL });
        expect(WorkSession.find).toHaveBeenCalledWith({ filialId: { $in: [FILIAL] } });
    });

    test('admin com filialId fora do escopo: $in vazio', async () => {
        await listar(escopo, admin, { filialId: '665f1c2b9a1e4b00123456f1' });
        expect(WorkSession.find).toHaveBeenCalledWith({ filialId: { $in: [] } });
    });

    test('com machineId: sessões de qualquer operador da máquina no escopo', async () => {
        await listar(escopo, semOperador, { machineId: MAQUINA });
        expect(WorkSession.find).toHaveBeenCalledWith({ filialId: { $in: [FILIAL] }, empilhadeiraId: MAQUINA });
    });

    test('from e to filtram o início por dia, inclusivo', async () => {
        await listar(escopo, usuario, { from: '2026-10-01', to: '2026-10-15' });
        expect(vi.mocked(WorkSession.find).mock.calls[0]![0]).toMatchObject({
            inicio: { $gte: new Date('2026-10-01T00:00:00'), $lt: new Date('2026-10-16T00:00:00') },
        });
    });

    test('from > to: [] sem consultar', async () => {
        expect(await listar(escopo, usuario, { from: '2026-10-15', to: '2026-10-01' })).toEqual([]);
        expect(WorkSession.find).not.toHaveBeenCalled();
    });

    test.each([
        ['machineId inválido', { machineId: 'abc' }],
        ['filialId inválido', { filialId: 'abc' }],
        ['from fora do formato', { from: '15/10/2026' }],
        ['to fora do formato', { to: '2026-13-45' }],
    ])('%s: 400', async (_caso, filtro) => {
        expect(await erro(listar(escopo, usuario, filtro))).toBe(400);
        expect(WorkSession.find).not.toHaveBeenCalled();
    });

    test('sem machineId e sem operador: 403', async () => {
        expect(await erro(listar(escopo, semOperador, {}))).toBe(403);
    });
});

describe('lerFilialId', () => {
    test('vazio ou indefinido: undefined', () => {
        expect(lerFilialId(undefined)).toBeUndefined();
        expect(lerFilialId('')).toBeUndefined();
    });

    test('válido: devolve o id', () => {
        expect(lerFilialId(FILIAL)).toBe(FILIAL);
    });

    test('inválido: 400', () => {
        expect(() => lerFilialId('invalido')).toThrow(ErroHttp);
        expect(() => lerFilialId(123)).toThrow(ErroHttp);
    });
});

describe('lerPeriodo', () => {
    test('vazio: sem filtro', () => {
        expect(lerPeriodo(undefined, undefined)).toEqual({});
    });
});
