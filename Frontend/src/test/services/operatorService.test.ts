import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { operatorService } from '../../services/operatorService';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

const get = vi.mocked(api.get);
const put = vi.mocked(api.put);
const post = vi.mocked(api.post);
const del = vi.mocked(api.delete);

const fields = {
  nome: 'Ana Souza',
  telefone: '(15) 99999-0000',
  cargo: 'Operadora',
  horarioEntrada: '08:00',
  horarioSaida: '17:00',
};
// The form also carries the login and the branch; they must not reach the operator routes.
const values = { ...fields, usuario: 'ana.souza', senha: 'segredo123', filialId: 'f9' };

const employee = { id: 'o1', matricula: 'EMP-001', ...fields, filialId: 'f1', usuario: null, acesso: 'Negado' };

describe('operatorService', () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    post.mockReset();
    del.mockReset();
  });

  it('listar gets /operators and returns the response body', async () => {
    get.mockResolvedValue({ data: [employee] });

    const result = await operatorService.listar();

    expect(get).toHaveBeenCalledWith('/operators');
    expect(result).toEqual([employee]);
  });

  it('listar(filialId) sends the filialId as a query param', async () => {
    get.mockResolvedValue({ data: [employee] });

    const result = await operatorService.listar('f1');

    expect(get).toHaveBeenCalledWith('/operators', { params: { filialId: 'f1' } });
    expect(result).toEqual([employee]);
  });

  it('criar posts the five operator fields, the branch and the login on /operators', async () => {
    post.mockResolvedValue({ data: employee });

    const result = await operatorService.criar(values, 'f2');

    expect(post).toHaveBeenCalledWith('/operators', { ...fields, filialId: 'f2', usuario: 'ana.souza', senha: 'segredo123' });
    expect(result).toEqual(employee);
  });

  it('criar without a branch leaves filialId out of the body', async () => {
    post.mockResolvedValue({ data: employee });

    await operatorService.criar(values);

    expect(post).toHaveBeenCalledWith('/operators', { ...fields, usuario: 'ana.souza', senha: 'segredo123' });
  });

  it('criar without usuario leaves the login out of the body', async () => {
    post.mockResolvedValue({ data: employee });

    await operatorService.criar({ ...values, usuario: '', senha: '' });

    expect(post).toHaveBeenCalledWith('/operators', fields);
  });

  it('atualizar puts only the five operator fields on /operators/:id', async () => {
    put.mockResolvedValue({ data: { ...employee, nome: 'Ana S.' } });

    const result = await operatorService.atualizar('o1', values);

    expect(put).toHaveBeenCalledWith('/operators/o1', fields);
    expect(result).toEqual({ ...employee, nome: 'Ana S.' });
  });

  it('remover deletes /operators/:id', async () => {
    del.mockResolvedValue({ data: { _id: 'o1', message: 'ok' } });

    await operatorService.remover('o1');

    expect(del).toHaveBeenCalledWith('/operators/o1');
  });

  it('remover propagates the API rejection', async () => {
    const err = new Error('409');
    del.mockRejectedValue(err);

    await expect(operatorService.remover('o1')).rejects.toBe(err);
  });

  it('criarLogin posts usuario and senha on /operators/:id/login and returns the operator', async () => {
    const withLogin = { ...employee, usuario: 'ana.souza', acesso: 'Permitido' };
    post.mockResolvedValue({ data: withLogin });

    const result = await operatorService.criarLogin('o1', 'ana.souza', 'segredo123');

    expect(post).toHaveBeenCalledWith('/operators/o1/login', { usuario: 'ana.souza', senha: 'segredo123' });
    expect(result).toEqual(withLogin);
  });

  it('atualizarLogin puts the new password on /operators/:id/login', async () => {
    put.mockResolvedValue({ data: employee });

    await operatorService.atualizarLogin('o1', { senha: 'novaSenha1' });

    expect(put).toHaveBeenCalledWith('/operators/o1/login', { senha: 'novaSenha1' });
  });

  it('atualizarLogin puts acessoNegado and returns the operator', async () => {
    const denied = { ...employee, usuario: 'ana.souza', acesso: 'Negado' };
    put.mockResolvedValue({ data: denied });

    const result = await operatorService.atualizarLogin('o1', { acessoNegado: true });

    expect(put).toHaveBeenCalledWith('/operators/o1/login', { acessoNegado: true });
    expect(result).toEqual(denied);
  });
});
