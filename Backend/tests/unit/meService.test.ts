import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validarAtualizacao,
  validarExclusao,
  atualizarConta,
  excluirConta,
  REGEX_EMAIL,
} from "../../src/feature/me/meService.js";
import { ErroHttp, StatusCode } from "../../src/utils/responseHandler.js";
import { User } from "../../src/schemas/user.js";
import { gerarHashSenha, verificarSenha } from "../../src/utils/senha.js";

vi.mock("../../src/schemas/user.js", () => ({
  User: {
    findById: vi.fn(),
    updateOne: vi.fn(),
    countDocuments: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

describe("meService - validação", () => {
  describe("REGEX_EMAIL", () => {
    it("valida formatos válidos de email", () => {
      expect(REGEX_EMAIL.test("admin@empresa.com")).toBe(true);
      expect(REGEX_EMAIL.test("usuario.teste@sub.dominio.org")).toBe(true);
    });

    it("rejeita formatos inválidos de email", () => {
      expect(REGEX_EMAIL.test("invalido")).toBe(false);
      expect(REGEX_EMAIL.test("sem-arroba.com")).toBe(false);
      expect(REGEX_EMAIL.test("@sem-usuario.com")).toBe(false);
      expect(REGEX_EMAIL.test("usuario@")).toBe(false);
    });
  });

  describe("validarAtualizacao", () => {
    it("devolve senhaAtual e email normalizado em trim() e toLowerCase()", () => {
      const resultado = validarAtualizacao({
        senhaAtual: "senha123",
        email: "  NovoEmail@Empresa.COM  ",
      });
      expect(resultado).toEqual({
        senhaAtual: "senha123",
        email: "novoemail@empresa.com",
      });
    });

    it("devolve senhaAtual e novaSenha quando apenas novaSenha é fornecida", () => {
      const resultado = validarAtualizacao({
        senhaAtual: "senha123",
        novaSenha: "novaSenhaSegura1",
      });
      expect(resultado).toEqual({
        senhaAtual: "senha123",
        novaSenha: "novaSenhaSegura1",
      });
    });

    it("aceita novaSenha com exatamente 8 caracteres", () => {
      const resultado = validarAtualizacao({
        senhaAtual: "senha123",
        novaSenha: "12345678",
      });
      expect(resultado.novaSenha).toBe("12345678");
    });

    it("devolve ambos email e novaSenha quando fornecidos", () => {
      const resultado = validarAtualizacao({
        senhaAtual: "senha123",
        email: "admin@empresa.com",
        novaSenha: "12345678",
      });
      expect(resultado).toEqual({
        senhaAtual: "senha123",
        email: "admin@empresa.com",
        novaSenha: "12345678",
      });
    });

    it("lança 400 para corpo que não é objeto", () => {
      expect(() => validarAtualizacao(null)).toThrow(ErroHttp);
      expect(() => validarAtualizacao(null)).toThrow("Corpo de requisição inválido.");
      expect(() => validarAtualizacao("string")).toThrow(ErroHttp);
      expect(() => validarAtualizacao(["array"])).toThrow(ErroHttp);
    });

    it("lança 400 para chave fora de senhaAtual|email|novaSenha (incluindo _id)", () => {
      try {
        validarAtualizacao({
          senhaAtual: "senha123",
          email: "admin@empresa.com",
          _id: "60c72b2f9b1d8b001c8e4d2a",
        });
        expect.unreachable("deveria lançar ErroHttp");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.BAD_REQUEST);
        expect(err.message).toBe("O campo '_id' não é permitido.");
      }
    });

    it("lança 400 para chave com operador Mongo ($set)", () => {
      expect(() =>
        validarAtualizacao({
          $set: { role: "superadmin" },
        })
      ).toThrow(ErroHttp);
    });

    it("lança 400 quando não tem email nem novaSenha", () => {
      try {
        validarAtualizacao({
          senhaAtual: "senha123",
        });
        expect.unreachable("deveria lançar ErroHttp");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.BAD_REQUEST);
        expect(err.message).toBe("É necessário informar 'email' ou 'novaSenha' para atualização.");
      }
    });

    it("lança 400 para senhaAtual vazia, em branco ou não texto", () => {
      expect(() => validarAtualizacao({ senhaAtual: "", email: "a@b.com" })).toThrow(ErroHttp);
      expect(() => validarAtualizacao({ senhaAtual: "   ", email: "a@b.com" })).toThrow(ErroHttp);
      expect(() => validarAtualizacao({ senhaAtual: 12345 as any, email: "a@b.com" })).toThrow(ErroHttp);
      expect(() => validarAtualizacao({ email: "a@b.com" })).toThrow(ErroHttp);
    });

    it("lança 400 para email inválido ou não texto", () => {
      expect(() => validarAtualizacao({ senhaAtual: "123", email: "invalido" })).toThrow(ErroHttp);
      expect(() => validarAtualizacao({ senhaAtual: "123", email: 12345 as any })).toThrow(ErroHttp);
      expect(() => validarAtualizacao({ senhaAtual: "123", email: "sem-arroba.com" })).toThrow(ErroHttp);
    });

    it("lança 400 para novaSenha com menos de 8 caracteres ou não texto", () => {
      expect(() => validarAtualizacao({ senhaAtual: "123", novaSenha: "1234567" })).toThrow(ErroHttp);
      expect(() => validarAtualizacao({ senhaAtual: "123", novaSenha: 12345678 as any })).toThrow(ErroHttp);
    });
  });

  describe("validarExclusao", () => {
    it("devolve senhaAtual para entrada válida", () => {
      const resultado = validarExclusao({ senhaAtual: "minhaSenhaSegura" });
      expect(resultado).toEqual({ senhaAtual: "minhaSenhaSegura" });
    });

    it("lança 400 para corpo que não é objeto", () => {
      expect(() => validarExclusao(null)).toThrow(ErroHttp);
      expect(() => validarExclusao("")).toThrow(ErroHttp);
    });

    it("lança 400 para chave não permitida no corpo de exclusão", () => {
      expect(() => validarExclusao({ senhaAtual: "123", outraChave: "teste" })).toThrow(ErroHttp);
    });

    it("lança 400 para senhaAtual ausente, vazia, com apenas espaços ou número", () => {
      expect(() => validarExclusao({})).toThrow(ErroHttp);
      expect(() => validarExclusao({ senhaAtual: "" })).toThrow(ErroHttp);
      expect(() => validarExclusao({ senhaAtual: "   " })).toThrow(ErroHttp);
      expect(() => validarExclusao({ senhaAtual: 123456 as any })).toThrow(ErroHttp);
    });
  });

  describe("atualizarConta", () => {
    const adminUsuario = {
      _id: "665f1c2b9a1e4b0012345678",
      role: "admin",
      operadorId: null,
    };

    const colaboradorUsuario = {
      _id: "665f1c2b9a1e4b0012345699",
      role: "colaborador",
      operadorId: "665f1c2b9a1e4b0012345688",
    };

    const senhaAtual = "senhaAntiga123";
    const hashSenhaAtual = gerarHashSenha(senhaAtual);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    function mockarUsuarioDb(usuario: Record<string, unknown> | null) {
      const lean = vi.fn().mockResolvedValue(usuario);
      const select = vi.fn().mockReturnValue({ lean });
      vi.mocked(User.findById).mockReturnValue({ select } as any);
      return { select, lean };
    }

    it("lança 403 para colaborador e não chama User.findById", async () => {
      try {
        await atualizarConta(colaboradorUsuario, {
          senhaAtual: "qualquer",
          email: "novo@empresa.com",
        });
        expect.unreachable("deveria lançar ErroHttp 403");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.FORBIDDEN);
        expect(User.findById).not.toHaveBeenCalled();
      }
    });

    it("lança 404 quando o usuário não é encontrado no banco", async () => {
      mockarUsuarioDb(null);

      await expect(
        atualizarConta(adminUsuario, {
          senhaAtual: "qualquer",
          email: "novo@empresa.com",
        })
      ).rejects.toThrow("Usuário não encontrado(a).");
    });

    it("lança 403 quando senhaAtual está incorreta e não chama updateOne", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        email: "atual@empresa.com",
        senhaHash: hashSenhaAtual,
      });

      try {
        await atualizarConta(adminUsuario, {
          senhaAtual: "senhaErrada",
          email: "novo@empresa.com",
        });
        expect.unreachable("deveria lançar ErroHttp 403");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.FORBIDDEN);
        expect(err.message).toBe("Senha atual incorreta.");
        expect(User.updateOne).not.toHaveBeenCalled();
      }
    });

    it("atualiza email com sucesso e devolve { email }", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        email: "atual@empresa.com",
        senhaHash: hashSenhaAtual,
      });
      vi.mocked(User.updateOne).mockResolvedValue({} as any);

      const resultado = await atualizarConta(adminUsuario, {
        senhaAtual,
        email: "novo@empresa.com",
      });

      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: adminUsuario._id },
        { $set: { email: "novo@empresa.com" } }
      );
      expect(resultado).toEqual({ email: "novo@empresa.com" });
    });

    it("atualiza novaSenha com sucesso com hash verificável e devolve email atual", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        email: "atual@empresa.com",
        senhaHash: hashSenhaAtual,
      });
      vi.mocked(User.updateOne).mockResolvedValue({} as any);

      const novaSenha = "novaSenhaForte123";
      const resultado = await atualizarConta(adminUsuario, {
        senhaAtual,
        novaSenha,
      });

      expect(User.updateOne).toHaveBeenCalled();
      const chamada = vi.mocked(User.updateOne).mock.calls[0];
      expect(chamada[0]).toEqual({ _id: adminUsuario._id });
      const setFields = (chamada[1] as any).$set;
      expect(setFields.senhaHash).toBeDefined();
      expect(setFields.senhaHash).not.toBe(novaSenha);
      expect(verificarSenha(novaSenha, setFields.senhaHash)).toBe(true);
      expect(resultado).toEqual({ email: "atual@empresa.com" });
    });

    it("lança 409 quando updateOne falha com código 11000 de email duplicado", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        email: "atual@empresa.com",
        senhaHash: hashSenhaAtual,
      });
      vi.mocked(User.updateOne).mockRejectedValue({ code: 11000 });

      try {
        await atualizarConta(adminUsuario, {
          senhaAtual,
          email: "ja_existe@empresa.com",
        });
        expect.unreachable("deveria lançar ErroHttp 409");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.CONFLICT);
        expect(err.message).toBe("E-mail já em uso.");
      }
    });

    it("atualiza com email igual ao atual e devolve 200 com o mesmo email", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        email: "mesmo@empresa.com",
        senhaHash: hashSenhaAtual,
      });
      vi.mocked(User.updateOne).mockResolvedValue({} as any);

      const resultado = await atualizarConta(adminUsuario, {
        senhaAtual,
        email: "mesmo@empresa.com",
      });

      expect(resultado).toEqual({ email: "mesmo@empresa.com" });
      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: adminUsuario._id },
        { $set: { email: "mesmo@empresa.com" } }
      );
    });
  });

  describe("excluirConta", () => {
    const adminUsuario = {
      _id: "665f1c2b9a1e4b0012345678",
      role: "admin",
      operadorId: null,
    };

    const colaboradorUsuario = {
      _id: "665f1c2b9a1e4b0012345699",
      role: "colaborador",
      operadorId: "665f1c2b9a1e4b0012345688",
    };

    const empresaId = "665f1c2b9a1e4b00123456a0";
    const senhaAtual = "senhaAntiga123";
    const hashSenhaAtual = gerarHashSenha(senhaAtual);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    function mockarUsuarioDb(usuario: Record<string, unknown> | null) {
      const lean = vi.fn().mockResolvedValue(usuario);
      const select = vi.fn().mockReturnValue({ lean });
      vi.mocked(User.findById).mockReturnValue({ select } as any);
      return { select, lean };
    }

    it("lança 403 para colaborador sem ler nem apagar", async () => {
      try {
        await excluirConta(colaboradorUsuario, empresaId, senhaAtual);
        expect.unreachable("deveria lançar ErroHttp 403");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.FORBIDDEN);
        expect(User.findById).not.toHaveBeenCalled();
        expect(User.deleteOne).not.toHaveBeenCalled();
      }
    });

    it("lança 404 quando usuário não é encontrado no banco", async () => {
      mockarUsuarioDb(null);

      await expect(
        excluirConta(adminUsuario, empresaId, senhaAtual)
      ).rejects.toThrow("Usuário não encontrado(a).");
    });

    it("lança 403 para senhaAtual errada e não chama deleteOne", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        senhaHash: hashSenhaAtual,
      });

      try {
        await excluirConta(adminUsuario, empresaId, "senhaIncorreta");
        expect.unreachable("deveria lançar ErroHttp 403");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.FORBIDDEN);
        expect(err.message).toBe("Senha atual incorreta.");
        expect(User.deleteOne).not.toHaveBeenCalled();
      }
    });

    it("lança 409 quando empresaId é ausente ou undefined sem chamar countDocuments nem deleteOne", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        senhaHash: hashSenhaAtual,
      });

      try {
        await excluirConta(adminUsuario, undefined, senhaAtual);
        expect.unreachable("deveria lançar ErroHttp 409");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.CONFLICT);
        expect(err.message).toBe("Você é o único administrador da empresa.");
        expect(User.countDocuments).not.toHaveBeenCalled();
        expect(User.deleteOne).not.toHaveBeenCalled();
      }
    });

    it("lança 409 quando countDocuments retorna 0 (único admin) sem chamar deleteOne", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        senhaHash: hashSenhaAtual,
      });
      vi.mocked(User.countDocuments).mockResolvedValue(0);

      try {
        await excluirConta(adminUsuario, empresaId, senhaAtual);
        expect.unreachable("deveria lançar ErroHttp 409");
      } catch (err: any) {
        expect(err).toBeInstanceOf(ErroHttp);
        expect(err.status).toBe(StatusCode.CONFLICT);
        expect(err.message).toBe("Você é o único administrador da empresa.");
        expect(User.countDocuments).toHaveBeenCalledWith({
          empresaId,
          role: "admin",
          _id: { $ne: adminUsuario._id },
          email: { $exists: true },
          acessoNegado: { $ne: true },
        });
        expect(User.deleteOne).not.toHaveBeenCalled();
      }
    });

    it("chama deleteOne quando countDocuments retorna ≥ 1", async () => {
      mockarUsuarioDb({
        _id: adminUsuario._id,
        role: "admin",
        senhaHash: hashSenhaAtual,
      });
      vi.mocked(User.countDocuments).mockResolvedValue(1);
      vi.mocked(User.deleteOne).mockResolvedValue({} as any);

      await excluirConta(adminUsuario, empresaId, senhaAtual);

      expect(User.countDocuments).toHaveBeenCalledWith({
        empresaId,
        role: "admin",
        _id: { $ne: adminUsuario._id },
        email: { $exists: true },
        acessoNegado: { $ne: true },
      });
      expect(User.deleteOne).toHaveBeenCalledWith({ _id: adminUsuario._id });
    });
  });
});
