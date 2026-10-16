import type { Request, Response } from "express";
import { StatusCode, respostaErro, respostaSucesso, responderErro } from "../../utils/responseHandler.js";
import { resetarBanco } from "../../scripts/resetData.js";

let emAndamento = false;

// Rota pública que apaga o banco e roda o seed do zero (projeto pessoal, decisão do dono).
export async function resetar(_req: Request, res: Response) {
  if (emAndamento) return respostaErro(res, StatusCode.CONFLICT, "Reset em andamento.");

  emAndamento = true;
  try {
    return respostaSucesso(res, StatusCode.OK, await resetarBanco());
  } catch (error: any) {
    return responderErro(res, error);
  } finally {
    emAndamento = false;
  }
}
