import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Feedback } from '../../src/schemas/feedback.js';
import { enviar } from '../../src/feature/feedback/feedbackService.js';
import type { UsuarioRequisicao } from '../../src/core/autenticar.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/feedback.js', () => ({
  Feedback: {
    create: vi.fn(),
  },
}));

describe('feedbackService.enviar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Feedback.create recebe exatamente { mensagem, usuarioId, empresaId, role } para admin', async () => {
    const usuario: UsuarioRequisicao = { _id: 'user-admin-1', role: 'admin', operadorId: null };
    const escopo: Escopo = { empresaId: 'empresa-1', tipo: 'empresa', filiais: [] };
    const agora = new Date('2026-10-23T12:00:00.000Z');

    vi.mocked(Feedback.create).mockResolvedValueOnce({
      _id: 'feedback-123',
      criadoEm: agora,
    } as any);

    const resultado = await enviar(usuario, escopo, 'Ótima plataforma!');

    expect(Feedback.create).toHaveBeenCalledTimes(1);
    expect(Feedback.create).toHaveBeenCalledWith({
      mensagem: 'Ótima plataforma!',
      usuarioId: 'user-admin-1',
      empresaId: 'empresa-1',
      role: 'admin',
    });
    expect(resultado).toEqual({
      _id: 'feedback-123',
      criadoEm: '2026-10-23T12:00:00.000Z',
    });
  });

  test('Feedback.create recebe exatamente { mensagem, usuarioId, empresaId, role } para colaborador', async () => {
    const usuario: UsuarioRequisicao = { _id: 'user-colab-2', role: 'colaborador', operadorId: 'op-1' };
    const escopo: Escopo = { empresaId: 'empresa-2', tipo: 'filiais', filiais: [] };
    const agora = new Date('2026-10-23T15:30:00.000Z');

    vi.mocked(Feedback.create).mockResolvedValueOnce({
      _id: 'feedback-456',
      criadoEm: agora,
    } as any);

    const resultado = await enviar(usuario, escopo, 'Sugestão de melhoria');

    expect(Feedback.create).toHaveBeenCalledTimes(1);
    expect(Feedback.create).toHaveBeenCalledWith({
      mensagem: 'Sugestão de melhoria',
      usuarioId: 'user-colab-2',
      empresaId: 'empresa-2',
      role: 'colaborador',
    });
    expect(resultado).toEqual({
      _id: 'feedback-456',
      criadoEm: '2026-10-23T15:30:00.000Z',
    });
  });

  test('escopo sem empresaId grava empresaId: null', async () => {
    const usuario: UsuarioRequisicao = { _id: 'user-legacy-3', role: 'admin', operadorId: null };
    const escopo: Escopo = { tipo: 'filiais', filiais: [] };
    const agora = new Date('2026-10-23T16:00:00.000Z');

    vi.mocked(Feedback.create).mockResolvedValueOnce({
      _id: 'feedback-789',
      criadoEm: agora,
    } as any);

    const resultado = await enviar(usuario, escopo, 'Mensagem sem empresaId');

    expect(Feedback.create).toHaveBeenCalledWith({
      mensagem: 'Mensagem sem empresaId',
      usuarioId: 'user-legacy-3',
      empresaId: null,
      role: 'admin',
    });
    expect(resultado).toEqual({
      _id: 'feedback-789',
      criadoEm: '2026-10-23T16:00:00.000Z',
    });
  });
});
