import api from './api';
import type { Machine } from '../data/machines';

export const machineService = {
  async listar(): Promise<Machine[]> {
    const { data } = await api.get<Machine[]>('/machines');
    return data;
  }
};
