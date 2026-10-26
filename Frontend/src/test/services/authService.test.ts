import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { authService } from '../../services/authService';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const post = vi.mocked(api.post);
const put = vi.mocked(api.put);
const del = vi.mocked(api.delete);

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    post.mockReset();
    put.mockReset();
    del.mockReset();
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

  describe('session', () => {
    const user = {
      _id: 'u1',
      nome: 'Ana',
      role: 'admin' as const,
      empresa: { _id: 'e1', nome: 'Acme' },
      escopo: 'empresa' as const,
      filiais: [{ _id: 'f1', nome: 'Filial 01', matriz: true }],
    };

    it('getSession returns the stored user', () => {
      localStorage.setItem('user', JSON.stringify(user));

      expect(authService.getSession()).toEqual(user);
    });

    it('getSession returns null when there is no stored user', () => {
      expect(authService.getSession()).toBeNull();
    });

    it('getSession returns null when the stored user is not valid JSON', () => {
      localStorage.setItem('user', '{oops');

      expect(authService.getSession()).toBeNull();
    });

    it('getSession returns null when localStorage throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });

      expect(authService.getSession()).toBeNull();

      spy.mockRestore();
    });

    it('saveBranches rewrites only the branches of the stored user', () => {
      localStorage.setItem('user', JSON.stringify(user));
      const filiais = [
        { _id: 'f1', nome: 'Matriz', matriz: true },
        { _id: 'f2', nome: 'Filial 02', matriz: false },
      ];

      authService.saveBranches(filiais);

      expect(authService.getSession()).toEqual({ ...user, filiais });
    });

    it('saveBranches does nothing without a stored user', () => {
      authService.saveBranches([{ _id: 'f2', nome: 'Filial 02', matriz: false }]);

      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('atualizarConta', () => {
    const user = {
      _id: 'u1',
      nome: 'Ana',
      role: 'admin' as const,
      email: 'antigo@empresa.com',
    };

    it('atualizarConta({ senhaAtual, email }) chama api.put e grava o email da resposta em localStorage[user]', async () => {
      localStorage.setItem('user', JSON.stringify(user));
      put.mockResolvedValue({ data: { email: 'novo@empresa.com' } });

      await authService.atualizarConta({ senhaAtual: '123', email: 'novo@empresa.com' });

      expect(put).toHaveBeenCalledWith('/me', { senhaAtual: '123', email: 'novo@empresa.com' });
      expect(authService.getSession()).toEqual({ ...user, email: 'novo@empresa.com' });
    });

    it('atualizarConta({ senhaAtual, novaSenha }) não muda a sessão além do email devolvido', async () => {
      localStorage.setItem('user', JSON.stringify(user));
      put.mockResolvedValue({ data: { email: 'antigo@empresa.com' } });

      await authService.atualizarConta({ senhaAtual: '123', novaSenha: 'novaSenha123' });

      expect(put).toHaveBeenCalledWith('/me', { senhaAtual: '123', novaSenha: 'novaSenha123' });
      expect(authService.getSession()).toEqual(user);
    });

    it('erro da API em atualizarConta propaga e não mexe na sessão', async () => {
      localStorage.setItem('user', JSON.stringify(user));
      const err = new Error('403');
      put.mockRejectedValue(err);

      await expect(
        authService.atualizarConta({ senhaAtual: 'errada', email: 'novo@empresa.com' })
      ).rejects.toBe(err);

      expect(authService.getSession()).toEqual(user);
    });
  });

  describe('excluirConta', () => {
    it('excluirConta(senhaAtual) chama api.delete com data e apaga token e user', async () => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('user', JSON.stringify({ _id: 'u1', role: 'admin' }));
      del.mockResolvedValue({ data: {} });

      await authService.excluirConta('senhaSecreta123');

      expect(del).toHaveBeenCalledWith('/me', { data: { senhaAtual: 'senhaSecreta123' } });
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('erro da API em excluirConta propaga e não desloga', async () => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('user', JSON.stringify({ _id: 'u1', role: 'admin' }));
      const err = new Error('409');
      del.mockRejectedValue(err);

      await expect(authService.excluirConta('senhaSecreta123')).rejects.toBe(err);
      expect(localStorage.getItem('token')).toBe('tok');
      expect(localStorage.getItem('user')).not.toBeNull();
    });
  });
});
