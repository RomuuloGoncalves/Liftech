import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { incidentService } from '../../services/incidentService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

const incidente = {
  _id: 'i1',
  machineId: 'm1',
  maquina: { nome: 'Titan-X', identificacao: 'EMP-081', setor: 'Expedição' },
  operador: { nome: 'Carlos Silva' },
  dataIncidente: '2026-10-15T12:00:00.000Z',
  forcaImpacto: null,
  status: 'pendente',
  origem: 'funcionario' as const,
  descricao: null,
};

describe('incidentService', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('reportar posts the horario on /incidents and returns the incident', async () => {
    post.mockResolvedValue({ data: incidente });

    expect(await incidentService.reportar({ horario: '09:30' })).toEqual(incidente);
    expect(post).toHaveBeenCalledWith('/incidents', { horario: '09:30' });
  });

  it('listar gets /incidents with machineId and the period as query params', async () => {
    get.mockResolvedValue({ data: [incidente] });

    const result = await incidentService.listar({ machineId: 'm1', from: '2026-10-01', to: '2026-10-15' });

    expect(get).toHaveBeenCalledWith('/incidents', { params: { machineId: 'm1', from: '2026-10-01', to: '2026-10-15' } });
    expect(result).toEqual([incidente]);
  });

  it('listar sends filialId as query param', async () => {
    get.mockResolvedValue({ data: [incidente] });

    const result = await incidentService.listar({ filialId: 'f1' });

    expect(get).toHaveBeenCalledWith('/incidents', { params: { filialId: 'f1' } });
    expect(result).toEqual([incidente]);
  });

  it('propagates the API rejection', async () => {
    const err = new Error('409');
    post.mockRejectedValue(err);

    await expect(incidentService.reportar({})).rejects.toBe(err);
  });
});
