import api from './api';
import type { Machine, MachineStatus } from '../data/machines';
import type { NewMachineFormValues } from '../components/machines/NewMachinePanel';

// Only the fields the backend stores; the branch goes separately, on create.
const corpo = ({ nome, identificacao, setorId, nomeDispositivo, enderecoMac }: NewMachineFormValues) =>
  ({ nome, identificacao, setorId: setorId || null, nomeDispositivo, enderecoMac });

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
  },

  async criar(values: NewMachineFormValues, filialId?: string): Promise<Machine> {
    const { data } = await api.post<Machine>('/machines', { ...corpo(values), ...(filialId && { filialId }) });
    return data;
  },

  async atualizar(id: string, values: NewMachineFormValues): Promise<Machine> {
    const { data } = await api.put<Machine>(`/machines/${id}`, corpo(values));
    return data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/machines/${id}`);
  }
};
