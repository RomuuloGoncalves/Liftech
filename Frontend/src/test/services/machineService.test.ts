import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { machineService } from '../../services/machineService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));

const get = vi.mocked(api.get);

describe('machineService', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('listar gets /machines and returns the machines from the response body', async () => {
    const machines = [
      {
        id: 'f1',
        identificacao: 'EMP-081',
        nome: 'Empilhadeira Elétrica Titan-X',
        setor: 'Expedição - Bloco B',
        dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F7', status: 'Disponível' as const },
        tempoSessaoMinutos: 34,
      },
    ];
    get.mockResolvedValue({ data: machines });

    const result = await machineService.listar();

    expect(get).toHaveBeenCalledWith('/machines');
    expect(result).toEqual(machines);
  });

  it('listar(filialId) sends the filialId as a query param and returns the response body', async () => {
    const machines = [{ id: 'f1', identificacao: 'EMP-081' }];
    get.mockResolvedValue({ data: machines });

    const result = await machineService.listar('f2');

    expect(get).toHaveBeenCalledWith('/machines', { params: { filialId: 'f2' } });
    expect(result).toEqual(machines);
  });

  it('listar propagates the API rejection', async () => {
    const err = new Error('Network Error');
    get.mockRejectedValue(err);

    await expect(machineService.listar()).rejects.toBe(err);
  });
});
