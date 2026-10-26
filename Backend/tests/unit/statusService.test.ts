import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Types } from 'mongoose';
import { Forklift } from '../../src/schemas/forklift.js';
import { Incident } from '../../src/schemas/incident.js';
import { Category } from '../../src/schemas/category.js';
import { Branch } from '../../src/schemas/branch.js';
import { aplicarStatus, ehStatus, limiteImpacto, registrarImpacto } from '../../src/feature/machine/statusService.js';

vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { findById: vi.fn(), findOne: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: { updateMany: vi.fn(), create: vi.fn() } }));
vi.mock('../../src/schemas/category.js', () => ({ Category: { findOne: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { findById: vi.fn() } }));

const lean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) }) as any;

const AGORA = new Date('2026-10-15T12:00:00Z');
const ID = new Types.ObjectId().toHexString();
const FILIAL = new Types.ObjectId();
const EMPRESA = new Types.ObjectId();
const CATEGORIA_ALERTA = new Types.ObjectId();
const CATEGORIA_ATUAL = new Types.ObjectId();

function mockar(empilhadeira: Record<string, unknown> | null, categoria: unknown = { _id: CATEGORIA_ALERTA }) {
    vi.mocked(Forklift.findById).mockReturnValue(lean(empilhadeira && { _id: ID, filialId: FILIAL, ...empilhadeira }));
    vi.mocked(Branch.findById).mockReturnValue(lean({ _id: FILIAL, empresaId: EMPRESA }));
    vi.mocked(Category.findOne).mockReturnValue(lean(categoria));
}

const gravado = () => vi.mocked(Forklift.updateOne).mock.calls[0]?.[1] as any;

describe('aplicarStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(AGORA);
    });
    afterEach(() => vi.useRealTimers());

    test('status igual ao atual não grava nada', async () => {
        mockar({ status: 'em_uso', categoriaId: CATEGORIA_ATUAL });
        await aplicarStatus(ID, 'em_uso');
        expect(Forklift.updateOne).not.toHaveBeenCalled();
        expect(Incident.updateMany).not.toHaveBeenCalled();
    });

    test('status null conta como disponivel', async () => {
        mockar({ status: null });
        await aplicarStatus(ID, 'disponivel');
        expect(Forklift.updateOne).not.toHaveBeenCalled();
    });

    test('status novo grava status e statusAlteradoEm', async () => {
        mockar({ status: 'disponivel' }, null);
        await aplicarStatus(ID, 'manutencao');
        expect(vi.mocked(Forklift.updateOne).mock.calls[0]![0]).toEqual({ _id: ID });
        expect(gravado()).toEqual({ $set: { status: 'manutencao', statusAlteradoEm: AGORA } });
    });

    test('destravada: vai para a categoria da empresa ligada ao novo status', async () => {
        mockar({ status: 'disponivel', categoriaId: CATEGORIA_ATUAL, categoriaTravada: false });
        await aplicarStatus(ID, 'alerta');
        expect(Category.findOne).toHaveBeenCalledWith({ empresaId: EMPRESA, statusVinculados: 'alerta' });
        expect(gravado().$set.categoriaId).toBe(CATEGORIA_ALERTA);
    });

    test('destravada sem categoria ligada: mantém a categoria', async () => {
        mockar({ status: 'disponivel', categoriaId: CATEGORIA_ATUAL }, null);
        await aplicarStatus(ID, 'offline');
        expect(gravado().$set).not.toHaveProperty('categoriaId');
    });

    test('travada: mantém a categoria mesmo com categoria ligada', async () => {
        mockar({ status: 'disponivel', categoriaId: CATEGORIA_ATUAL, categoriaTravada: true });
        await aplicarStatus(ID, 'alerta');
        expect(gravado().$set).not.toHaveProperty('categoriaId');
        expect(gravado().$set.status).toBe('alerta');
    });

    test('sair de alerta resolve os incidentes pendentes da máquina', async () => {
        mockar({ status: 'alerta' }, null);
        await aplicarStatus(ID, 'disponivel');
        expect(Incident.updateMany).toHaveBeenCalledWith(
            { empilhadeiraId: ID, status: 'pendente' },
            { $set: { status: 'resolvido' } }
        );
    });

    test('entrar em alerta não resolve incidentes', async () => {
        mockar({ status: 'manutencao' }, null);
        await aplicarStatus(ID, 'alerta');
        expect(Incident.updateMany).not.toHaveBeenCalled();
    });

    test('máquina inexistente: 404', async () => {
        mockar(null);
        await expect(aplicarStatus(ID, 'alerta')).rejects.toMatchObject({ status: 404 });
    });
});

