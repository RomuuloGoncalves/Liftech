import api from './api';

export interface MaquinaResumo {
  nome: string;
  identificacao: string;
  setor: string;
}

export interface Sessao {
  _id: string;
  machineId: string;
  maquina: MaquinaResumo | null;
  operador: { nome: string };
  inicio: string;
  fim: string | null;
}

export interface FiltroSessoes {
  from?: string;
  to?: string;
  machineId?: string;
}

export const sessionService = {
  async atual(): Promise<Sessao | null> {
    const { data } = await api.get<Sessao | null>('/sessions/atual');
    return data;
  },

  async iniciar(machineId: string): Promise<Sessao> {
    const { data } = await api.post<Sessao>('/sessions', { machineId });
    return data;
  },

  async encerrar(): Promise<Sessao> {
    const { data } = await api.put<Sessao>('/sessions/atual/encerrar');
    return data;
  },

  async listar(params: FiltroSessoes = {}): Promise<Sessao[]> {
    const { data } = await api.get<Sessao[]>('/sessions', { params });
    return data;
  }
};
