import api from './api';

export type RoleLogin = 'admin' | 'colaborador';

export interface Filial {
  _id: string;
  nome: string;
  matriz: boolean;
}

export interface UsuarioLogado {
  _id: string;
  nome: string;
  role: RoleLogin;
  telefone?: string;
  cargo?: string;
  empresa?: { _id: string; nome: string } | null;
  escopo?: 'empresa' | 'filiais';
  filiais?: Filial[];
  operador?: { _id: string; nome: string } | null;
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

  getSession(): UsuarioLogado | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as UsuarioLogado) : null;
    } catch {
      return null;
    }
  },

  saveBranches(filiais: Filial[]): void {
    const user = authService.getSession();
    if (user) localStorage.setItem('user', JSON.stringify({ ...user, filiais }));
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
