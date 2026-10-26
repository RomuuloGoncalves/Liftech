import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { enviar } from '../../src/feature/feedback/feedbackController.js';
import feedbackRouter from '../../src/feature/feedback/feedbackRouter.js';
import * as feedbackService from '../../src/feature/feedback/feedbackService.js';
import type { Escopo } from '../../src/core/escopo.js';
import type { UsuarioRequisicao } from '../../src/core/autenticar.js';

vi.mock('../../src/feature/feedback/feedbackService.js', () => ({
  enviar: vi.fn(),
}));

const usuario: UsuarioRequisicao = { _id: 'u1', role: 'admin', operadorId: null };
const escopo: Escopo = { empresaId: 'e1', tipo: 'empresa', filiais: [] };
const RETORNO_SERVICE = { _id: 'f1', criadoEm: '2026-10-23T12:00:00.000Z' };
const MENSAGEM_ERRO_400 = "O campo 'mensagem' deve ter de 1 a 1000 caracteres.";

describe('feedbackController', () => {
  let json: ReturnType<typeof vi.fn>;
  let status: ReturnType<typeof vi.fn>;
  let res: Response;
  const req = (extra: object = {}) =>
    ({ escopo, usuario, params: {}, body: {}, query: {}, ...extra }) as unknown as Request;

  beforeEach(() => {
    vi.clearAllMocks();
    json = vi.fn();
    status = vi.fn().mockReturnValue({ json });
    res = { status, json } as unknown as Response;
    vi.mocked(feedbackService.enviar).mockResolvedValue(RETORNO_SERVICE);
  });

  test('{ mensagem: "  Ótimo app  " } → service com "Ótimo app" e status 201', async () => {
    await enviar(req({ body: { mensagem: '  Ótimo app  ' } }), res);

    expect(feedbackService.enviar).toHaveBeenCalledWith(usuario, escopo, 'Ótimo app');
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(RETORNO_SERVICE);
  });

  test('1000 caracteres → 201; 1001 → 400', async () => {
    await enviar(req({ body: { mensagem: 'a'.repeat(1000) } }), res);
    expect(status).toHaveBeenCalledWith(201);
    expect(feedbackService.enviar).toHaveBeenCalledWith(usuario, escopo, 'a'.repeat(1000));

    vi.clearAllMocks();
    status.mockReturnValue({ json });
    await enviar(req({ body: { mensagem: 'a'.repeat(1001) } }), res);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: MENSAGEM_ERRO_400 });
    expect(feedbackService.enviar).not.toHaveBeenCalled();
  });

  test.each([
    ['corpo vazio', {}],
    ['mensagem null', { mensagem: null }],
    ['mensagem número 42', { mensagem: 42 }],
    ['mensagem booleano', { mensagem: true }],
    ['mensagem objeto', { mensagem: { texto: 'oi' } }],
    ['string vazia', { mensagem: '' }],
    ['só espaços', { mensagem: '   ' }],
  ])('%s → 400 com mensagem exata e service não chamado', async (_caso, body) => {
    await enviar(req({ body }), res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: MENSAGEM_ERRO_400 });
    expect(feedbackService.enviar).not.toHaveBeenCalled();
  });

  test('corpo com usuarioId, empresaId e role falsos → service recebe usuario e escopo originais', async () => {
    const bodyComCamposFalsos = {
      mensagem: 'Mensagem legítima',
      usuarioId: 'hacker-id',
      empresaId: 'hacker-empresa',
      role: 'superadmin',
    };

    await enviar(req({ body: bodyComCamposFalsos }), res);

    expect(feedbackService.enviar).toHaveBeenCalledWith(usuario, escopo, 'Mensagem legítima');
    expect(status).toHaveBeenCalledWith(201);
  });

  test('erro do service → 500', async () => {
    vi.mocked(feedbackService.enviar).mockRejectedValue(new Error('Falha no banco'));

    await enviar(req({ body: { mensagem: 'Mensagem de teste' } }), res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Falha no banco' });
  });

  test('rotas registradas: pilha do router tem POST / ligado a enviar', () => {
    const rotas = feedbackRouter.stack.map((c: any) => [Object.keys(c.route.methods)[0], c.route.path]);
    expect(rotas).toEqual([['post', '/']]);
  });
});
