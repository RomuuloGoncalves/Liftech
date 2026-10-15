import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { ErroHttp, StatusCode, respostaSucesso, respostaErro, responderErro } from "../../utils/responseHandler.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import { listarMaquinas, obterMaquina } from "./machineService.js";
import { aplicarStatus, ehStatus } from "./statusService.js";

function lerId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !mongooseTypes.ObjectId.isValid(id)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
  }
  return id;
}

function lerCorpo(req: Request): Record<string, unknown> {
  const corpo = (req.body ?? {}) as Record<string, unknown>;
  exigirSemOperadores(corpo);
  return corpo;
}

export async function listar(req: Request, res: Response) {
  try {
    const { filialId } = req.query;
    if (filialId !== undefined && (typeof filialId !== "string" || !mongooseTypes.ObjectId.isValid(filialId))) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O filialId fornecido não é um ObjectId válido do MongoDB.");
    }
    return respostaSucesso(res, StatusCode.OK, await listarMaquinas(req.escopo, filialId));
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function alterarStatus(req: Request, res: Response) {
  try {
    const id = lerId(req);
    const { status } = lerCorpo(req);
    if (!ehStatus(status)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'status' deve ser disponivel, em_uso, manutencao, alerta ou offline.");
    }
    await obterMaquina(req.escopo, id);
    await aplicarStatus(id, status);
    return respostaSucesso(res, StatusCode.OK, await obterMaquina(req.escopo, id));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
