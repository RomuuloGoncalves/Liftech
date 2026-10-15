import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../services/api';
import { categoryService, type Categoria } from '../../services/categoryService';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mocked = vi.mocked(api);

const categoria: Categoria = {
  _id: 'c1',
  nome: 'Manutenção',
  cor: '#FFC93A',
  chave: 'manutencao',
  statusVinculados: ['manutencao'],
};

describe('categoryService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('listar gets /categories and returns the body', async () => {
    mocked.get.mockResolvedValue({ data: [categoria] });

    expect(await categoryService.listar()).toEqual([categoria]);
    expect(mocked.get).toHaveBeenCalledWith('/categories');
  });

  it('criar posts the data to /categories and returns the created category', async () => {
    mocked.post.mockResolvedValue({ data: categoria });
    const dados = { nome: 'Manutenção', cor: '#FFC93A', statusVinculados: ['manutencao' as const] };

    expect(await categoryService.criar(dados)).toEqual(categoria);
    expect(mocked.post).toHaveBeenCalledWith('/categories', dados);
  });

  it('atualizar puts the data on /categories/:id and returns the category', async () => {
    mocked.put.mockResolvedValue({ data: { ...categoria, nome: 'Oficina' } });

    expect(await categoryService.atualizar('c1', { nome: 'Oficina' })).toEqual({ ...categoria, nome: 'Oficina' });
    expect(mocked.put).toHaveBeenCalledWith('/categories/c1', { nome: 'Oficina' });
  });

  it('remover deletes /categories/:id', async () => {
    mocked.delete.mockResolvedValue({ data: undefined });

    await categoryService.remover('c1');

    expect(mocked.delete).toHaveBeenCalledWith('/categories/c1');
  });
});
