import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import {
  listar,
  aprovar,
  recusar,
  gerarSenhaInicial,
} from '../../src/feature/accessRequest/accessRequestService.js';
import { AccessRequest } from '../../src/schemas/accessRequest.js';
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';
import { User } from '../../src/schemas/user.js';
import { MATRIZ_NOME } from '../../src/scripts/seedDataset.js';
import { verificarSenha } from '../../src/utils/senha.js';
import { ErroHttp, StatusCode } from '../../src/utils/responseHandler.js';

vi.mock('../../src/schemas/accessRequest.js', () => ({
  AccessRequest: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    exists: vi.fn(),
  },
}));

vi.mock('../../src/schemas/company.js', () => ({
  Company: {
    create: vi.fn(),
    deleteOne: vi.fn(),
    exists: vi.fn(),
  },
}));

vi.mock('../../src/schemas/branch.js', () => ({
  Branch: {
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('../../src/schemas/user.js', () => ({
  User: {
    create: vi.fn(),
    deleteOne: vi.fn(),
    exists: vi.fn(),
  },
}));

describe('accessRequestService', () => {
  const ID = new Types.ObjectId().toHexString();
  const EMPRESA_ID = new Types.ObjectId().toHexString();
  const BRANCH_ID = new Types.ObjectId().toHexString();
  const USER_ID = new Types.ObjectId().toHexString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listar (ACCR-01)', () => {
    test('sem status busca pendentes da mais antiga para a mais nova (FIFO, createdAt: 1)', async () => {
      const lean = vi.fn().mockResolvedValue([{ _id: '1', status: 'pendente' }]);
      const sort = vi.fn().mockReturnValue({ lean });
      vi.mocked(AccessRequest.find).mockReturnValue({ sort } as any);

      const res = await listar();

      expect(AccessRequest.find).toHaveBeenCalledWith({ status: 'pendente' });
      expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(res).toEqual([{ _id: '1', status: 'pendente' }]);
    });

    test.each(['pendente', 'aprovada', 'recusada'] as const)(
      'com status %s filtra pelo status e ordena da mais recente para a mais antiga (createdAt: -1)',
      async (status) => {
        const lean = vi.fn().mockResolvedValue([{ _id: '1', status }]);
        const sort = vi.fn().mockReturnValue({ lean });
        vi.mocked(AccessRequest.find).mockReturnValue({ sort } as any);

        const res = await listar(status);

        expect(AccessRequest.find).toHaveBeenCalledWith({ status });
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(res).toEqual([{ _id: '1', status }]);
      }
    );
  });

  describe('gerarSenhaInicial (ACCR-03)', () => {
    test('gera senha inicial de 12 caracteres base64url', () => {
      const senha = gerarSenhaInicial();
      expect(typeof senha).toBe('string');
      expect(senha).toHaveLength(12);
    });
  });

  describe('aprovar (ACCR-03, ACCR-04)', () => {
    const pendenteDoc = {
      _id: ID,
      email: ' admin@empresa.com ',
      nomeEmpresa: '  Empresa XPTO  ',
      nomeAdministrador: '  Administrador XPTO  ',
      status: 'pendente',
    };

    function mockClaimSucesso() {
      const lean = vi.fn().mockResolvedValue({
        ...pendenteDoc,
        status: 'aprovando',
      });
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({ lean } as any);
    }

    test('ACCR-03 AC1/AC2/AC3: aprovação com claim, criação de company, branch matriz e user admin', async () => {
      mockClaimSucesso();
      vi.mocked(User.exists).mockResolvedValue(null as any);
      vi.mocked(Company.exists).mockResolvedValue(null as any);
      vi.mocked(Company.create).mockResolvedValue({ _id: EMPRESA_ID, nome: 'Empresa XPTO' } as any);
      vi.mocked(Branch.create).mockResolvedValue({ _id: BRANCH_ID, nome: MATRIZ_NOME, empresaId: EMPRESA_ID, matriz: true } as any);
      vi.mocked(User.create).mockResolvedValue({ _id: USER_ID, nome: 'Administrador XPTO', email: 'admin@empresa.com' } as any);

      const aprovadaFinal = {
        _id: ID,
        email: 'admin@empresa.com',
        nomeEmpresa: 'Empresa XPTO',
        nomeAdministrador: 'Administrador XPTO',
        status: 'aprovada',
        empresaId: EMPRESA_ID,
        decididaEm: new Date(),
      };
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(aprovadaFinal),
      } as any);

      const resultado = await aprovar(ID);

      // Claim exigiu status: 'pendente'
      expect(AccessRequest.findOneAndUpdate).toHaveBeenNthCalledWith(
        1,
        { _id: ID, status: 'pendente' },
        { $set: { status: 'aprovando' } },
        { returnDocument: 'after' }
      );

      // Company.create com nome cortado
      expect(Company.create).toHaveBeenCalledWith({ nome: 'Empresa XPTO' });

      // Branch.create com MATRIZ_NOME ('Matriz') e matriz: true
      expect(Branch.create).toHaveBeenCalledWith({
        nome: 'Matriz',
        empresaId: EMPRESA_ID,
        matriz: true,
      });

      // User.create com role admin, escopo empresa, senhaHash e sem senha em texto
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Administrador XPTO',
          email: 'admin@empresa.com',
          role: 'admin',
          escopo: 'empresa',
          empresaId: EMPRESA_ID,
          senhaHash: expect.any(String),
        })
      );
      const userArgs = vi.mocked(User.create).mock.calls[0]![0] as any;
      expect(userArgs.senha).toBeUndefined();
      expect(userArgs.senhaInicial).toBeUndefined();

      // Senha inicial de 12 caracteres e que confere com o hash gravado
      expect(resultado.senhaInicial).toHaveLength(12);
      expect(verificarSenha(resultado.senhaInicial, userArgs.senhaHash)).toBe(true);

      // Resposta tem os campos de aprovação e a senhaInicial
      expect(resultado).toMatchObject({
        _id: ID,
        status: 'aprovada',
        empresaId: EMPRESA_ID,
        senhaInicial: resultado.senhaInicial,
      });
      expect(resultado.decididaEm).toBeDefined();
    });

    test('ACCR-04 AC4: usuário com mesmo e-mail já existe -> 409, nenhum create, claim volta a pendente', async () => {
      mockClaimSucesso();
      vi.mocked(User.exists).mockResolvedValue({ _id: USER_ID } as any);
      vi.mocked(AccessRequest.updateOne).mockResolvedValue({} as any);

      await expect(aprovar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.CONFLICT, 'Já existe um usuário com este e-mail.')
      );

      expect(Company.create).not.toHaveBeenCalled();
      expect(Branch.create).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(AccessRequest.updateOne).toHaveBeenCalledWith(
        { _id: ID, status: 'aprovando' },
        { $set: { status: 'pendente' } }
      );
    });

    test('ACCR-04 AC5: empresa com mesmo nome já existe -> 409, nenhum create, claim volta a pendente', async () => {
      mockClaimSucesso();
      vi.mocked(User.exists).mockResolvedValue(null as any);
      vi.mocked(Company.exists).mockResolvedValue({ _id: EMPRESA_ID } as any);
      vi.mocked(AccessRequest.updateOne).mockResolvedValue({} as any);

      await expect(aprovar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.CONFLICT, 'Já existe uma empresa com este nome.')
      );

      expect(Company.create).not.toHaveBeenCalled();
      expect(Branch.create).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(AccessRequest.updateOne).toHaveBeenCalledWith(
        { _id: ID, status: 'aprovando' },
        { $set: { status: 'pendente' } }
      );
    });

    test('ACCR-04 AC6: falha em Branch.create apaga company e devolve claim a pendente', async () => {
      mockClaimSucesso();
      vi.mocked(User.exists).mockResolvedValue(null as any);
      vi.mocked(Company.exists).mockResolvedValue(null as any);
      vi.mocked(Company.create).mockResolvedValue({ _id: EMPRESA_ID } as any);
      vi.mocked(Branch.create).mockRejectedValue(new Error('Erro no branch'));
      vi.mocked(Company.deleteOne).mockResolvedValue({} as any);
      vi.mocked(AccessRequest.updateOne).mockResolvedValue({} as any);

      await expect(aprovar(ID)).rejects.toThrow('Erro no branch');

      expect(Company.deleteOne).toHaveBeenCalledWith({ _id: EMPRESA_ID });
      expect(User.deleteOne).not.toHaveBeenCalled();
      expect(AccessRequest.updateOne).toHaveBeenCalledWith(
        { _id: ID, status: 'aprovando' },
        { $set: { status: 'pendente' } }
      );
    });

    test('ACCR-04 AC6: falha em User.create apaga branch e company e devolve claim a pendente', async () => {
      mockClaimSucesso();
      vi.mocked(User.exists).mockResolvedValue(null as any);
      vi.mocked(Company.exists).mockResolvedValue(null as any);
      vi.mocked(Company.create).mockResolvedValue({ _id: EMPRESA_ID } as any);
      vi.mocked(Branch.create).mockResolvedValue({ _id: BRANCH_ID } as any);
      vi.mocked(User.create).mockRejectedValue(new Error('Erro no user'));
      vi.mocked(Branch.deleteOne).mockResolvedValue({} as any);
      vi.mocked(Company.deleteOne).mockResolvedValue({} as any);
      vi.mocked(AccessRequest.updateOne).mockResolvedValue({} as any);

      await expect(aprovar(ID)).rejects.toThrow('Erro no user');

      expect(Branch.deleteOne).toHaveBeenCalledWith({ _id: BRANCH_ID });
      expect(Company.deleteOne).toHaveBeenCalledWith({ _id: EMPRESA_ID });
      expect(AccessRequest.updateOne).toHaveBeenCalledWith(
        { _id: ID, status: 'aprovando' },
        { $set: { status: 'pendente' } }
      );
    });

    test('ACCR-04 AC6: erro 11000 em Company.create vira 409 e claim volta a pendente', async () => {
      mockClaimSucesso();
      vi.mocked(User.exists).mockResolvedValue(null as any);
      vi.mocked(Company.exists).mockResolvedValue(null as any);
      const dupError = Object.assign(new Error('duplicate key'), { code: 11000 });
      vi.mocked(Company.create).mockRejectedValue(dupError);
      vi.mocked(AccessRequest.updateOne).mockResolvedValue({} as any);

      await expect(aprovar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.CONFLICT, 'Já existe uma empresa com este nome.')
      );

      expect(AccessRequest.updateOne).toHaveBeenCalledWith(
        { _id: ID, status: 'aprovando' },
        { $set: { status: 'pendente' } }
      );
    });

    test('ACCR-04 AC6: erro 11000 em User.create vira 409, apaga branch e company, e claim volta a pendente', async () => {
      mockClaimSucesso();
      vi.mocked(User.exists).mockResolvedValue(null as any);
      vi.mocked(Company.exists).mockResolvedValue(null as any);
      vi.mocked(Company.create).mockResolvedValue({ _id: EMPRESA_ID } as any);
      vi.mocked(Branch.create).mockResolvedValue({ _id: BRANCH_ID } as any);
      const dupError = Object.assign(new Error('duplicate key'), { code: 11000 });
      vi.mocked(User.create).mockRejectedValue(dupError);
      vi.mocked(Branch.deleteOne).mockResolvedValue({} as any);
      vi.mocked(Company.deleteOne).mockResolvedValue({} as any);
      vi.mocked(AccessRequest.updateOne).mockResolvedValue({} as any);

      await expect(aprovar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.CONFLICT, 'Já existe um usuário com este e-mail.')
      );

      expect(Branch.deleteOne).toHaveBeenCalledWith({ _id: BRANCH_ID });
      expect(Company.deleteOne).toHaveBeenCalledWith({ _id: EMPRESA_ID });
      expect(AccessRequest.updateOne).toHaveBeenCalledWith(
        { _id: ID, status: 'aprovando' },
        { $set: { status: 'pendente' } }
      );
    });

    test('ACCR-04 AC7/AC8: claim nulo com solicitação existente -> 409 Solicitação já decidida.', async () => {
      // Prova da corrida: filtro exige status: 'pendente'. Se o claim vem null, checa exists.
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      } as any);
      vi.mocked(AccessRequest.exists).mockResolvedValue({ _id: ID } as any);

      await expect(aprovar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.CONFLICT, 'Solicitação já decidida.')
      );

      expect(AccessRequest.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ID, status: 'pendente' },
        { $set: { status: 'aprovando' } },
        { returnDocument: 'after' }
      );
      expect(AccessRequest.exists).toHaveBeenCalledWith({ _id: ID });
      expect(Company.create).not.toHaveBeenCalled();
    });

    test('ACCR-04 AC7: claim nulo sem solicitação no banco -> 404 Solicitação não encontrada.', async () => {
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      } as any);
      vi.mocked(AccessRequest.exists).mockResolvedValue(null as any);

      await expect(aprovar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.NOT_FOUND, 'Solicitação não encontrada.')
      );

      expect(Company.create).not.toHaveBeenCalled();
    });

    test('Edge: nomeEmpresa cortado na checagem e na criação', async () => {
      const lean = vi.fn().mockResolvedValue({
        ...pendenteDoc,
        nomeEmpresa: '   Empresa Com Espaços   ',
        status: 'aprovando',
      });
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({ lean } as any);
      vi.mocked(User.exists).mockResolvedValue(null as any);
      vi.mocked(Company.exists).mockResolvedValue(null as any);
      vi.mocked(Company.create).mockResolvedValue({ _id: EMPRESA_ID } as any);
      vi.mocked(Branch.create).mockResolvedValue({ _id: BRANCH_ID } as any);
      vi.mocked(User.create).mockResolvedValue({ _id: USER_ID } as any);
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({ _id: ID, status: 'aprovada' }),
      } as any);

      await aprovar(ID);

      expect(Company.exists).toHaveBeenCalledWith({ nome: 'Empresa Com Espaços' });
      expect(Company.create).toHaveBeenCalledWith({ nome: 'Empresa Com Espaços' });
    });
  });

  describe('recusar (ACCR-06)', () => {
    test('ACCR-06 AC1/AC2: recusa com motivo grava status recusada, decididaEm e motivo cortado', async () => {
      const recusadaDoc = {
        _id: ID,
        status: 'recusada',
        decididaEm: new Date(),
        motivoRecusa: 'Empresa não qualificada',
      };
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(recusadaDoc),
      } as any);

      const res = await recusar(ID, '  Empresa não qualificada  ');

      expect(AccessRequest.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ID, status: 'pendente' },
        {
          $set: {
            status: 'recusada',
            decididaEm: expect.any(Date),
            motivoRecusa: 'Empresa não qualificada',
          },
        },
        { returnDocument: 'after' }
      );
      expect(Company.create).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(res).toEqual(recusadaDoc);
    });

    test('ACCR-06 AC1/AC2: recusa sem motivo (ou vazio) não grava motivoRecusa', async () => {
      const recusadaDoc = {
        _id: ID,
        status: 'recusada',
        decididaEm: new Date(),
      };
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(recusadaDoc),
      } as any);

      await recusar(ID, '   ');

      expect(AccessRequest.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ID, status: 'pendente' },
        {
          $set: {
            status: 'recusada',
            decididaEm: expect.any(Date),
          },
        },
        { returnDocument: 'after' }
      );
      const setArg = vi.mocked(AccessRequest.findOneAndUpdate).mock.calls[0]![1] as any;
      expect(setArg.$set.motivoRecusa).toBeUndefined();
    });

    test('ACCR-06 AC4: recusa de solicitação já decidida -> 409', async () => {
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      } as any);
      vi.mocked(AccessRequest.exists).mockResolvedValue({ _id: ID } as any);

      await expect(recusar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.CONFLICT, 'Solicitação já decidida.')
      );
    });

    test('ACCR-06 AC4: recusa de solicitação inexistente -> 404', async () => {
      vi.mocked(AccessRequest.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      } as any);
      vi.mocked(AccessRequest.exists).mockResolvedValue(null as any);

      await expect(recusar(ID)).rejects.toThrow(
        new ErroHttp(StatusCode.NOT_FOUND, 'Solicitação não encontrada.')
      );
    });
  });
});
