import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { ErroHttp, StatusCode, respostaSucesso, respostaErro, responderErro } from "../../utils/responseHandler.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import { definirTrava, listarMaquinas, moverParaCategoria, obterMaquina } from "./machineService.js";
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

export async function travar(req: Request, res: Response) {
  try {
    const id = lerId(req);
    const { categoriaTravada } = lerCorpo(req);
    if (typeof categoriaTravada !== "boolean") {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'categoriaTravada' deve ser true ou false.");
    }
    return respostaSucesso(res, StatusCode.OK, await definirTrava(req.escopo, id, categoriaTravada));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

const ehObjectId = (valor: unknown): valor is string => typeof valor === "string" && mongooseTypes.ObjectId.isValid(valor);

export async function mover(req: Request, res: Response) {
  try {
    const { machineIds, categoriaId } = lerCorpo(req);
    if (!Array.isArray(machineIds) || machineIds.length === 0 || !machineIds.every(ehObjectId)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'machineIds' deve ser uma lista não vazia de ObjectIds.");
    }
    if (categoriaId !== null && !ehObjectId(categoriaId)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'categoriaId' deve ser um ObjectId ou null.");
    }
    return respostaSucesso(res, StatusCode.OK, await moverParaCategoria(req.escopo, machineIds, categoriaId));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
