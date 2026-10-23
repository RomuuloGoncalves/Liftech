import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { sessionService } from '../../services/sessionService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

const sessao = {
  _id: 's1',
  machineId: 'm1',
  maquina: { nome: 'Titan-X', identificacao: 'EMP-081', setor: 'Expedição' },
  operador: { nome: 'Carlos Silva' },
  inicio: '2026-10-15T12:00:00.000Z',
  fim: null,
};

describe('sessionService', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it('atual gets /sessions/atual and returns the open session', async () => {
    get.mockResolvedValue({ data: sessao });

    expect(await sessionService.atual()).toEqual(sessao);
    expect(get).toHaveBeenCalledWith('/sessions/atual');
  });

  it('atual returns null when there is no open session', async () => {
    get.mockResolvedValue({ data: null });

    expect(await sessionService.atual()).toBeNull();
  });

  it('iniciar posts the machineId on /sessions and returns the session', async () => {
    post.mockResolvedValue({ data: sessao });

    expect(await sessionService.iniciar('m1')).toEqual(sessao);
    expect(post).toHaveBeenCalledWith('/sessions', { machineId: 'm1' });
  });

  it('encerrar puts /sessions/atual/encerrar and returns the closed session', async () => {
    const closed = { ...sessao, fim: '2026-10-15T13:00:00.000Z' };
    put.mockResolvedValue({ data: closed });

    expect(await sessionService.encerrar()).toEqual(closed);
    expect(put).toHaveBeenCalledWith('/sessions/atual/encerrar');
  });

  it('listar gets /sessions with the filters as query params', async () => {
    get.mockResolvedValue({ data: [sessao] });

    const result = await sessionService.listar({ from: '2026-10-01', to: '2026-10-15', machineId: 'm1' });

    expect(get).toHaveBeenCalledWith('/sessions', { params: { from: '2026-10-01', to: '2026-10-15', machineId: 'm1' } });
    expect(result).toEqual([sessao]);
  });

  it('listar gets /sessions with from and filialId in params', async () => {
    get.mockResolvedValue({ data: [sessao] });

    const result = await sessionService.listar({ from: '2026-10-01', filialId: 'f1' });

    expect(get).toHaveBeenCalledWith('/sessions', { params: { from: '2026-10-01', filialId: 'f1' } });
    expect(result).toEqual([sessao]);
  });

  it('listar without filters sends empty params', async () => {
    get.mockResolvedValue({ data: [] });

    await sessionService.listar();

    expect(get).toHaveBeenCalledWith('/sessions', { params: {} });
  });

  it('propagates the API rejection', async () => {
    const err = new Error('409');
    post.mockRejectedValue(err);

    await expect(sessionService.iniciar('m1')).rejects.toBe(err);
  });
});
