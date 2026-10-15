import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Incident } from '../../src/schemas/incident.js';
import { WorkSession } from '../../src/schemas/workSession.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Operator } from '../../src/schemas/operator.js';
import { aplicarStatus } from '../../src/feature/machine/statusService.js';
import { reportar, listar } from '../../src/feature/incident/incidentService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/incident.js', () => ({ Incident: { create: vi.fn(), find: vi.fn() } }));
vi.mock('../../src/schemas/workSession.js', () => ({ WorkSession: { findOne: vi.fn() } }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { find: vi.fn() } }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: { find: vi.fn() } }));
vi.mock('../../src/feature/machine/machineService.js', () => ({ obterMaquina: vi.fn() }));
vi.mock('../../src/feature/machine/statusService.js', () => ({ aplicarStatus: vi.fn() }));

const lean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) }) as any;

const AGORA = new Date('2026-10-15T12:34:56');
const OPERADOR = '665f1c2b9a1e4b00123456c1';
const MAQUINA = '665f1c2b9a1e4b00123456d1';
const FILIAL = '665f1c2b9a1e4b00123456b1';
const INCIDENTE = '665f1c2b9a1e4b00123456f1';
const escopo: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [{ _id: FILIAL, nome: 'Matriz', matriz: true }] };
const usuario = { _id: 'u1', role: 'colaborador', operadorId: OPERADOR };
const MAQUINA_DOC = { _id: MAQUINA, nome: 'Titan', identificacao: 'EMP-081', setor: 'Expedição' };
const MAQUINA_FORMATADA = { nome: 'Titan', identificacao: 'EMP-081', setor: 'Expedição' };

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
    vi.mocked(Forklift.find).mockReturnValue(lean([MAQUINA_DOC]));
    vi.mocked(Operator.find).mockReturnValue(lean([{ _id: OPERADOR, nome: 'Carlos Silva' }]));
});
afterEach(() => vi.useRealTimers());

describe('reportar', () => {
    beforeEach(() => {
        vi.mocked(WorkSession.findOne).mockReturnValue(lean({ _id: 's1', operadorId: OPERADOR, empilhadeiraId: MAQUINA, filialId: FILIAL, fim: null }));
        vi.mocked(Incident.create).mockImplementation((async (doc: any) => ({ _id: INCIDENTE, ...doc })) as any);
    });

    test('cria incidente pendente do funcionário na máquina da sessão, aplica alerta e devolve o incidente', async () => {
        const incidente = await reportar(usuario, { horario: '09:15', descricao: 'Pneu furado' });

        const esperada = new Date(AGORA);
        esperada.setHours(9, 15, 0, 0);
        expect(Incident.create).toHaveBeenCalledWith({
            empilhadeiraId: MAQUINA, operadorId: OPERADOR, filialId: FILIAL, dataIncidente: esperada,
            status: 'pendente', origem: 'funcionario', descricao: 'Pneu furado',
        });
        expect(aplicarStatus).toHaveBeenCalledWith(MAQUINA, 'alerta');
        expect(incidente).toEqual({
            _id: INCIDENTE, machineId: MAQUINA, maquina: MAQUINA_FORMATADA, operador: { nome: 'Carlos Silva' },
            dataIncidente: esperada.toISOString(), forcaImpacto: null, status: 'pendente', origem: 'funcionario', descricao: 'Pneu furado',
        });
    });

    test('sem horario: agora; sem descricao: null', async () => {
        await reportar(usuario, {});
        expect(Incident.create).toHaveBeenCalledWith(expect.objectContaining({ dataIncidente: AGORA, descricao: null }));
    });

    test('sem sessão aberta: 409 sem criar', async () => {
        vi.mocked(WorkSession.findOne).mockReturnValue(lean(null));
        expect(await erro(reportar(usuario, {}))).toBe(409);
        expect(Incident.create).not.toHaveBeenCalled();
        expect(aplicarStatus).not.toHaveBeenCalled();
    });

    test('sem operador: 403', async () => {
        expect(await erro(reportar({ ...usuario, operadorId: null }, {}))).toBe(403);
        expect(WorkSession.findOne).not.toHaveBeenCalled();
    });
});

describe('listar', () => {
    const sort = vi.fn();
    const SENSOR = { _id: INCIDENTE, empilhadeiraId: MAQUINA, operadorId: null, dataIncidente: AGORA, forcaImpacto: 7, status: 'pendente' };
    beforeEach(() => {
        sort.mockReturnValue(lean([SENSOR]));
        vi.mocked(Incident.find).mockReturnValue({ sort } as any);
    });

    test('incidentes das filiais do escopo, mais recente primeiro; incidente antigo vale origem sensor e operador null', async () => {
        expect(await listar(escopo, {})).toEqual([{
            _id: INCIDENTE, machineId: MAQUINA, maquina: MAQUINA_FORMATADA, operador: null,
            dataIncidente: AGORA.toISOString(), forcaImpacto: 7, status: 'pendente', origem: 'sensor', descricao: null,
        }]);
        expect(Incident.find).toHaveBeenCalledWith({ filialId: { $in: [FILIAL] } });
        expect(sort).toHaveBeenCalledWith({ dataIncidente: -1 });
    });

    test('filtra por máquina e por dia inclusivo', async () => {
        await listar(escopo, { machineId: MAQUINA, from: '2026-10-01', to: '2026-10-15' });
        expect(Incident.find).toHaveBeenCalledWith({
            filialId: { $in: [FILIAL] },
            empilhadeiraId: MAQUINA,
            dataIncidente: { $gte: new Date('2026-10-01T00:00:00'), $lt: new Date('2026-10-16T00:00:00') },
        });
    });

    test('from > to: []', async () => {
        expect(await listar(escopo, { from: '2026-10-15', to: '2026-10-14' })).toEqual([]);
        expect(Incident.find).not.toHaveBeenCalled();
    });

    test('machineId inválido: 400', async () => {
        expect(await erro(listar(escopo, { machineId: 'x' }))).toBe(400);
    });
});
