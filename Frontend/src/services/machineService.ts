import api from './api';
import type { Machine } from '../data/machines';

export const machineService = {
  async listar(filialId?: string): Promise<Machine[]> {
    const { data } = await (filialId
      ? api.get<Machine[]>('/machines', { params: { filialId } })
      : api.get<Machine[]>('/machines'));
    return data;
  }
};
