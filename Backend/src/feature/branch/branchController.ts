import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { ErroHttp, StatusCode, respostaSucesso, responderErro } from "../../utils/responseHandler.js";
import * as servicoBranch from "./branchService.js";

// Só o escopo de empresa cria, renomeia e exclui filiais.
function exigirEmpresa(req: Request) {
  if (req.escopo.tipo !== "empresa") {
    throw new ErroHttp(StatusCode.FORBIDDEN, "Apenas o escopo de empresa pode gerenciar filiais.");
  }
}

function lerId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !mongooseTypes.ObjectId.isValid(id)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
  }
  return id;
}

function lerNome(req: Request): string {
  const nome = req.body?.nome;
  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'nome' é obrigatório e deve ser texto válido.");
  }
  return nome.trim();
}

export async function listar(req: Request, res: Response) {
  return respostaSucesso(res, StatusCode.OK, req.escopo.filiais);
}

export async function criar(req: Request, res: Response) {
  try {
    exigirEmpresa(req);
    const nome = lerNome(req);
    return respostaSucesso(res, StatusCode.CREATED, await servicoBranch.criar(req.escopo, nome));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    exigirEmpresa(req);
    const id = lerId(req);
    const nome = lerNome(req);
    return respostaSucesso(res, StatusCode.OK, await servicoBranch.renomear(req.escopo, id, nome));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    exigirEmpresa(req);
    return respostaSucesso(res, StatusCode.OK, await servicoBranch.excluir(req.escopo, lerId(req)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
