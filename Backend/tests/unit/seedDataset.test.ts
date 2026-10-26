import { describe, test, expect } from 'vitest';
import {
    ADMIN,
    COLABORADORES,
    DISPOSITIVOS,
    EMPILHADEIRAS,
    EMPRESA_NOME,
    FICHAS,
    FILIAIS_DOS_COLABORADORES,
    FILIAIS_EXTRAS,
    MATRIZ_NOME,
    OPERADORES,
    SENHA_PADRAO,
    SOLICITACOES,
    filialDaEmpilhadeira,
    filialDoDispositivo,
    filialDoOperador,
    gerarIncidentes,
    gerarTelemetria,
} from '../../src/scripts/seedDataset.js';

describe('seedDataset: empresa e filiais', () => {
    test('empresa Liftech Logística, matriz Matriz e filiais Unidade Centro e Unidade Norte', () => {
        expect(EMPRESA_NOME).toBe('Liftech Logística');
        expect(MATRIZ_NOME).toBe('Matriz');
        expect(FILIAIS_EXTRAS).toEqual(['Unidade Centro', 'Unidade Norte']);
    });

    test.each([
        ['EMP-081', 'Matriz'],
        ['EMP-083', 'Unidade Centro'],
        ['EMP-085', 'Unidade Norte'],
    ])('a empilhadeira %s cai na filial do seu setor: %s', (identificacao, filial) => {
        const e = EMPILHADEIRAS.find((x) => x.identificacao === identificacao)!;

        expect(filialDaEmpilhadeira(e)).toBe(filial);
    });

    test('o dispositivo herda a filial da sua empilhadeira, para os 16', () => {
        for (const e of EMPILHADEIRAS) expect(filialDoDispositivo(e.enderecoMac)).toBe(filialDaEmpilhadeira(e));
    });

    test('o operador herda a filial da primeira empilhadeira que o cita; sem empilhadeira, a matriz', () => {
        expect(filialDoOperador('Carlos Silva')).toBe('Matriz');
        expect(filialDoOperador('Marina Costa')).toBe('Unidade Centro');
        expect(filialDoOperador('João Pereira')).toBe('Unidade Norte');
        expect(filialDoOperador('Alexandre Gomes')).toBe('Matriz');
    });

    test('os 3 setores do mock estão distribuídos pelas 3 filiais', () => {
        expect(new Set(EMPILHADEIRAS.map(filialDaEmpilhadeira))).toEqual(new Set(['Matriz', ...FILIAIS_EXTRAS]));
    });

    test('os 11 colaboradores têm filiais existentes e ao menos um tem duas', () => {
        const nomes = new Set(['Matriz', ...FILIAIS_EXTRAS]);

        expect(Object.keys(FILIAIS_DOS_COLABORADORES).sort()).toEqual(COLABORADORES.map((c) => c.usuario).sort());
        for (const filiais of Object.values(FILIAIS_DOS_COLABORADORES)) {
            expect(filiais.length).toBeGreaterThanOrEqual(1);
            expect(filiais.length).toBeLessThanOrEqual(2);
            for (const f of filiais) expect(nomes.has(f)).toBe(true);
        }
        expect(Object.values(FILIAIS_DOS_COLABORADORES).some((f) => f.length === 2)).toBe(true);
    });
});

