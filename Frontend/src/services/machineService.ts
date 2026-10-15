import api from './api';
import type { Machine, MachineStatus } from '../data/machines';

export const machineService = {
  async listar(filialId?: string): Promise<Machine[]> {
    const { data } = await (filialId
      ? api.get<Machine[]>('/machines', { params: { filialId } })
      : api.get<Machine[]>('/machines'));
    return data;
  },

  async mover(machineIds: string[], categoriaId: string | null): Promise<Machine[]> {
    const { data } = await api.put<Machine[]>('/machines/categoria', { machineIds, categoriaId });
    return data;
  },

  async alterarStatus(id: string, status: MachineStatus): Promise<Machine> {
    const { data } = await api.put<Machine>(`/machines/${id}/status`, { status });
    return data;
  },

  async travar(id: string, categoriaTravada: boolean): Promise<Machine> {
    const { data } = await api.put<Machine>(`/machines/${id}/trava`, { categoriaTravada });
    return data;
  }
};
