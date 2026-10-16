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
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';
import { logger } from '../../src/utils/logger.js';
import { verificarSenha } from '../../src/utils/senha.js';
import { gerarIncidentes } from '../../src/scripts/seedDataset.js';
import { criarQuadroInicial, posicionarSemCategoria } from '../../src/feature/category/categoryService.js';

vi.mock('../../src/schemas/operator.js', () => ({ Operator: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/device.js', () => ({ Device: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/telemetry.js', () => ({ Telemetry: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/user.js', () => ({ User: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/accessRequest.js', () => ({ AccessRequest: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/company.js', () => ({ Company: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/feature/category/categoryService.js', () => ({ criarQuadroInicial: vi.fn(), posicionarSemCategoria: vi.fn() }));
vi.mock('../../src/scripts/seedAdmin.js', () => ({ seedAdmin: vi.fn() }));
vi.mock('../../src/config/conn.js', () => ({ conn: { mongoose: { disconnect: vi.fn() } } }));
vi.mock('../../src/utils/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

const AGORA = new Date('2026-10-13T12:00:00Z');
const SENHA = 'asdasdasd';
const envOriginal = { ...process.env };

const MODELOS = { Company, Branch, Operator, Device, Forklift, Telemetry, Incident, User, AccessRequest } as const;

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
const EMPRESA_ID = idDe('Company', { nome: 'Liftech Logística' });
const filialId = (nome: string) => idDe('Branch', { empresaId: EMPRESA_ID, nome });

describe('seedData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(AGORA);
        mockarModelos();
    });

    afterEach(() => {
        vi.useRealTimers();
        process.env = { ...envOriginal };
    });

    test('chama o seedAdmin existente, uma vez, com o id da empresa', async () => {
        await seedData();

        expect(seedAdmin).toHaveBeenCalledTimes(1);
        expect(seedAdmin).toHaveBeenCalledWith(EMPRESA_ID);
    });

    test('cria 1 empresa e 3 filiais pela chave natural, só a matriz com matriz: true', async () => {
        await seedData();

        expect(chamadas(Company)).toHaveLength(1);
        expect(chamadas(Company)[0]![0]).toEqual({ nome: 'Liftech Logística' });
        expect(chamadas(Branch).map((c) => [c[0], c[1].$set.matriz, c[2].upsert])).toEqual([
            [{ empresaId: EMPRESA_ID, nome: 'Matriz' }, true, true],
            [{ empresaId: EMPRESA_ID, nome: 'Unidade Centro' }, false, true],
            [{ empresaId: EMPRESA_ID, nome: 'Unidade Norte' }, false, true],
        ]);
    });

    test.each([
        ['EMP-081', 'Matriz'],
        ['EMP-083', 'Unidade Centro'],
        ['EMP-085', 'Unidade Norte'],
    ])('a empilhadeira %s leva o filialId da filial do seu setor (%s)', async (identificacao, filial) => {
        await seedData();

        expect(chamadaDe(Forklift, { identificacao })[1].$set.filialId).toBe(filialId(filial));
    });

    test('o dispositivo leva o filialId da filial da sua empilhadeira', async () => {
        await seedData();

        expect(chamadaDe(Device, { enderecoMac: 'A2:C9:9B:1D:F7' })[1].$set.filialId).toBe(filialId('Matriz'));
        expect(chamadaDe(Device, { enderecoMac: 'A2:C9:9B:1D:F9' })[1].$set.filialId).toBe(filialId('Unidade Centro'));
        expect(chamadaDe(Device, { enderecoMac: 'A2:C9:9B:1D:FB' })[1].$set.filialId).toBe(filialId('Unidade Norte'));
    });

    test('o operador leva o filialId da primeira empilhadeira que o cita, ou da matriz', async () => {
        await seedData();

        expect(chamadaDe(Operator, { nome: 'Carlos Silva' })[1].$set.filialId).toBe(filialId('Matriz'));
        expect(chamadaDe(Operator, { nome: 'Marina Costa' })[1].$set.filialId).toBe(filialId('Unidade Centro'));
        expect(chamadaDe(Operator, { nome: 'João Pereira' })[1].$set.filialId).toBe(filialId('Unidade Norte'));
        expect(chamadaDe(Operator, { nome: 'Alexandre Gomes' })[1].$set.filialId).toBe(filialId('Matriz'));
    });

    test('o incidente leva o filialId da filial da sua empilhadeira', async () => {
        await seedData();

        const data = (indice: number) => gerarIncidentes('x', 'y', indice)[0]!.dataIncidente;
        const filialDoIncidente = (identificacao: string, indice: number) =>
            chamadaDe(Incident, { empilhadeiraId: idDe('Forklift', { identificacao }), dataIncidente: data(indice) })[1].$set.filialId;

        expect(filialDoIncidente('EMP-081', 0)).toBe(filialId('Matriz'));
        expect(filialDoIncidente('EMP-083', 2)).toBe(filialId('Unidade Centro'));
        expect(filialDoIncidente('EMP-085', 4)).toBe(filialId('Unidade Norte'));
    });

    test('o colaborador leva empresaId, escopo filiais e as filiaisIds da tabela; PauloNunes tem duas', async () => {
        await seedData();

        const carlos = chamadaDe(User, { usuario: 'CarlosSilva' })[1].$set;
        const paulo = chamadaDe(User, { usuario: 'PauloNunes' })[1].$set;

        expect(carlos).toMatchObject({ empresaId: EMPRESA_ID, escopo: 'filiais', filiaisIds: [filialId('Matriz')] });
        expect(paulo.filiaisIds).toEqual([filialId('Unidade Centro'), filialId('Unidade Norte')]);
    });

    test('todo colaborador ganha o operadorId do operator de mesmo nome', async () => {
        await seedData();

        expect(chamadaDe(User, { usuario: 'CarlosSilva' })[1].$set.operadorId).toBe(idDe('Operator', { nome: 'Carlos Silva' }));
        expect(chamadaDe(User, { usuario: 'AlexandreMattos' })[1].$set.operadorId).toBe(idDe('Operator', { nome: 'Alexandre Mattos' }));
        for (const [, atualizacao] of chamadas(User)) expect(atualizacao.$set.operadorId).toBeDefined();
    });

    test('colaborador@colaborador.com: login fixo com acesso, ligado a Alexandre Gomes, na matriz, com a senha asdasdasd', async () => {
        await seedData();

        const dados = chamadaDe(User, { usuario: 'colaborador@colaborador.com' })[1].$set;
        expect(dados).toMatchObject({
            nome: 'Alexandre Gomes', role: 'colaborador', acessoNegado: false,
            operadorId: idDe('Operator', { nome: 'Alexandre Gomes' }), filiaisIds: [filialId('Matriz')],
        });
        expect(verificarSenha('asdasdasd', dados.senhaHash)).toBe(true);
    });

    test('grava acessoNegado true só para quem está Negado na Equipe', async () => {
        await seedData();

        expect(chamadaDe(User, { usuario: 'RafaelLima' })[1].$set.acessoNegado).toBe(true);
        expect(chamadaDe(User, { usuario: 'DiegoMartins' })[1].$set.acessoNegado).toBe(true);
        expect(chamadaDe(User, { usuario: 'CarlosSilva' })[1].$set.acessoNegado).toBe(false);
    });

    test('o operador leva a ficha da Equipe: matrícula, telefone, cargo e turno', async () => {
        await seedData();

        expect(chamadaDe(Operator, { nome: 'Carlos Silva' })[1].$set).toMatchObject({
            nome: 'Carlos Silva', matricula: 'EMP-085', telefone: '(55) 15 988887777', cargo: 'Operador',
            horarioEntrada: '07:00', horarioSaida: '16:00',
        });
    });

    test('o dispositivo leva o nome Mpa-<n>', async () => {
        await seedData();

        expect(chamadaDe(Device, { enderecoMac: 'A2:C9:9B:1D:F7' })[1].$set.nome).toBe('Mpa-5300');
    });

    test('cria 12 operadores, 16 dispositivos, 16 empilhadeiras, 80 leituras, 32 incidentes, 12 colaboradores e 2 solicitações', async () => {
        const contagem = await seedData();

        expect(contagem).toEqual({
            empresas: 1,
            filiais: 3,
            operadores: 12,
            dispositivos: 16,
            empilhadeiras: 16,
            telemetria: 80,
            incidentes: 32,
            colaboradores: 12,
            solicitacoes: 2,
        });
        expect(chamadas(Operator)).toHaveLength(12);
        expect(chamadas(Device)).toHaveLength(16);
        expect(chamadas(Forklift)).toHaveLength(16);
        expect(chamadas(Telemetry)).toHaveLength(80);
        expect(chamadas(Incident)).toHaveLength(32);
        expect(chamadas(User)).toHaveLength(12);
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

    test('sessaoIniciadaEm só nas em_uso: agora menos os minutos do mock', async () => {
        await seedData();

        const emUso = chamadaDe(Forklift, { identificacao: 'EMP-082' })[1].$set;
        const disponivelCom34 = chamadaDe(Forklift, { identificacao: 'EMP-083' })[1].$set;
        const alertaCom34 = chamadaDe(Forklift, { identificacao: 'EMP-081' })[1].$set;

        expect(emUso.sessaoIniciadaEm).toEqual(new Date(AGORA.getTime() - 12 * 60_000));
        expect(disponivelCom34).not.toHaveProperty('sessaoIniciadaEm');
        expect(alertaCom34).not.toHaveProperty('sessaoIniciadaEm');
    });

    test('grava o status do dataset na empilhadeira', async () => {
        await seedData();

        expect(chamadaDe(Forklift, { identificacao: 'EMP-081' })[1].$set.status).toBe('alerta');
        expect(chamadaDe(Forklift, { identificacao: 'EMP-084' })[1].$set.status).toBe('manutencao');
        expect(chamadaDe(Forklift, { identificacao: 'EMP-086' })[1].$set.status).toBe('offline');
    });

    test('só as 3 máquinas em alerta têm incidente pendente', async () => {
        await seedData();

        const pendentes = chamadas(Incident).filter((c) => c[1].$set.status === 'pendente').map((c) => c[0].empilhadeiraId);
        expect(pendentes).toEqual(['EMP-081', 'EMP-085', 'EMP-089'].map((identificacao) => idDe('Forklift', { identificacao })));
    });

    test('cria o quadro inicial da empresa e posiciona as máquinas das 3 filiais', async () => {
        const quadro = new Map([['alerta', 'c1']]);
        vi.mocked(criarQuadroInicial).mockResolvedValue(quadro as any);

        await seedData();

        expect(criarQuadroInicial).toHaveBeenCalledWith(EMPRESA_ID);
        expect(posicionarSemCategoria).toHaveBeenCalledWith(
            ['Matriz', 'Unidade Centro', 'Unidade Norte'].map(filialId),
            quadro
        );
    });

    test('empresa que já tinha quadro: não reposiciona', async () => {
        vi.mocked(criarQuadroInicial).mockResolvedValue(null);

        await seedData();

        expect(posicionarSemCategoria).not.toHaveBeenCalled();
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

    test('colaboradores com role e senhaHash que valida asdasdasd, sem a senha em texto', async () => {
        await seedData();

        const [, atualizacao] = chamadaDe(User, { usuario: 'CarlosSilva' });
        const dados = atualizacao.$set;

        expect(dados).toMatchObject({ nome: 'Carlos Silva', usuario: 'CarlosSilva', role: 'colaborador' });
        expect(verificarSenha(SENHA, dados.senhaHash)).toBe(true);
        expect(JSON.stringify(dados)).not.toContain(SENHA);
    });

    test('os 12 colaboradores têm senhaHash que valida asdasdasd', async () => {
        await seedData();

        const hashes = chamadas(User).map((c) => c[1].$set.senhaHash as string);

        expect(hashes).toHaveLength(12);
        for (const hash of hashes) expect(verificarSenha(SENHA, hash)).toBe(true);
    });

    test('rodar duas vezes usa exatamente as mesmas chaves, sem repetir nenhuma dentro de uma execução', async () => {
        const chaves = () =>
            Object.fromEntries(
                Object.entries(MODELOS).map(([nome, m]) => [nome, chamadas(m).map((c) => JSON.stringify(c[0]))])
            );

        await seedData();
        const primeira = chaves();
        vi.clearAllMocks();
        mockarModelos();
        await seedData();
        const segunda = chaves();

        expect(segunda).toEqual(primeira);
        for (const [nome, lista] of Object.entries(primeira)) {
            expect(new Set(lista).size, `chaves repetidas em ${nome}`).toBe(lista.length);
        }
    });

    test('sem SEED_COLABORADOR_SENHA: cria os 12 colaboradores mesmo assim, com a senha fixa', async () => {
        delete process.env.SEED_COLABORADOR_SENHA;

        const contagem = await seedData();

        expect(chamadas(User)).toHaveLength(12);
        expect(contagem.colaboradores).toBe(12);
        expect(logger.warn).not.toHaveBeenCalled();
    });

    test('registra a quantidade de documentos por collection', async () => {
        await seedData();

        const mensagem = vi.mocked(logger.info).mock.calls.map((c) => String(c[0])).join('\n');
        for (const trecho of ['1 empresa', '3 filiais', '12 operadores', '16 dispositivos', '16 empilhadeiras', '80 leituras', '32 incidentes', '12 colaboradores', '2 solicitações']) {
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
