import { describe, test, expect } from 'vitest';
import {
    COLABORADORES,
    DISPOSITIVOS,
    EMPILHADEIRAS,
    OPERADORES,
    SOLICITACOES,
    gerarIncidentes,
    gerarTelemetria,
} from '../../src/scripts/seedDataset.js';

describe('seedDataset: cadastros', () => {
    test('8 operadores com nomes únicos', () => {
        expect(OPERADORES).toHaveLength(8);
        expect(new Set(OPERADORES).size).toBe(8);
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

    test('cada dispositivo tem o status da sua empilhadeira', () => {
        for (const e of EMPILHADEIRAS) {
            expect(DISPOSITIVOS.find((d) => d.enderecoMac === e.enderecoMac)?.status).toBe(e.status);
        }
    });

    test('11 colaboradores com usuário único e sem campo de senha', () => {
        expect(COLABORADORES).toHaveLength(11);
        expect(new Set(COLABORADORES.map((c) => c.usuario)).size).toBe(11);
        for (const c of COLABORADORES) expect(Object.keys(c).sort()).toEqual(['nome', 'usuario']);
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

    test('forcaImpacto de 3 a 9 e status pendente ou resolvido, em todas as empilhadeiras', () => {
        const todos = EMPILHADEIRAS.flatMap((_, i) => gerarIncidentes('f', 'o', i));

        expect(todos).toHaveLength(32);
        for (const i of todos) {
            expect(i.forcaImpacto).toBeGreaterThanOrEqual(3);
            expect(i.forcaImpacto).toBeLessThanOrEqual(9);
            expect(['pendente', 'resolvido']).toContain(i.status);
        }
    });

    test('datas fixas e distintas por empilhadeira: a mesma chamada repete, índices diferentes não colidem', () => {
        expect(gerarIncidentes('f1', 'o1', 3)).toEqual(gerarIncidentes('f1', 'o1', 3));

        const datas = EMPILHADEIRAS.flatMap((_, i) => gerarIncidentes('f', 'o', i).map((x) => x.dataIncidente.toISOString()));
        expect(new Set(datas).size).toBe(32);
    });
});
