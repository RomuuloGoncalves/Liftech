import api from './api';

export type Setor = { _id: string; nome: string; filialId: string; filial: { nome: string } };

export type SetorValues = { nome: string; filialId?: string };

const corpo = ({ nome, filialId }: SetorValues) => ({ nome, ...(filialId !== undefined && { filialId }) });

export const sectorService = {
  async listar(filialId?: string): Promise<Setor[]> {
    const { data } = await (filialId
      ? api.get<Setor[]>('/sectors', { params: { filialId } })
      : api.get<Setor[]>('/sectors'));
    return data;
  },

  async criar(values: SetorValues): Promise<Setor> {
    const { data } = await api.post<Setor>('/sectors', corpo(values));
    return data;
  },

  async atualizar(id: string, values: SetorValues): Promise<Setor> {
    const { data } = await api.put<Setor>(`/sectors/${id}`, corpo(values));
    return data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/sectors/${id}`);
  }
};
