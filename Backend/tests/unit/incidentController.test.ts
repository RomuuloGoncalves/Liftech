import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { reportar, listar } from '../../src/feature/incident/incidentController.js';
import incidentRouter from '../../src/feature/incident/incidentRouter.js';
import * as servico from '../../src/feature/incident/incidentService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/incident/incidentService.js', () => ({ reportar: vi.fn(), listar: vi.fn() }));

const escopo: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [] };
const usuario = { _id: 'u1', role: 'colaborador', operadorId: 'o1' };
const INCIDENTE = { _id: 'i1', origem: 'funcionario' };

describe('incidentController', () => {
    let json: ReturnType<typeof vi.fn>;
    let status: ReturnType<typeof vi.fn>;
    let res: Response;
    const req = (extra: object = {}) => ({ escopo, usuario, params: {}, body: {}, query: {}, ...extra }) as unknown as Request;

    beforeEach(() => {
        vi.clearAllMocks();
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { status, json } as unknown as Response;
        vi.mocked(servico.reportar).mockResolvedValue(INCIDENTE as any);
    });

    test('reportar: 201 com horario e descricao cortada', async () => {
        await reportar(req({ body: { horario: '09:15', descricao: '  Pneu furado ' } }), res);
        expect(servico.reportar).toHaveBeenCalledWith(usuario, { horario: '09:15', descricao: 'Pneu furado' });
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith(INCIDENTE);
    });

    test('reportar: corpo vazio vale', async () => {
        await reportar(req(), res);
        expect(servico.reportar).toHaveBeenCalledWith(usuario, {});
        expect(status).toHaveBeenCalledWith(201);
    });

    test.each([
        ['horario 9:15', { horario: '9:15' }],
        ['horario 24:00', { horario: '24:00' }],
        ['horario número', { horario: 915 }],
        ['descricao com 501 caracteres', { descricao: 'a'.repeat(501) }],
        ['descricao não string', { descricao: { $gt: '' } }],
    ])('reportar %s: 400 sem chamar o serviço', async (_caso, body) => {
        await reportar(req({ body }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(servico.reportar).not.toHaveBeenCalled();
    });

    test('reportar: descricao com 500 caracteres passa', async () => {
        await reportar(req({ body: { descricao: 'a'.repeat(500) } }), res);
        expect(status).toHaveBeenCalledWith(201);
    });

    test.each([403, 409])('reportar: erro %i do serviço', async (codigo) => {
        vi.mocked(servico.reportar).mockRejectedValue(new ErroHttp(codigo, 'erro'));
        await reportar(req(), res);
        expect(status).toHaveBeenCalledWith(codigo);
        expect(json).toHaveBeenCalledWith({ error: 'erro' });
    });

    test('listar: 200 repassando a query', async () => {
        vi.mocked(servico.listar).mockResolvedValue([INCIDENTE] as any);
        const query = { machineId: 'm1', from: '2026-10-01' };
        await listar(req({ query }), res);
        expect(servico.listar).toHaveBeenCalledWith(escopo, query);
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([INCIDENTE]);
    });

    test('listar: 400 do serviço', async () => {
        vi.mocked(servico.listar).mockRejectedValue(new ErroHttp(400, 'erro'));
        await listar(req(), res);
        expect(status).toHaveBeenCalledWith(400);
    });

    test('rotas registradas', () => {
        const rotas = incidentRouter.stack.map((c: any) => [Object.keys(c.route.methods)[0], c.route.path]);
        expect(rotas).toEqual([['get', '/'], ['post', '/']]);
    });
});
