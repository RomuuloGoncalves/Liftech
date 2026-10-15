import type { Request, Response } from "express";
import { ErroHttp, StatusCode, respostaSucesso, responderErro } from "../../utils/responseHandler.js";
import * as servicoSessao from "./sessionService.js";

export async function atual(req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.OK, await servicoSessao.atual(req.usuario));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function iniciar(req: Request, res: Response) {
  try {
    const machineId = servicoSessao.lerMachineId(req.body?.machineId);
    if (!machineId) throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'machineId' é obrigatório.");
    return respostaSucesso(res, StatusCode.CREATED, await servicoSessao.iniciar(req.escopo, req.usuario, machineId));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function encerrar(req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.OK, await servicoSessao.encerrar(req.usuario));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function listar(req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.OK, await servicoSessao.listar(req.escopo, req.usuario, req.query));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
