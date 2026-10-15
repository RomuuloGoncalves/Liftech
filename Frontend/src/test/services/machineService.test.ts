import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { machineService } from '../../services/machineService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }));

const get = vi.mocked(api.get);
const put = vi.mocked(api.put);

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
        status: 'disponivel' as const,
        categoriaId: null,
        categoriaTravada: false,
        alertaEm: null,
        dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F7' },
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

describe('machineService updates', () => {
  beforeEach(() => {
    put.mockReset();
  });

  it('mover puts the machine ids and the category on /machines/categoria', async () => {
    put.mockResolvedValue({ data: [{ id: 'm1', categoriaId: 'c1' }] });

    const result = await machineService.mover(['m1', 'm2'], 'c1');

    expect(put).toHaveBeenCalledWith('/machines/categoria', { machineIds: ['m1', 'm2'], categoriaId: 'c1' });
    expect(result).toEqual([{ id: 'm1', categoriaId: 'c1' }]);
  });

  it('mover sends categoriaId null to take machines out of any category', async () => {
    put.mockResolvedValue({ data: [] });

    await machineService.mover(['m1'], null);

    expect(put).toHaveBeenCalledWith('/machines/categoria', { machineIds: ['m1'], categoriaId: null });
  });

  it('alterarStatus puts the status on /machines/:id/status and returns the machine', async () => {
    put.mockResolvedValue({ data: { id: 'm1', status: 'alerta' } });

    const result = await machineService.alterarStatus('m1', 'alerta');

    expect(put).toHaveBeenCalledWith('/machines/m1/status', { status: 'alerta' });
    expect(result).toEqual({ id: 'm1', status: 'alerta' });
  });

  it('travar puts categoriaTravada on /machines/:id/trava and returns the machine', async () => {
    put.mockResolvedValue({ data: { id: 'm1', categoriaTravada: false } });

    const result = await machineService.travar('m1', false);

    expect(put).toHaveBeenCalledWith('/machines/m1/trava', { categoriaTravada: false });
    expect(result).toEqual({ id: 'm1', categoriaTravada: false });
  });
});
