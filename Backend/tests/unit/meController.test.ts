import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { atualizar, excluir } from "../../src/feature/me/meController.js";
import meRouter from "../../src/feature/me/meRouter.js";
import * as meService from "../../src/feature/me/meService.js";
import { ErroHttp, StatusCode } from "../../src/utils/responseHandler.js";
import type { Escopo } from "../../src/core/escopo.js";

vi.mock("../../src/feature/me/meService.js", async (original) => {
  const orig = (await original()) as typeof meService;
  return {
    ...orig,
    atualizarConta: vi.fn(),
    excluirConta: vi.fn(),
  };
});

const usuario = {
  _id: "665f1c2b9a1e4b0012345678",
  role: "admin",
  operadorId: null,
};
const escopo: Escopo = {
  empresaId: "665f1c2b9a1e4b00123456a0",
  tipo: "empresa",
  filiais: [],
};

describe("meController", () => {
  let json: ReturnType<typeof vi.fn>;
  let status: ReturnType<typeof vi.fn>;
  let res: Response;

  const req = (extra: object = {}) =>
    ({
      escopo,
      usuario,
      params: {},
      body: {},
      query: {},
      ...extra,
    }) as unknown as Request;

  const respondeu = (codigo: number, corpo: unknown) => {
    expect(status).toHaveBeenCalledWith(codigo);
    expect(json).toHaveBeenCalledWith(corpo);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    json = vi.fn();
    status = vi.fn().mockReturnValue({ json });
    res = { status, json } as unknown as Response;
  });

  describe("atualizar", () => {
    test("200 com { email } no sucesso", async () => {
      vi.mocked(meService.atualizarConta).mockResolvedValue({
        email: "novo@empresa.com",
      });

      await atualizar(
        req({
          body: {
            senhaAtual: "senha123",
            email: "novo@empresa.com",
          },
        }),
        res
      );

      expect(meService.atualizarConta).toHaveBeenCalledWith(usuario, {
        senhaAtual: "senha123",
        email: "novo@empresa.com",
      });
      respondeu(200, { email: "novo@empresa.com" });
    });

    test("repassa 400 para corpo inválido", async () => {
      await atualizar(
        req({
          body: {
            campoInvalido: "teste",
          },
        }),
        res
      );

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    test("repassa 403 do serviço", async () => {
      vi.mocked(meService.atualizarConta).mockRejectedValue(
        new ErroHttp(StatusCode.FORBIDDEN, "Senha atual incorreta.")
      );

      await atualizar(
        req({
          body: {
            senhaAtual: "senhaErrada",
            email: "novo@empresa.com",
          },
        }),
        res
      );

      respondeu(403, { error: "Senha atual incorreta." });
    });

    test("repassa 404 do serviço", async () => {
      vi.mocked(meService.atualizarConta).mockRejectedValue(
        new ErroHttp(StatusCode.NOT_FOUND, "Usuário não encontrado(a).")
      );

      await atualizar(
        req({
          body: {
            senhaAtual: "senha123",
            email: "novo@empresa.com",
          },
        }),
        res
      );

      respondeu(404, { error: "Usuário não encontrado(a)." });
    });

    test("repassa 409 do serviço", async () => {
      vi.mocked(meService.atualizarConta).mockRejectedValue(
        new ErroHttp(StatusCode.CONFLICT, "E-mail já em uso.")
      );

      await atualizar(
        req({
          body: {
            senhaAtual: "senha123",
            email: "ja_existe@empresa.com",
          },
        }),
        res
      );

      respondeu(409, { error: "E-mail já em uso." });
    });

    test("resposta de sucesso nunca contém senhaAtual, novaSenha ou senhaHash (PRF-23)", async () => {
      vi.mocked(meService.atualizarConta).mockResolvedValue({
        email: "novo@empresa.com",
      });

      await atualizar(
        req({
          body: {
            senhaAtual: "senha123",
            novaSenha: "novaSenhaSegura123",
          },
        }),
        res
      );

      expect(status).toHaveBeenCalledWith(200);
      const corpoResposta = json.mock.calls[0][0];
      expect(corpoResposta).toEqual({ email: "novo@empresa.com" });
      expect(corpoResposta).not.toHaveProperty("senhaAtual");
      expect(corpoResposta).not.toHaveProperty("novaSenha");
      expect(corpoResposta).not.toHaveProperty("senhaHash");
    });
  });

  describe("excluir", () => {
    test("200 com _id e mensagem de sucesso", async () => {
      vi.mocked(meService.excluirConta).mockResolvedValue();

      await excluir(
        req({
          body: {
            senhaAtual: "senha123",
          },
        }),
        res
      );

      expect(meService.excluirConta).toHaveBeenCalledWith(
        usuario,
        escopo.empresaId,
        "senha123"
      );
      respondeu(200, {
        _id: usuario._id,
        message: "Conta excluída com sucesso.",
      });
    });

    test("repassa 400 quando senhaAtual não é informada", async () => {
      await excluir(
        req({
          body: {},
        }),
        res
      );

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    test("repassa 403 do serviço", async () => {
      vi.mocked(meService.excluirConta).mockRejectedValue(
        new ErroHttp(StatusCode.FORBIDDEN, "Senha atual incorreta.")
      );

      await excluir(
        req({
          body: {
            senhaAtual: "senhaErrada",
          },
        }),
        res
      );

      respondeu(403, { error: "Senha atual incorreta." });
    });

    test("repassa 409 do serviço", async () => {
      vi.mocked(meService.excluirConta).mockRejectedValue(
        new ErroHttp(
          StatusCode.CONFLICT,
          "Você é o único administrador da empresa."
        )
      );

      await excluir(
        req({
          body: {
            senhaAtual: "senha123",
          },
        }),
        res
      );

      respondeu(409, {
        error: "Você é o único administrador da empresa.",
      });
    });
  });

  describe("rotas registradas (meRouter)", () => {
    test("confere rotas registradas em meRouter", () => {
      const rotas = meRouter.stack.map((c: any) => [
        Object.keys(c.route.methods)[0],
        c.route.path,
      ]);
      expect(rotas).toEqual([
        ["put", "/"],
        ["delete", "/"],
      ]);
    });
  });
});
