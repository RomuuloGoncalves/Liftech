import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { sectorService } from '../../services/sectorService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

const get = vi.mocked(api.get);
const put = vi.mocked(api.put);
const post = vi.mocked(api.post);
const del = vi.mocked(api.delete);

const setor = { _id: 's1', nome: 'Doca', filialId: 'f1', filial: { nome: 'Centro' } };

describe('sectorService', () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    post.mockReset();
    del.mockReset();
  });

  it('listar gets /sectors without params and returns the body', async () => {
    get.mockResolvedValue({ data: [setor] });

    expect(await sectorService.listar()).toEqual([setor]);
    expect(get).toHaveBeenCalledWith('/sectors');
  });

  it('listar(filialId) sends the filialId as a query param', async () => {
    get.mockResolvedValue({ data: [setor] });

    expect(await sectorService.listar('f1')).toEqual([setor]);
    expect(get).toHaveBeenCalledWith('/sectors', { params: { filialId: 'f1' } });
  });

  it('criar posts nome and filialId on /sectors', async () => {
    post.mockResolvedValue({ data: setor });

    expect(await sectorService.criar({ nome: 'Doca', filialId: 'f1' })).toEqual(setor);
    expect(post).toHaveBeenCalledWith('/sectors', { nome: 'Doca', filialId: 'f1' });
  });

  it('criar omits filialId when not given', async () => {
    post.mockResolvedValue({ data: setor });

    await sectorService.criar({ nome: 'Doca' });

    expect(post).toHaveBeenCalledWith('/sectors', { nome: 'Doca' });
  });

  it('atualizar puts nome and filialId on /sectors/:id', async () => {
    put.mockResolvedValue({ data: setor });

    expect(await sectorService.atualizar('s1', { nome: 'Doca', filialId: 'f2' })).toEqual(setor);
    expect(put).toHaveBeenCalledWith('/sectors/s1', { nome: 'Doca', filialId: 'f2' });
  });

  it('atualizar omits filialId when not given', async () => {
    put.mockResolvedValue({ data: setor });

    await sectorService.atualizar('s1', { nome: 'Doca' });

    expect(put).toHaveBeenCalledWith('/sectors/s1', { nome: 'Doca' });
  });

  it('remover deletes /sectors/:id', async () => {
    del.mockResolvedValue({ data: {} });

    await sectorService.remover('s1');

    expect(del).toHaveBeenCalledWith('/sectors/s1');
  });
});
