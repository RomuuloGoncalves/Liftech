import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { listarMaquinas } from '../../src/feature/machine/machineService.js';
import { Types } from 'mongoose';
import { Forklift } from '../../src/schemas/forklift.js';

vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { find: vi.fn() } }));
vi.mock('../../src/schemas/device.js', () => ({ Device: {} }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: {} }));

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
const base = {
    _id: ID,
    identificacao: 'EMP-081',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
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

        const [item] = await listarMaquinas();

        expect(item).toEqual({
            id: ID.toHexString(),
            identificacao: 'EMP-081',
            nome: 'Empilhadeira Elétrica Titan-X',
            setor: 'Expedição - Bloco B',
            dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F7', status: 'Disponível' },
            operadorConectado: { nome: 'Carlos Silva' },
            tempoSessaoMinutos: 34,
        });
    });

    test('ordena por identificacao crescente e popula dispositivo e operador', async () => {
        const { sort, populateDispositivo, populateOperador } = mockarLista([base]);

        await listarMaquinas();

        expect(sort).toHaveBeenCalledWith({ identificacao: 1 });
        expect(populateDispositivo).toHaveBeenCalledWith('dispositivoConectadoId');
        expect(populateOperador).toHaveBeenCalledWith('operadorConectadoId');
    });

    test('sem operador ligado: o item não tem a propriedade operadorConectado', async () => {
        mockarLista([{ ...base, operadorConectadoId: undefined }]);

        const [item] = await listarMaquinas();

        expect(item).not.toHaveProperty('operadorConectado');
    });

    test('operador apagado (populate devolve null): o item não tem operadorConectado', async () => {
        mockarLista([{ ...base, operadorConectadoId: null }]);

        const [item] = await listarMaquinas();

        expect(item).not.toHaveProperty('operadorConectado');
    });

    test('tempoSessaoMinutos é o número inteiro de minutos desde sessaoIniciadaEm', async () => {
        mockarLista([{ ...base, sessaoIniciadaEm: new Date(AGORA.getTime() - (47 * 60_000 + 59_000)) }]);

        const [item] = await listarMaquinas();

        expect(item!.tempoSessaoMinutos).toBe(47);
    });

    test('sem sessaoIniciadaEm: tempoSessaoMinutos é 0', async () => {
        mockarLista([{ ...base, sessaoIniciadaEm: undefined }]);

        const [item] = await listarMaquinas();

        expect(item!.tempoSessaoMinutos).toBe(0);
    });

    test('sessaoIniciadaEm no futuro: tempoSessaoMinutos é 0, nunca negativo', async () => {
        mockarLista([{ ...base, sessaoIniciadaEm: new Date(AGORA.getTime() + 10 * 60_000) }]);

        const [item] = await listarMaquinas();

        expect(item!.tempoSessaoMinutos).toBe(0);
    });

    test.each([
        ['sem dispositivo ligado', undefined],
        ['dispositivo apagado (populate devolve null)', null],
    ])('%s: dispositivoConectado é { enderecoMac: "", status: "Offline" }', async (_nome, valor) => {
        mockarLista([{ ...base, dispositivoConectadoId: valor }]);

        const [item] = await listarMaquinas();

        expect(item!.dispositivoConectado).toEqual({ enderecoMac: '', status: 'Offline' });
    });

    test('a consulta falha: o erro do banco se propaga', async () => {
        vi.mocked(Forklift.find).mockImplementation(() => {
            throw new Error('falha de conexão');
        });

        await expect(listarMaquinas()).rejects.toThrow('falha de conexão');
    });
});
