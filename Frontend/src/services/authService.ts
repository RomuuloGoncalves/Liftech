import api from './api';

export type RoleLogin = 'admin' | 'colaborador';

export interface UsuarioLogado {
  _id: string;
  nome: string;
  role: RoleLogin;
}

export interface SolicitacaoAcesso {
  email: string;
  nomeEmpresa: string;
  nomeAdministrador: string;
}

export const authService = {
  async login(role: RoleLogin, login: string, senha: string): Promise<UsuarioLogado> {
    const { data } = await api.post<{ token: string; user: UsuarioLogado }>('/auth/login', { role, login, senha });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  },

  async solicitarAcesso(dados: SolicitacaoAcesso): Promise<void> {
    await api.post('/access-requests', dados);
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
