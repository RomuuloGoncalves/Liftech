import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { User } from "../../schemas/user.js";
import { userModel } from "../../models/userModel.js";
import { UserRepository } from "./userRepository.js";
import { UserService } from "./userService.js";
import { ErroHttp, StatusCode, respostaSucesso, respostaErro, responderErro } from "../../utils/responseHandler.js";
import { exigirEmpresa, filtroPorEmpresa } from "../../core/escopo.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import regras from "./userRules.js";

const repositorioUser = new UserRepository(User);
export const servicoUser = new UserService(repositorioUser);

function obterIdUsuario(req: Request): string | null {
  const idDoParams = req.params.id;
  if (idDoParams && typeof idDoParams === 'string') return idDoParams;

  const corpo = req.body as { _id?: unknown; id?: unknown };
  if (corpo?._id && typeof corpo._id === "string") return corpo._id;
  if (corpo?.id && typeof corpo.id === "string") return corpo.id;
  return null;
}

// request-check só lê o primeiro campo de cada objeto; `isRequiredField: false` ignora o ausente.
function validarOpcionais(corpo: Record<string, unknown>) {
  return regras.check(...["telefone", "cargo"].map(c => ({ [c]: corpo[c], isRequiredField: false })));
}

const SO_EMPRESA = "Apenas o escopo de empresa pode definir papel de admin, escopo e filiais.";

// Toda filial citada precisa ser visível ao chamador (para o escopo de empresa, todas as da empresa).
function exigirFiliaisVisiveis(req: Request, filiaisIds: string[]) {
  const visiveis = req.escopo.filiais.map((f) => f._id);
  if (!filiaisIds.every((id) => visiveis.includes(id))) {
    throw new ErroHttp(StatusCode.FORBIDDEN, "Há filial fora do seu escopo.");
  }
}

export async function listar(req: Request, res: Response) {
  try {
    const usuarios = await servicoUser.listar(filtroPorEmpresa(req.escopo));
    return respostaSucesso(res, StatusCode.OK, usuarios.map(u => u.obterDados()));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function buscar(req: Request, res: Response) {
  try {
    const id = obterIdUsuario(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID não informado.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }
    const usuario = await servicoUser.obterPorId(id, filtroPorEmpresa(req.escopo));
    return respostaSucesso(res, StatusCode.OK, usuario.obterDados());
  } catch (error: any) {
    if (error.message === "Usuário não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = req.body ?? {};
    if (!req.escopo.empresaId) {
      throw new ErroHttp(StatusCode.FORBIDDEN, "Usuário sem empresa não pode criar usuários.");
    }

    // request-check lê só a primeira chave de cada objeto: um objeto por campo.
    const erros = regras.check(
      { nome: corpo.nome },
      { role: corpo.role },
      { escopo: corpo.escopo, isRequiredField: false },
      { filiaisIds: corpo.filiaisIds, isRequiredField: false }
    ) ?? validarOpcionais(corpo);

    if (erros) {
        return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    if (corpo.escopo !== undefined || corpo.filiaisIds !== undefined || corpo.role === "admin") {
      exigirEmpresa(req.escopo, SO_EMPRESA);
    }
    if (corpo.filiaisIds !== undefined) exigirFiliaisVisiveis(req, corpo.filiaisIds);

    const usuario = new userModel(corpo.nome, corpo.role, undefined, {
      telefone: corpo.telefone,
      cargo: corpo.cargo,
      empresaId: req.escopo.empresaId,
      escopo: corpo.escopo,
      filiaisIds: corpo.filiaisIds,
    });

    const criado = await servicoUser.criar(usuario);
    return respostaSucesso(res, StatusCode.CREATED, criado.obterDados());
  } catch (error: any) {
    if (error.message.includes("Já existe")) {
      return respostaErro(res, StatusCode.CONFLICT, error.message);
    }
    return responderErro(res, error);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const id = obterIdUsuario(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    const deletado = await servicoUser.deletar(id, filtroPorEmpresa(req.escopo));
    return respostaSucesso(res, StatusCode.OK, { _id: deletado.getID(), message: "Usuário excluído com sucesso." });
  } catch (error: any) {
    if (error.message === "Usuário não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
  }
}

const CAMPOS_LIVRES = ["nome", "telefone", "cargo"];
const CAMPOS_DE_EMPRESA = ["role", "escopo", "filiaisIds"];

// Atribuição em massa: só chegam ao banco os campos permitidos, validados; papel, escopo e filiais só pelo escopo de empresa.
function corpoDeAtualizacao(req: Request): Record<string, unknown> {
  const corpo = { ...(req.body ?? {}) } as Record<string, unknown>;
  delete corpo._id;
  delete corpo.id;
  exigirSemOperadores(corpo);

  const chaves = Object.keys(corpo);
  const proibida = chaves.find((k) => !CAMPOS_LIVRES.includes(k) && !CAMPOS_DE_EMPRESA.includes(k));
  if (proibida) throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${proibida}' não pode ser alterado.`);
  if (chaves.length === 0) throw new ErroHttp(StatusCode.BAD_REQUEST, "Nenhum campo para atualizar.");

  const erros = regras.check(...["nome", "role", "escopo", "filiaisIds"].filter((k) => k in corpo).map((k) => ({ [k]: corpo[k] })));
  if (erros) throw new ErroHttp(StatusCode.BAD_REQUEST, erros.map((e: { message: string }) => e.message).join(" "));
  for (const k of ["telefone", "cargo"]) {
    if (k in corpo && typeof corpo[k] !== "string") throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${k}' deve ser texto.`);
  }

  if (CAMPOS_DE_EMPRESA.some((k) => k in corpo)) exigirEmpresa(req.escopo, SO_EMPRESA);
  if (corpo.filiaisIds !== undefined) exigirFiliaisVisiveis(req, corpo.filiaisIds as string[]);
  return corpo;
}

export async function atualizar(req: Request, res: Response) {
  try {
    const id = obterIdUsuario(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    const corpo = corpoDeAtualizacao(req);

    const atualizado = await servicoUser.atualizar(id, corpo, filtroPorEmpresa(req.escopo));
    return respostaSucesso(res, StatusCode.OK, atualizado.obterDados());
  } catch (error: any) {
    if (error.message === "Usuário não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
  }
}
