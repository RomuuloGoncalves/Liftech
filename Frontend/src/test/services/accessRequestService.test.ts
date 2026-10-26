import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { accessRequestService, type AccessRequest, type ApprovedAccessRequest } from '../../services/accessRequestService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

const get = vi.mocked(api.get);
const put = vi.mocked(api.put);

const mockRequest: AccessRequest = {
  _id: 'a1',
  email: 'admin@acme.com',
  nomeEmpresa: 'Acme Corp',
  nomeAdministrador: 'John Doe',
  status: 'pendente',
  createdAt: '2026-10-23T10:00:00.000Z',
  updatedAt: '2026-10-23T10:00:00.000Z',
};

const mockApproved: ApprovedAccessRequest = {
  ...mockRequest,
  status: 'aprovada',
  empresaId: 'c1',
  decididaEm: '2026-10-23T10:05:00.000Z',
  senhaInicial: 'randomPassword12',
};

describe('accessRequestService', () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
  });

  it('listar without arguments calls GET /access-requests without params and returns body', async () => {
    get.mockResolvedValue({ data: [mockRequest] });

    const result = await accessRequestService.listar();

    expect(get).toHaveBeenCalledWith('/access-requests');
    expect(result).toEqual([mockRequest]);
  });

  it("listar('pendente') calls GET /access-requests without params and returns body", async () => {
    get.mockResolvedValue({ data: [mockRequest] });

    const result = await accessRequestService.listar('pendente');

    expect(get).toHaveBeenCalledWith('/access-requests');
    expect(result).toEqual([mockRequest]);
  });

  it("listar('aprovada') calls GET /access-requests with { params: { status: 'aprovada' } }", async () => {
    get.mockResolvedValue({ data: [mockApproved] });

    const result = await accessRequestService.listar('aprovada');

    expect(get).toHaveBeenCalledWith('/access-requests', { params: { status: 'aprovada' } });
    expect(result).toEqual([mockApproved]);
  });

  it("listar('recusada') calls GET /access-requests with { params: { status: 'recusada' } }", async () => {
    const mockRejected: AccessRequest = { ...mockRequest, status: 'recusada', motivoRecusa: 'Dados incompletos' };
    get.mockResolvedValue({ data: [mockRejected] });

    const result = await accessRequestService.listar('recusada');

    expect(get).toHaveBeenCalledWith('/access-requests', { params: { status: 'recusada' } });
    expect(result).toEqual([mockRejected]);
  });

  it("aprovar('a1') calls PUT /access-requests/a1/aprovar and returns body with senhaInicial", async () => {
    put.mockResolvedValue({ data: mockApproved });

    const result = await accessRequestService.aprovar('a1');

    expect(put).toHaveBeenCalledWith('/access-requests/a1/aprovar');
    expect(result).toEqual(mockApproved);
    expect(result.senhaInicial).toBe('randomPassword12');
  });

  it("recusar('a1', 'motivo') calls PUT /access-requests/a1/recusar with { motivo: 'motivo' }", async () => {
    const mockRejected: AccessRequest = { ...mockRequest, status: 'recusada', motivoRecusa: 'motivo' };
    put.mockResolvedValue({ data: mockRejected });

    const result = await accessRequestService.recusar('a1', 'motivo');

    expect(put).toHaveBeenCalledWith('/access-requests/a1/recusar', { motivo: 'motivo' });
    expect(result).toEqual(mockRejected);
  });
});
