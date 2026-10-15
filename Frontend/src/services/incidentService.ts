import api from './api';
import type { MaquinaResumo } from './sessionService';

export interface Incidente {
  _id: string;
  machineId: string;
  maquina: MaquinaResumo | null;
  operador: { nome: string } | null;
  dataIncidente: string;
  forcaImpacto: number | null;
  status: string;
  origem: 'sensor' | 'funcionario';
  descricao: string | null;
}

export interface Ocorrencia {
  horario?: string;
  descricao?: string;
}

export interface FiltroIncidentes {
  machineId?: string;
  from?: string;
  to?: string;
}

export const incidentService = {
  async reportar(dados: Ocorrencia): Promise<Incidente> {
    const { data } = await api.post<Incidente>('/incidents', dados);
    return data;
  },

  async listar(params: FiltroIncidentes = {}): Promise<Incidente[]> {
    const { data } = await api.get<Incidente[]>('/incidents', { params });
    return data;
  }
};
