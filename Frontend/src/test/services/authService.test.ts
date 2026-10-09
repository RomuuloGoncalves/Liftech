import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { authService } from '../../services/authService';

vi.mock('../../services/api', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    post.mockReset();
  });

  it('login posts credentials, stores token and user, returns user', async () => {
    const user = { _id: '1', nome: 'Ana', role: 'admin' as const };
    post.mockResolvedValue({ data: { token: 'tok', user } });

    const result = await authService.login('admin', 'ana@x.com', '123');

    expect(post).toHaveBeenCalledWith('/auth/login', { role: 'admin', login: 'ana@x.com', senha: '123' });
    expect(localStorage.getItem('token')).toBe('tok');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
    expect(result).toEqual(user);
  });

  it('login rejection propagates and stores no token', async () => {
    const err = new Error('401');
    post.mockRejectedValue(err);

    await expect(authService.login('colaborador', 'joao', 'x')).rejects.toBe(err);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('solicitarAcesso posts data to /access-requests', async () => {
    post.mockResolvedValue({ data: {} });
    const dados = { email: 'a@b.com', nomeEmpresa: 'Lift', nomeAdministrador: 'Ana' };

    await authService.solicitarAcesso(dados);

    expect(post).toHaveBeenCalledWith('/access-requests', dados);
  });

  it('logout removes token and user', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', '{}');

    authService.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
