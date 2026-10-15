import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, buscar, criar, atualizar, deletar, servicoTelemetry } from '../../src/feature/telemetry/telemetryController.js';
import { telemetryModel } from '../../src/models/telemetryModel.js';
import { Device } from '../../src/schemas/device.js';
import { registrarImpacto } from '../../src/feature/machine/statusService.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/telemetry/telemetryService.js');
vi.mock('../../src/feature/machine/statusService.js', async (original) => ({ ...(await original<any>()), registrarImpacto: vi.fn() }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: {} }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: {} }));
vi.mock('../../src/schemas/category.js', () => ({ Category: {} }));
vi.mock('../../src/schemas/telemetry.js', () => ({ Telemetry: {} }));
vi.mock('../../src/schemas/device.js', () => ({ Device: { find: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const F1 = '665f1c2b9a1e4b00123456b1';
const D1 = '665f1c2b9a1e4b00123456d1';
const D2 = '665f1c2b9a1e4b00123456d2';
const FORA = '665f1c2b9a1e4b00123456d9';
const ID = '665f1c2b9a1e4b0012345678';
const ESCOPO: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [{ _id: F1, nome: 'Matriz', matriz: true }] };
const FILTRO = { dispositivoId: { $in: [D1, D2] } };
const leitura = new telemetryModel(new Date('2026-09-01T08:00:00Z'), D1, ID);

describe('telemetryController: escopo pelos dispositivos', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const req = (extra: object = {}) => ({ escopo: ESCOPO, params: {}, body: {}, query: {}, ...extra }) as unknown as Request;
    const mockarDispositivos = (ids: string[]) => {
        const distinct = vi.fn().mockResolvedValue(ids.map((i) => ({ toString: () => i })));
        vi.mocked(Device.find).mockReturnValue({ distinct } as any);
        return distinct;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
        mockarDispositivos([D1, D2]);
    });

    test('os dispositivos do escopo vêm de Device.find com o filtro das filiais do escopo', async () => {
        const distinct = mockarDispositivos([D1]);
        vi.mocked(servicoTelemetry.listar).mockResolvedValue([]);

        await listar(req(), res);

        expect(Device.find).toHaveBeenCalledWith({ filialId: { $in: [F1] } });
        expect(distinct).toHaveBeenCalledWith('_id');
    });

    test('listar passa ao service o filtro com os dispositivos do escopo', async () => {
        vi.mocked(servicoTelemetry.listar).mockResolvedValue([leitura]);

        await listar(req(), res);

        expect(servicoTelemetry.listar).toHaveBeenCalledWith(FILTRO);
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith([leitura.obterDados()]);
    });

    test('escopo sem dispositivos: listar filtra com $in vazio', async () => {
        mockarDispositivos([]);
        vi.mocked(servicoTelemetry.listar).mockResolvedValue([]);

        await listar(req(), res);

        expect(servicoTelemetry.listar).toHaveBeenCalledWith({ dispositivoId: { $in: [] } });
    });

    test('?dispositivoId= de dispositivo do escopo lista as leituras dele', async () => {
        vi.mocked(servicoTelemetry.listarPorDispositivo).mockResolvedValue([leitura]);

        await listar(req({ query: { dispositivoId: D1 } }), res);

        expect(servicoTelemetry.listarPorDispositivo).toHaveBeenCalledWith(D1);
        expect(mockJson).toHaveBeenCalledWith([leitura.obterDados()]);
    });

    test('?dispositivoId= de dispositivo fora do escopo: 200 com lista vazia, sem consultar a telemetria', async () => {
        await listar(req({ query: { dispositivoId: FORA } }), res);

        expect(servicoTelemetry.listarPorDispositivo).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith([]);
    });

    test('buscar passa o filtro; leitura de dispositivo de fora faz o service lançar e vira 404', async () => {
        vi.mocked(servicoTelemetry.obterPorId).mockRejectedValue(new Error('Telemetria não encontrado(a).'));

        await buscar(req({ params: { id: ID } }), res);

        expect(servicoTelemetry.obterPorId).toHaveBeenCalledWith(ID, FILTRO);
        expect(mockStatus).toHaveBeenCalledWith(404);
    });

    test('deletar passa o filtro; leitura de fora vira 404', async () => {
        vi.mocked(servicoTelemetry.deletar).mockRejectedValue(new Error('Telemetria não encontrado(a).'));

        await deletar(req({ params: { id: ID } }), res);

        expect(servicoTelemetry.deletar).toHaveBeenCalledWith(ID, FILTRO);
        expect(mockStatus).toHaveBeenCalledWith(404);
    });

    test('criar com dispositivo do escopo cria a leitura', async () => {
        vi.mocked(servicoTelemetry.criar).mockResolvedValue(leitura);

        await criar(req({ body: { dispositivoId: D1, dataDados: '2026-09-01T08:00:00Z' } }), res);

        expect(servicoTelemetry.criar).toHaveBeenCalledTimes(1);
        expect(mockStatus).toHaveBeenCalledWith(201);
    });

    test('criar com dispositivo fora do escopo: 404, sem criar', async () => {
        await criar(req({ body: { dispositivoId: FORA, dataDados: '2026-09-01T08:00:00Z' } }), res);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Dispositivo não encontrado(a).' });
        expect(servicoTelemetry.criar).not.toHaveBeenCalled();
    });

    test('atualizar passa o corpo e o filtro dos dispositivos do escopo', async () => {
        vi.mocked(servicoTelemetry.atualizar).mockResolvedValue(leitura);

        await atualizar(req({ params: { id: ID }, body: { dispositivoId: D2 } }), res);

        expect(servicoTelemetry.atualizar).toHaveBeenCalledWith(ID, { dispositivoId: D2 }, FILTRO);
        expect(mockStatus).toHaveBeenCalledWith(201);
    });

    test('atualizar com dispositivo fora do escopo: 404, sem atualizar', async () => {
        await atualizar(req({ params: { id: ID }, body: { dispositivoId: FORA } }), res);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(servicoTelemetry.atualizar).not.toHaveBeenCalled();
    });

    test('atualizar com leitura de fora: o service lança e vira 404', async () => {
        vi.mocked(servicoTelemetry.atualizar).mockRejectedValue(new Error('Telemetria não encontrado(a).'));

        await atualizar(req({ params: { id: ID }, body: {} }), res);

        expect(mockStatus).toHaveBeenCalledWith(404);
    });

    test.each(['$set', '$where'])('atualizar com a chave %s: 400, sem atualizar', async (chave) => {
        await atualizar(req({ params: { id: ID }, body: { [chave]: { dispositivoId: FORA } } }), res);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(servicoTelemetry.atualizar).not.toHaveBeenCalled();
    });

    describe('forcaImpacto', () => {
        const DATA = '2026-09-01T08:00:00Z';
        const comForca = (forcaImpacto: unknown) => req({ body: { dispositivoId: D1, dataDados: DATA, forcaImpacto } });

        beforeEach(() => {
            vi.mocked(servicoTelemetry.criar).mockResolvedValue(leitura);
            delete process.env.LIMITE_IMPACTO;
        });

        test('igual ao limite (5): grava a leitura com a força e registra o impacto', async () => {
            await criar(comForca(5), res);

            const gravada = vi.mocked(servicoTelemetry.criar).mock.calls[0]![0];
            expect(gravada.obterDados()).toMatchObject({ dispositivoId: D1, forcaImpacto: 5 });
            expect(registrarImpacto).toHaveBeenCalledWith(D1, 5, new Date(DATA));
            expect(mockStatus).toHaveBeenCalledWith(201);
        });

        test('abaixo do limite: grava sem registrar impacto', async () => {
            await criar(comForca(4.9), res);
            expect(servicoTelemetry.criar).toHaveBeenCalledTimes(1);
            expect(registrarImpacto).not.toHaveBeenCalled();
        });

        test('sem forcaImpacto: grava sem registrar impacto', async () => {
            await criar(req({ body: { dispositivoId: D1, dataDados: DATA } }), res);
            expect(servicoTelemetry.criar).toHaveBeenCalledTimes(1);
            expect(registrarImpacto).not.toHaveBeenCalled();
        });

        test.each([[-1], ['7'], [Number.NaN], [Number.POSITIVE_INFINITY], [null]])('400 com forcaImpacto %s, sem gravar', async (valor) => {
            await criar(comForca(valor), res);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(servicoTelemetry.criar).not.toHaveBeenCalled();
            expect(registrarImpacto).not.toHaveBeenCalled();
        });
    });
});
