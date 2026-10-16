import api from './api';
import type { Employee } from '../data/team';
import type { EmployeeFormValues } from '../components/team/EmployeeFormModal';

// Only the operator fields the backend stores; login and branch go separately.
const corpo = ({ nome, telefone, cargo, horarioEntrada, horarioSaida }: EmployeeFormValues) =>
  ({ nome, telefone, cargo, horarioEntrada, horarioSaida });

export const operatorService = {
  async listar(filialId?: string): Promise<Employee[]> {
    const { data } = await (filialId
      ? api.get<Employee[]>('/operators', { params: { filialId } })
      : api.get<Employee[]>('/operators'));
    return data;
  },

  async criar(values: EmployeeFormValues, filialId?: string): Promise<Employee> {
    const { data } = await api.post<Employee>('/operators', { ...corpo(values), ...(filialId && { filialId }) });
    return data;
  },

  async atualizar(id: string, values: EmployeeFormValues): Promise<Employee> {
    const { data } = await api.put<Employee>(`/operators/${id}`, corpo(values));
    return data;
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/operators/${id}`);
  },

  async criarLogin(id: string, usuario: string, senha: string): Promise<Employee> {
    const { data } = await api.post<Employee>(`/operators/${id}/login`, { usuario, senha });
    return data;
  },

  async atualizarLogin(id: string, dados: { senha?: string; acessoNegado?: boolean }): Promise<Employee> {
    const { data } = await api.put<Employee>(`/operators/${id}/login`, dados);
    return data;
  }
};
