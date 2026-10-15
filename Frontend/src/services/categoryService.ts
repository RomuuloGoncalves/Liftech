import api from './api';
import type { MachineStatus } from '../data/machines';

export interface Categoria {
  _id: string;
  nome: string;
  cor: string;
  chave: string | null;
  statusVinculados: MachineStatus[];
}

export type CategoriaDados = Partial<Pick<Categoria, 'nome' | 'cor' | 'statusVinculados'>>;

export const categoryService = {
  async listar(): Promise<Categoria[]> {
    const { data } = await api.get<Categoria[]>('/categories');
    return data;
  },

  async criar(dados: CategoriaDados): Promise<Categoria> {
    const { data } = await api.post<Categoria>('/categories', dados);
    return data;
  },

  async atualizar(id: string, dados: CategoriaDados): Promise<Categoria> {
    const { data } = await api.put<Categoria>(`/categories/${id}`, dados);
    return data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
};