describe('seedDataset: cadastros', () => {
    test('12 operadores com nomes e matrículas únicos, cada um com a ficha da Equipe', () => {
        expect(OPERADORES).toHaveLength(12);
        expect(new Set(OPERADORES).size).toBe(12);
        expect(new Set(FICHAS.map((f) => f.matricula)).size).toBe(12);
        for (const f of FICHAS) {
            expect(f.matricula).toMatch(/^EMP-\d{3}$/);
            expect(f.horarioEntrada).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
            expect(f.horarioSaida).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
            expect(f.telefone && f.cargo).toBeTruthy();
        }
    });

    test('a ordem dos 8 primeiros operadores não muda (alimenta o operador de reserva dos incidentes)', () => {
        expect(OPERADORES.slice(0, 8)).toEqual([
            'Carlos Silva', 'Ana Souza', 'João Pereira', 'Marina Costa', 'Rafael Lima', 'Beatriz Alves', 'Fernanda Dias', 'Alexandre Gomes',
        ]);
    });

    test('o operador sem empilhadeira fica na primeira filial do seu login', () => {
        expect(filialDoOperador('Diego Martins')).toBe('Unidade Norte');
        expect(filialDoOperador('Paulo Nunes')).toBe('Unidade Centro');
    });

    test('cada dispositivo tem nome Mpa-<n> único', () => {
        expect(DISPOSITIVOS[0]!.nome).toBe('Mpa-5300');
        expect(new Set(DISPOSITIVOS.map((d) => d.nome)).size).toBe(16);
    });

    test('16 dispositivos com MAC único', () => {
        expect(DISPOSITIVOS).toHaveLength(16);
        expect(new Set(DISPOSITIVOS.map((d) => d.enderecoMac)).size).toBe(16);
    });

    test('16 empilhadeiras, de EMP-081 a EMP-096, sem repetir identificação', () => {
        const ids = EMPILHADEIRAS.map((e) => e.identificacao);
        expect(ids).toEqual(Array.from({ length: 16 }, (_, i) => `EMP-${String(81 + i).padStart(3, '0')}`));
    });

    test('todo MAC e todo operador citado por uma empilhadeira existe nas listas', () => {
        const macs = new Set(DISPOSITIVOS.map((d) => d.enderecoMac));
        for (const e of EMPILHADEIRAS) {
            expect(macs.has(e.enderecoMac)).toBe(true);
            if (e.operador) expect(OPERADORES).toContain(e.operador);
        }
    });

    test('o dispositivo guarda só a conectividade: offline se a empilhadeira é offline, online nas demais', () => {
        for (const e of EMPILHADEIRAS) {
            expect(DISPOSITIVOS.find((d) => d.enderecoMac === e.enderecoMac)?.status).toBe(e.status === 'offline' ? 'offline' : 'online');
        }
    });

    test('EMP-081, EMP-085 e EMP-089 são as únicas em alerta', () => {
        expect(EMPILHADEIRAS.filter((e) => e.status === 'alerta').map((e) => e.identificacao)).toEqual(['EMP-081', 'EMP-085', 'EMP-089']);
    });

    test('12 colaboradores com usuário único, sem campo de senha, cada um com um operador', () => {
        expect(COLABORADORES).toHaveLength(12);
        expect(new Set(COLABORADORES.map((c) => c.usuario)).size).toBe(12);
        for (const c of COLABORADORES) {
            expect(c).not.toHaveProperty('senha');
            expect(OPERADORES).toContain(c.nome);
        }
    });

    test('colaborador@colaborador.com é o login fixo, com acesso, ligado a Alexandre Gomes na matriz', () => {
        const fixo = COLABORADORES.find((c) => c.usuario === 'colaborador@colaborador.com')!;
        expect(fixo.nome).toBe('Alexandre Gomes');
        expect(fixo).not.toHaveProperty('acessoNegado');
        expect(FILIAIS_DOS_COLABORADORES['colaborador@colaborador.com']).toEqual([MATRIZ_NOME]);
    });

    test('acesso negado só para quem está Negado na Equipe do Figma', () => {
        const negados = COLABORADORES.filter((c) => c.acessoNegado).map((c) => c.usuario);
        expect(negados).toEqual(['RafaelLima', 'BeatrizAlves', 'FernandaDias', 'PauloNunes', 'LarissaRocha', 'DiegoMartins']);
    });

    test('credenciais fixas: admin@admin.com e senha asdasdasd', () => {
        expect(ADMIN.email).toBe('admin@admin.com');
        expect(SENHA_PADRAO).toBe('asdasdasd');
    });

    test('2 solicitações de acesso pendentes com email único', () => {
        expect(SOLICITACOES).toHaveLength(2);
        expect(new Set(SOLICITACOES.map((s) => s.email)).size).toBe(2);
        for (const s of SOLICITACOES) expect(s.status).toBe('pendente');
    });
});

describe('seedDataset: telemetria', () => {
    test('5 leituras por dispositivo, de hora em hora a partir de 2026-09-01T08:00:00Z', () => {
        const leituras = gerarTelemetria('d1');

        expect(leituras.map((l) => l.dataDados.toISOString())).toEqual([
            '2026-09-01T08:00:00.000Z',
            '2026-09-01T09:00:00.000Z',
            '2026-09-01T10:00:00.000Z',
            '2026-09-01T11:00:00.000Z',
            '2026-09-01T12:00:00.000Z',
        ]);
        for (const l of leituras) expect(l.dispositivoId).toBe('d1');
    });

    test('duas chamadas geram as mesmas datas (chave estável para o upsert)', () => {
        expect(gerarTelemetria('d1')).toEqual(gerarTelemetria('d1'));
    });
});

describe('seedDataset: incidentes', () => {
    test('2 incidentes por empilhadeira, ligados à empilhadeira e ao operador', () => {
        const incidentes = gerarIncidentes('f1', 'o1', 0);

        expect(incidentes).toHaveLength(2);
        for (const i of incidentes) {
            expect(i.empilhadeiraId).toBe('f1');
            expect(i.operadorId).toBe('o1');
        }
    });

    test('em alerta: 1 pendente e 1 resolvido; fora de alerta: 2 resolvidos', () => {
        expect(gerarIncidentes('f', 'o', 0, true).map((i) => i.status)).toEqual(['pendente', 'resolvido']);
        expect(gerarIncidentes('f', 'o', 0, false).map((i) => i.status)).toEqual(['resolvido', 'resolvido']);
        expect(gerarIncidentes('f', 'o', 1).map((i) => i.status)).toEqual(['resolvido', 'resolvido']);
    });

    test('forcaImpacto de 3 a 9 e status pendente ou resolvido, em todas as empilhadeiras', () => {
        const todos = EMPILHADEIRAS.flatMap((_, i) => gerarIncidentes('f', 'o', i));

        expect(todos).toHaveLength(32);
        for (const i of todos) {
            expect(i.forcaImpacto).toBeGreaterThanOrEqual(3);
            expect(i.forcaImpacto).toBeLessThanOrEqual(9);
            expect(['pendente', 'resolvido']).toContain(i.status);
        }
    });

    test('nenhum incidente fica depois de 2026-10-13 (a data em que o seed foi escrito)', () => {
        const ultimo = Math.max(
            ...EMPILHADEIRAS.flatMap((_, i) => gerarIncidentes('f', 'o', i).map((x) => x.dataIncidente.getTime()))
        );

        expect(new Date(ultimo).toISOString()).toBe('2026-10-02T10:00:00.000Z');
        expect(ultimo).toBeLessThanOrEqual(Date.UTC(2026, 9, 13));
    });

    test('datas fixas e distintas por empilhadeira: a mesma chamada repete, índices diferentes não colidem', () => {
        expect(gerarIncidentes('f1', 'o1', 3)).toEqual(gerarIncidentes('f1', 'o1', 3));

        const datas = EMPILHADEIRAS.flatMap((_, i) => gerarIncidentes('f', 'o', i).map((x) => x.dataIncidente.toISOString()));
        expect(new Set(datas).size).toBe(32);
    });
});
