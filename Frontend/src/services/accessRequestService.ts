import api from './api';

export type AccessRequestStatus = 'pendente' | 'aprovada' | 'recusada';

export interface AccessRequest {
  _id: string;
  email: string;
  nomeEmpresa: string;
  nomeAdministrador: string;
  status: AccessRequestStatus;
  createdAt: string;
  updatedAt: string;
  empresaId?: string;
  decididaEm?: string;
  motivoRecusa?: string;
}

export interface ApprovedAccessRequest extends AccessRequest {
  senhaInicial: string;
}

export const accessRequestService = {
  async listar(status?: AccessRequestStatus): Promise<AccessRequest[]> {
    const { data } = await (status && status !== 'pendente'
      ? api.get<AccessRequest[]>('/access-requests', { params: { status } })
      : api.get<AccessRequest[]>('/access-requests'));
    return data;
  },

  async aprovar(id: string): Promise<ApprovedAccessRequest> {
    const { data } = await api.put<ApprovedAccessRequest>(`/access-requests/${id}/aprovar`);
    return data;
  },

  async recusar(id: string, motivo?: string): Promise<AccessRequest> {
    const { data } = await api.put<AccessRequest>(`/access-requests/${id}/recusar`, { motivo });
    return data;
  }
};
