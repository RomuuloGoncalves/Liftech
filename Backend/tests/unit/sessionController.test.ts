import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { atual, iniciar, encerrar, listar } from '../../src/feature/session/sessionController.js';
import sessionRouter from '../../src/feature/session/sessionRouter.js';
import * as servico from '../../src/feature/session/sessionService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/session/sessionService.js', async (original) => ({
    lerMachineId: ((await original()) as typeof servico).lerMachineId,
    atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn(),
}));

const MAQUINA = '665f1c2b9a1e4b00123456d1';
const escopo: Escopo = { empresaId: 'e1', tipo: 'filiais', filiais: [] };
const usuario = { _id: 'u1', role: 'colaborador', operadorId: 'o1' };
const SESSAO = { _id: 's1', machineId: MAQUINA, inicio: '2026-10-15T12:00:00.000Z', fim: null };

describe('sessionController', () => {
    let json: ReturnType<typeof vi.fn>;
    let status: ReturnType<typeof vi.fn>;
    let res: Response;
    const req = (extra: object = {}) => ({ escopo, usuario, params: {}, body: {}, query: {}, ...extra }) as unknown as Request;
    const respondeu = (codigo: number, corpo: unknown) => {
        expect(status).toHaveBeenCalledWith(codigo);
        expect(json).toHaveBeenCalledWith(corpo);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { status, json } as unknown as Response;
    });

    test('atual: 200 com a sessão', async () => {
        vi.mocked(servico.atual).mockResolvedValue(SESSAO as any);
        await atual(req(), res);
        expect(servico.atual).toHaveBeenCalledWith(usuario);
        respondeu(200, SESSAO);
    });

    test('atual: 200 com null sem sessão aberta', async () => {
        vi.mocked(servico.atual).mockResolvedValue(null);
        await atual(req(), res);
        respondeu(200, null);
    });

    test('iniciar: 201 com a sessão', async () => {
        vi.mocked(servico.iniciar).mockResolvedValue(SESSAO as any);
        await iniciar(req({ body: { machineId: MAQUINA } }), res);
        expect(servico.iniciar).toHaveBeenCalledWith(escopo, usuario, MAQUINA);
        respondeu(201, SESSAO);
    });

    test.each([
        ['sem machineId', {}],
        ['machineId inválido', { machineId: 'abc' }],
        ['machineId não string', { machineId: { $ne: null } }],
    ])('iniciar %s: 400 sem chamar o serviço', async (_caso, body) => {
        await iniciar(req({ body }), res);
        expect(status).toHaveBeenCalledWith(400);
        expect(servico.iniciar).not.toHaveBeenCalled();
    });

    test.each([403, 404, 409])('iniciar: erro %i do serviço vira a resposta', async (codigo) => {
        vi.mocked(servico.iniciar).mockRejectedValue(new ErroHttp(codigo, 'erro'));
        await iniciar(req({ body: { machineId: MAQUINA } }), res);
        respondeu(codigo, { error: 'erro' });
    });

    test('encerrar: 200 com a sessão encerrada', async () => {
        vi.mocked(servico.encerrar).mockResolvedValue({ ...SESSAO, fim: '2026-10-15T13:00:00.000Z' } as any);
        await encerrar(req(), res);
        expect(servico.encerrar).toHaveBeenCalledWith(usuario);
        respondeu(200, { ...SESSAO, fim: '2026-10-15T13:00:00.000Z' });
    });

    test.each([403, 409])('encerrar: erro %i', async (codigo) => {
        vi.mocked(servico.encerrar).mockRejectedValue(new ErroHttp(codigo, 'erro'));
        await encerrar(req(), res);
        respondeu(codigo, { error: 'erro' });
    });

    test('listar: 200 repassando a query', async () => {
        vi.mocked(servico.listar).mockResolvedValue([SESSAO] as any);
        const query = { from: '2026-10-01', to: '2026-10-15', machineId: MAQUINA };
        await listar(req({ query }), res);
        expect(servico.listar).toHaveBeenCalledWith(escopo, usuario, query);
        respondeu(200, [SESSAO]);
    });

    test('listar: 400 do serviço', async () => {
        vi.mocked(servico.listar).mockRejectedValue(new ErroHttp(400, 'erro'));
        await listar(req(), res);
        respondeu(400, { error: 'erro' });
    });

    test('erro inesperado: 500', async () => {
        vi.mocked(servico.atual).mockRejectedValue(new Error('falha'));
        await atual(req(), res);
        respondeu(500, { error: 'falha' });
    });

    test('rotas registradas', () => {
        const rotas = sessionRouter.stack.map((c: any) => [Object.keys(c.route.methods)[0], c.route.path]);
        expect(rotas).toEqual([['get', '/atual'], ['put', '/atual/encerrar'], ['get', '/'], ['post', '/']]);
    });
});
