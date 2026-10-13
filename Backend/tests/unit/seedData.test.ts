import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { seedData, seedEDesconectar } from '../../src/scripts/seedData.js';
import { seedAdmin } from '../../src/scripts/seedAdmin.js';
import { Operator } from '../../src/schemas/operator.js';
import { Device } from '../../src/schemas/device.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Telemetry } from '../../src/schemas/telemetry.js';
import { Incident } from '../../src/schemas/incident.js';
import { User } from '../../src/schemas/user.js';
import { AccessRequest } from '../../src/schemas/accessRequest.js';
import { logger } from '../../src/utils/logger.js';
import { verificarSenha } from '../../src/utils/senha.js';
import { gerarIncidentes } from '../../src/scripts/seedDataset.js';

vi.mock('../../src/schemas/operator.js', () => ({ Operator: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/device.js', () => ({ Device: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/telemetry.js', () => ({ Telemetry: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/user.js', () => ({ User: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/accessRequest.js', () => ({ AccessRequest: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/scripts/seedAdmin.js', () => ({ seedAdmin: vi.fn() }));
vi.mock('../../src/config/conn.js', () => ({ conn: { mongoose: { disconnect: vi.fn() } } }));
vi.mock('../../src/utils/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

const AGORA = new Date('2026-10-13T12:00:00Z');
const SENHA = 'senha-de-teste-1';
const envOriginal = { ...process.env };

const MODELOS = { Operator, Device, Forklift, Telemetry, Incident, User, AccessRequest } as const;

function mockarModelos() {
    for (const [nome, m] of Object.entries(MODELOS)) {
        vi.mocked(m.findOneAndUpdate).mockImplementation(((filtro: unknown) => ({
            lean: () => Promise.resolve({ _id: `${nome}:${JSON.stringify(filtro)}` }),
        })) as any);
    }
}

const chamadas = (m: { findOneAndUpdate: unknown }) => vi.mocked(m.findOneAndUpdate as any).mock.calls as any[][];
const chamadaDe = (m: { findOneAndUpdate: unknown }, filtro: object) =>
    chamadas(m).find((c) => JSON.stringify(c[0]) === JSON.stringify(filtro))!;
const idDe = (nome: string, filtro: object) => `${nome}:${JSON.stringify(filtro)}`;

describe('seedData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(AGORA);
        mockarModelos();
        process.env.SEED_COLABORADOR_SENHA = SENHA;
    });

    afterEach(() => {
        vi.useRealTimers();
        process.env = { ...envOriginal };
    });

    test('chama o seedAdmin existente', async () => {
        await seedData();

        expect(seedAdmin).toHaveBeenCalledTimes(1);
    });

    test('cria 8 operadores, 16 dispositivos, 16 empilhadeiras, 80 leituras, 32 incidentes, 11 colaboradores e 2 solicitações', async () => {
        const contagem = await seedData();

        expect(contagem).toEqual({
            operadores: 8,
            dispositivos: 16,
            empilhadeiras: 16,
            telemetria: 80,
            incidentes: 32,
            colaboradores: 11,
            solicitacoes: 2,
        });
        expect(chamadas(Operator)).toHaveLength(8);
        expect(chamadas(Device)).toHaveLength(16);
        expect(chamadas(Forklift)).toHaveLength(16);
        expect(chamadas(Telemetry)).toHaveLength(80);
        expect(chamadas(Incident)).toHaveLength(32);
        expect(chamadas(User)).toHaveLength(11);
        expect(chamadas(AccessRequest)).toHaveLength(2);
    });

    test('cada collection faz upsert pela chave natural do spec', async () => {
        await seedData();

        const dispositivoId = idDe('Device', { enderecoMac: 'A2:C9:9B:1D:F7' });
        const empilhadeiraId = idDe('Forklift', { identificacao: 'EMP-081' });
        const dataDados = new Date('2026-09-01T08:00:00Z');
        const dataIncidente = new Date('2026-08-01T10:00:00Z');

        expect(chamadaDe(Operator, { nome: 'Carlos Silva' })[2]).toMatchObject({ upsert: true });
        expect(chamadaDe(Device, { enderecoMac: 'A2:C9:9B:1D:F7' })[2]).toMatchObject({ upsert: true });
        expect(chamadaDe(Forklift, { identificacao: 'EMP-081' })[2]).toMatchObject({ upsert: true });
        expect(chamadaDe(Telemetry, { dispositivoId, dataDados })[2]).toMatchObject({ upsert: true });
        expect(chamadaDe(Incident, { empilhadeiraId, dataIncidente })[2]).toMatchObject({ upsert: true });
        expect(chamadaDe(User, { usuario: 'CarlosSilva' })[2]).toMatchObject({ upsert: true });
        expect(
            chamadaDe(AccessRequest, { email: 'ana.prado@acmelogistica.com.br', status: 'pendente' })[2]
        ).toMatchObject({ upsert: true });
    });

    test('a empilhadeira liga o dispositivo e o operador pelos ids; sem operador no mock, não há operadorConectadoId', async () => {
        await seedData();

        const comOperador = chamadaDe(Forklift, { identificacao: 'EMP-081' })[1].$set;
        const semOperador = chamadaDe(Forklift, { identificacao: 'EMP-083' })[1].$set;

        expect(comOperador).toMatchObject({
            identificacao: 'EMP-081',
            nome: 'Empilhadeira Elétrica Titan-X',
            setor: 'Expedição - Bloco B',
            dispositivoConectadoId: idDe('Device', { enderecoMac: 'A2:C9:9B:1D:F7' }),
            operadorConectadoId: idDe('Operator', { nome: 'Carlos Silva' }),
        });
        expect(semOperador).toMatchObject({ dispositivoConectadoId: idDe('Device', { enderecoMac: 'A2:C9:9B:1D:F9' }) });
        expect(semOperador).not.toHaveProperty('operadorConectadoId');
    });

    test('sessaoIniciadaEm é agora menos os minutos do mock; com 0 minutos não é definida', async () => {
        await seedData();

        const com34 = chamadaDe(Forklift, { identificacao: 'EMP-081' })[1].$set;
        const com0 = chamadaDe(Forklift, { identificacao: 'EMP-086' })[1].$set;

        expect(com34.sessaoIniciadaEm).toEqual(new Date(AGORA.getTime() - 34 * 60_000));
        expect(com0).not.toHaveProperty('sessaoIniciadaEm');
    });

    test('o incidente usa o operador da empilhadeira, ou o operador de reserva quando ela não tem', async () => {
        await seedData();

        const empilhadeiraComOperador = idDe('Forklift', { identificacao: 'EMP-081' });
        const empilhadeiraSemOperador = idDe('Forklift', { identificacao: 'EMP-083' });
        const dataDoPrimeiro = gerarIncidentes('x', 'y', 0)[0]!.dataIncidente;
        const dataDoTerceiro = gerarIncidentes('x', 'y', 2)[0]!.dataIncidente;

        expect(
            chamadaDe(Incident, { empilhadeiraId: empilhadeiraComOperador, dataIncidente: dataDoPrimeiro })[1].$set.operadorId
        ).toBe(idDe('Operator', { nome: 'Carlos Silva' }));
        expect(
            chamadaDe(Incident, { empilhadeiraId: empilhadeiraSemOperador, dataIncidente: dataDoTerceiro })[1].$set.operadorId
        ).toBe(idDe('Operator', { nome: 'João Pereira' }));
    });

    test('com SEED_COLABORADOR_SENHA: colaboradores com role e senhaHash que valida a senha, sem a senha em texto', async () => {
        await seedData();

        const [, atualizacao] = chamadaDe(User, { usuario: 'CarlosSilva' });
        const dados = atualizacao.$set;

        expect(dados).toMatchObject({ nome: 'Carlos Silva', usuario: 'CarlosSilva', role: 'colaborador' });
        expect(verificarSenha(SENHA, dados.senhaHash)).toBe(true);
        expect(JSON.stringify(dados)).not.toContain(SENHA);
    });

    test('sem SEED_COLABORADOR_SENHA: não cria colaboradores e registra um aviso', async () => {
        delete process.env.SEED_COLABORADOR_SENHA;

        const contagem = await seedData();

        expect(chamadas(User)).toHaveLength(0);
        expect(contagem.colaboradores).toBe(0);
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('SEED_COLABORADOR_SENHA'));
    });

    test('registra a quantidade de documentos por collection', async () => {
        await seedData();

        const mensagem = vi.mocked(logger.info).mock.calls.map((c) => String(c[0])).join('\n');
        for (const trecho of ['8 operadores', '16 dispositivos', '16 empilhadeiras', '80 leituras', '32 incidentes', '11 colaboradores', '2 solicitações']) {
            expect(mensagem).toContain(trecho);
        }
    });
});

describe('seedEDesconectar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockarModelos();
        delete process.env.SEED_COLABORADOR_SENHA;
    });

    test('fecha a conexão uma vez depois de um seed bem-sucedido e devolve a contagem', async () => {
        const desconectar = vi.fn().mockResolvedValue(undefined);

        const contagem = await seedEDesconectar(desconectar);

        expect(desconectar).toHaveBeenCalledTimes(1);
        expect(contagem.empilhadeiras).toBe(16);
    });

    test('fecha a conexão também quando o seed falha, e o erro continua subindo', async () => {
        vi.mocked(Operator.findOneAndUpdate).mockImplementation((() => {
            throw new Error('falha no banco');
        }) as any);
        const desconectar = vi.fn().mockResolvedValue(undefined);

        await expect(seedEDesconectar(desconectar)).rejects.toThrow('falha no banco');

        expect(desconectar).toHaveBeenCalledTimes(1);
    });
});
