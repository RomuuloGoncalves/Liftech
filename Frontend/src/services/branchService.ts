import api from './api';
import type { Filial } from './authService';

export const branchService = {
  async listar(): Promise<Filial[]> {
    const { data } = await api.get<Filial[]>('/branches');
    return data;
  },

  async criar(nome: string): Promise<Filial> {
    const { data } = await api.post<Filial>('/branches', { nome });
    return data;
  },

  async renomear(id: string, nome: string): Promise<Filial> {
    const { data } = await api.put<Filial>(`/branches/${id}`, { nome });
    return data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  }
};
