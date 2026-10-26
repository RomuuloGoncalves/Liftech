import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  criar,
  listar,
  aprovar,
  recusar,
} from '../../src/feature/accessRequest/accessRequestController.js';
import { AccessRequest } from '../../src/schemas/accessRequest.js';
import * as servicoAccessRequest from '../../src/feature/accessRequest/accessRequestService.js';
import { ErroHttp, StatusCode } from '../../src/utils/responseHandler.js';

vi.mock('../../src/schemas/accessRequest.js', () => ({
  AccessRequest: { findOne: vi.fn(), create: vi.fn() },
}));

vi.mock('../../src/feature/accessRequest/accessRequestService.js', () => ({
  listar: vi.fn(),
  aprovar: vi.fn(),
  recusar: vi.fn(),
}));

const findOne = vi.mocked(AccessRequest.findOne) as unknown as ReturnType<typeof vi.fn>;
const create = vi.mocked(AccessRequest.create) as unknown as ReturnType<typeof vi.fn>;

const valido = {
  email: '  Ana@Empresa.COM ',
  nomeEmpresa: ' Acme ',
  nomeAdministrador: ' Ana ',
};

describe('accessRequestController', () => {
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let res: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    res = { status: mockStatus, json: mockJson } as unknown as Response;
  });

  describe('criar', () => {
    const chamar = (body: unknown) => criar({ body } as Request, res);
    const pendente = (doc: unknown) =>
      findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(doc) });

    test('201 com o documento criado e email normalizado', async () => {
      pendente(null);
      const criado = {
        _id: '1',
        email: 'ana@empresa.com',
        nomeEmpresa: 'Acme',
        nomeAdministrador: 'Ana',
        status: 'pendente',
      };
      create.mockResolvedValue({ toObject: () => criado });

      await chamar(valido);

      expect(findOne).toHaveBeenCalledWith({ email: 'ana@empresa.com', status: 'pendente' });
      expect(create).toHaveBeenCalledWith({
        email: 'ana@empresa.com',
        nomeEmpresa: 'Acme',
        nomeAdministrador: 'Ana',
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(criado);
    });

    test.each([
      ['email ausente', { ...valido, email: undefined }],
      ['email vazio', { ...valido, email: '   ' }],
      ['email inválido', { ...valido, email: 'ana@empresa' }],
      ['nomeEmpresa ausente', { ...valido, nomeEmpresa: undefined }],
      ['nomeEmpresa vazio', { ...valido, nomeEmpresa: '  ' }],
      ['nomeAdministrador ausente', { ...valido, nomeAdministrador: undefined }],
      ['nomeAdministrador vazio', { ...valido, nomeAdministrador: '' }],
      ['body ausente', undefined],
    ])('400 quando %s', async (_caso, body) => {
      await chamar(body);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson.mock.calls[0]![0]).toHaveProperty('error');
      expect(create).not.toHaveBeenCalled();
    });

    test('409 quando já existe solicitação pendente', async () => {
      pendente({ _id: 'x' });

      await chamar(valido);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Já existe uma solicitação pendente para este email.',
      });
      expect(create).not.toHaveBeenCalled();
    });

    test('500 quando create rejeita', async () => {
      pendente(null);
      create.mockRejectedValue(new Error('falha'));

      await chamar(valido);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'falha' });
    });
  });

  describe('listar (ACCR-01)', () => {
    test('200 sem status chama o service sem parâmetros', async () => {
      const mockLista = [{ _id: '1', status: 'pendente' }];
      vi.mocked(servicoAccessRequest.listar).mockResolvedValue(mockLista as any);

      await listar({ query: {} } as Request, res);

      expect(servicoAccessRequest.listar).toHaveBeenCalledWith(undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockLista);
    });

    test.each(['pendente', 'aprovada', 'recusada'] as const)(
      '200 com status %s chama o service com o status',
      async (status) => {
        const mockLista = [{ _id: '1', status }];
        vi.mocked(servicoAccessRequest.listar).mockResolvedValue(mockLista as any);

        await listar({ query: { status } } as unknown as Request, res);

        expect(servicoAccessRequest.listar).toHaveBeenCalledWith(status);
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(mockLista);
      }
    );

    test.each([
      ['status desconhecido', 'xyz'],
      ['status interno aprovando', 'aprovando'],
      ['status array', ['pendente', 'aprovada']],
    ])('400 quando %s', async (_caso, status) => {
      await listar({ query: { status } } as unknown as Request, res);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "O campo 'status' deve ser pendente, aprovada ou recusada.",
      });
      expect(servicoAccessRequest.listar).not.toHaveBeenCalled();
    });

    test('500 quando o service falha', async () => {
      vi.mocked(servicoAccessRequest.listar).mockRejectedValue(new Error('Erro no banco'));

      await listar({ query: {} } as Request, res);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro no banco' });
    });
  });

  describe('aprovar (ACCR-03, ACCR-04)', () => {
    const validId = new Types.ObjectId().toHexString();

    test('200 com o retorno do service', async () => {
      const retornoService = {
        _id: validId,
        status: 'aprovada',
        empresaId: 'emp1',
        decididaEm: new Date(),
        senhaInicial: 'abc123xyz456',
      };
      vi.mocked(servicoAccessRequest.aprovar).mockResolvedValue(retornoService as any);

      await aprovar({ params: { id: validId } } as unknown as Request, res);

      expect(servicoAccessRequest.aprovar).toHaveBeenCalledWith(validId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(retornoService);
    });

    test.each(['id-invalido', '123', ''])(
      '400 para id inválido: %s',
      async (id) => {
        await aprovar({ params: { id } } as unknown as Request, res);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          error: 'O ID fornecido não é um ObjectId válido do MongoDB.',
        });
        expect(servicoAccessRequest.aprovar).not.toHaveBeenCalled();
      }
    );

    test('404 repassado do ErroHttp', async () => {
      vi.mocked(servicoAccessRequest.aprovar).mockRejectedValue(
        new ErroHttp(StatusCode.NOT_FOUND, 'Solicitação não encontrada.')
      );

      await aprovar({ params: { id: validId } } as unknown as Request, res);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Solicitação não encontrada.' });
    });

    test('409 repassado do ErroHttp (conflito ou já decidida)', async () => {
      vi.mocked(servicoAccessRequest.aprovar).mockRejectedValue(
        new ErroHttp(StatusCode.CONFLICT, 'Já existe um usuário com este e-mail.')
      );

      await aprovar({ params: { id: validId } } as unknown as Request, res);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Já existe um usuário com este e-mail.',
      });
    });

    test('500 para erro genérico', async () => {
      vi.mocked(servicoAccessRequest.aprovar).mockRejectedValue(new Error('Crash inesperado'));

      await aprovar({ params: { id: validId } } as unknown as Request, res);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Crash inesperado' });
    });
  });

  describe('recusar (ACCR-06)', () => {
    const validId = new Types.ObjectId().toHexString();

    test('200 com motivo cortado antes de chamar o service', async () => {
      const retornoService = {
        _id: validId,
        status: 'recusada',
        decididaEm: new Date(),
        motivoRecusa: 'Perfil não compatível',
      };
      vi.mocked(servicoAccessRequest.recusar).mockResolvedValue(retornoService as any);

      await recusar(
        {
          params: { id: validId },
          body: { motivo: '  Perfil não compatível  ' },
        } as unknown as Request,
        res
      );

      expect(servicoAccessRequest.recusar).toHaveBeenCalledWith(validId, 'Perfil não compatível');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(retornoService);
    });

    test.each([
      ['motivo ausente', {}],
      ['motivo null', { motivo: null }],
      ['motivo vazio', { motivo: '' }],
      ['motivo só espaços', { motivo: '    ' }],
    ])('200 quando %s: vira sem motivo (undefined)', async (_caso, body) => {
      const retornoService = { _id: validId, status: 'recusada', decididaEm: new Date() };
      vi.mocked(servicoAccessRequest.recusar).mockResolvedValue(retornoService as any);

      await recusar({ params: { id: validId }, body } as unknown as Request, res);

      expect(servicoAccessRequest.recusar).toHaveBeenCalledWith(validId, undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(retornoService);
    });

    test.each([
      ['motivo numérico', 12345],
      ['motivo booleano', true],
      ['motivo com mais de 200 caracteres', 'a'.repeat(201)],
    ])('400 quando %s', async (_caso, motivo) => {
      await recusar(
        {
          params: { id: validId },
          body: { motivo },
        } as unknown as Request,
        res
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "O campo 'motivo' deve ser texto de até 200 caracteres.",
      });
      expect(servicoAccessRequest.recusar).not.toHaveBeenCalled();
    });

    test('400 para id inválido', async () => {
      await recusar(
        {
          params: { id: 'invalido' },
          body: { motivo: 'valido' },
        } as unknown as Request,
        res
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'O ID fornecido não é um ObjectId válido do MongoDB.',
      });
      expect(servicoAccessRequest.recusar).not.toHaveBeenCalled();
    });

    test('404 repassado do ErroHttp', async () => {
      vi.mocked(servicoAccessRequest.recusar).mockRejectedValue(
        new ErroHttp(StatusCode.NOT_FOUND, 'Solicitação não encontrada.')
      );

      await recusar(
        {
          params: { id: validId },
          body: {},
        } as unknown as Request,
        res
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Solicitação não encontrada.' });
    });

    test('409 repassado do ErroHttp', async () => {
      vi.mocked(servicoAccessRequest.recusar).mockRejectedValue(
        new ErroHttp(StatusCode.CONFLICT, 'Solicitação já decidida.')
      );

      await recusar(
        {
          params: { id: validId },
          body: {},
        } as unknown as Request,
        res
      );

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Solicitação já decidida.' });
    });

    test('500 para erro genérico', async () => {
      vi.mocked(servicoAccessRequest.recusar).mockRejectedValue(new Error('Erro interno'));

      await recusar(
        {
          params: { id: validId },
          body: {},
        } as unknown as Request,
        res
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno' });
    });
  });
});
