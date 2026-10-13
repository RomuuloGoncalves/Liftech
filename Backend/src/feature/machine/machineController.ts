import type { Request, Response } from "express";
import { StatusCode, respostaSucesso, respostaErro } from "../../utils/responseHandler.js";
import { listarMaquinas } from "./machineService.js";

export async function listar(_req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.OK, await listarMaquinas());
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
