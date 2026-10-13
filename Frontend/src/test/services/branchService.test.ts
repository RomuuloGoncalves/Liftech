import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { branchService } from '../../services/branchService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);
const del = vi.mocked(api.delete);

const branch = { _id: 'f1', nome: 'Filial 01', matriz: true };

describe('branchService', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    del.mockReset();
  });

  it('listar gets /branches and returns the branches from the response body', async () => {
    get.mockResolvedValue({ data: [branch] });

    const result = await branchService.listar();

    expect(get).toHaveBeenCalledWith('/branches');
    expect(result).toEqual([branch]);
  });

  it('criar posts the name to /branches and returns the new branch', async () => {
    post.mockResolvedValue({ data: branch });

    const result = await branchService.criar('Filial 01');

    expect(post).toHaveBeenCalledWith('/branches', { nome: 'Filial 01' });
    expect(result).toEqual(branch);
  });

  it('renomear puts the name to /branches/<id> and returns the branch', async () => {
    put.mockResolvedValue({ data: { ...branch, nome: 'Matriz' } });

    const result = await branchService.renomear('f1', 'Matriz');

    expect(put).toHaveBeenCalledWith('/branches/f1', { nome: 'Matriz' });
    expect(result).toEqual({ ...branch, nome: 'Matriz' });
  });

  it('remover deletes /branches/<id>', async () => {
    del.mockResolvedValue({ data: {} });

    await branchService.remover('f1');

    expect(del).toHaveBeenCalledWith('/branches/f1');
  });

  it('propagates the API rejection in all four calls', async () => {
    const err = new Error('409');
    get.mockRejectedValue(err);
    post.mockRejectedValue(err);
    put.mockRejectedValue(err);
    del.mockRejectedValue(err);

    await expect(branchService.listar()).rejects.toBe(err);
    await expect(branchService.criar('x')).rejects.toBe(err);
    await expect(branchService.renomear('f1', 'x')).rejects.toBe(err);
    await expect(branchService.remover('f1')).rejects.toBe(err);
  });
});