describe('ehStatus', () => {
    test.each(['disponivel', 'em_uso', 'manutencao', 'alerta', 'offline'])('%s é status', (s) => {
        expect(ehStatus(s)).toBe(true);
    });
    test.each(['Disponível', 'acidente', '', null, 1])('%s não é status', (s) => {
        expect(ehStatus(s)).toBe(false);
    });
});

describe('limiteImpacto', () => {
    afterEach(() => vi.unstubAllEnvs());

    test('usa LIMITE_IMPACTO do ambiente', () => {
        vi.stubEnv('LIMITE_IMPACTO', '8.5');
        expect(limiteImpacto()).toBe(8.5);
    });

    test.each([undefined, '', 'abc'])('cai em 5 com %s', (valor) => {
        if (valor === undefined) delete process.env.LIMITE_IMPACTO;
        else vi.stubEnv('LIMITE_IMPACTO', valor);
        expect(limiteImpacto()).toBe(5);
    });
});

describe('registrarImpacto', () => {
    const DISPOSITIVO = new Types.ObjectId().toHexString();
    const OPERADOR = new Types.ObjectId();
    const DATA = new Date('2026-10-15T09:30:00Z');
    const empilhadeira = (status: string) => ({
        _id: new Types.ObjectId(ID), filialId: FILIAL, operadorConectadoId: OPERADOR, status,
    });

    beforeEach(() => vi.clearAllMocks());

    test('cria incidente pendente com máquina, operador, filial, força e data da leitura', async () => {
        vi.mocked(Forklift.findOne).mockReturnValue(lean(empilhadeira('disponivel')));
        mockar({ status: 'disponivel' });

        await registrarImpacto(DISPOSITIVO, 7, DATA);

        expect(Forklift.findOne).toHaveBeenCalledWith({ dispositivoConectadoId: DISPOSITIVO });
        expect(Incident.create).toHaveBeenCalledWith({
            empilhadeiraId: new Types.ObjectId(ID),
            operadorId: OPERADOR,
            filialId: FILIAL,
            forcaImpacto: 7,
            dataIncidente: DATA,
            status: 'pendente',
            origem: 'sensor',
        });
    });

    test.each(['disponivel', 'manutencao', 'offline', 'em_uso'])('de %s vai para alerta', async (status) => {
        vi.mocked(Forklift.findOne).mockReturnValue(lean(empilhadeira(status)));
        mockar({ status });

        await registrarImpacto(DISPOSITIVO, 9, DATA);

        expect(gravado().$set.status).toBe('alerta');
    });

    test('dispositivo sem empilhadeira: não cria incidente nem muda status', async () => {
        vi.mocked(Forklift.findOne).mockReturnValue(lean(null));

        await registrarImpacto(DISPOSITIVO, 9, DATA);

        expect(Incident.create).not.toHaveBeenCalled();
        expect(Forklift.updateOne).not.toHaveBeenCalled();
    });

    test('segundo impacto cria outro incidente e mantém alerta sem regravar', async () => {
        vi.mocked(Forklift.findOne).mockReturnValue(lean(empilhadeira('alerta')));
        mockar({ status: 'alerta' });

        await registrarImpacto(DISPOSITIVO, 6, DATA);

        expect(Incident.create).toHaveBeenCalledTimes(1);
        expect(Forklift.updateOne).not.toHaveBeenCalled();
    });
});
