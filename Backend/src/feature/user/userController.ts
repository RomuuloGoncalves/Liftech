import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { User } from "../../schemas/user.js";
import { userModel } from "../../models/userModel.js";
import { UserRepository } from "./userRepository.js";
import { UserService } from "./userService.js";
import { StatusCode, respostaSucesso, respostaErro } from "../../utils/responseHandler.js";
import regras from "./userRules.js";

export const repositorioUser = new UserRepository(User);
export const servicoUser = new UserService(repositorioUser);

function obterIdUsuario(req: Request): string | null {
  const idDoParams = req.params.id;
  if (idDoParams && typeof idDoParams === 'string') return idDoParams;

  const corpo = req.body as { _id?: unknown; id?: unknown };
  if (corpo?._id && typeof corpo._id === "string") return corpo._id;
  if (corpo?.id && typeof corpo.id === "string") return corpo.id;
  return null;
}

export async function listar(_req: Request, res: Response) {
  try {
    const usuarios = await servicoUser.listar();
    return respostaSucesso(res, StatusCode.OK, usuarios.map(u => u.obterDados()));
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
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
    const usuario = await servicoUser.obterPorId(id);
    return respostaSucesso(res, StatusCode.OK, usuario.obterDados());
  } catch (error: any) {
    if (error.message === "Usuário não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = req.body;

    const erros = regras.check({
      nome: corpo.nome,
      role: corpo.role
    });

    if (erros) {
        return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    const usuario = new userModel(corpo.nome, corpo.role);

    const criado = await servicoUser.criar(usuario);
    return respostaSucesso(res, StatusCode.CREATED, criado.obterDados());
  } catch (error: any) {
    if (error.message.includes("Já existe")) {
      return respostaErro(res, StatusCode.CONFLICT, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
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

    const deletado = await servicoUser.deletar(id);
    return respostaSucesso(res, StatusCode.OK, { _id: deletado.getID(), message: "Usuário excluído com sucesso." });
  } catch (error: any) {
    if (error.message === "Usuário não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
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

    const corpo = req.body as Partial<Record<string, unknown>>;
    delete corpo._id;

    const atualizado = await servicoUser.atualizar(id, corpo);
    return respostaSucesso(res, StatusCode.OK, atualizado.obterDados());
  } catch (error: any) {
    if (error.message === "Usuário não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
