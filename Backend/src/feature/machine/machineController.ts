import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { StatusCode, respostaSucesso, respostaErro } from "../../utils/responseHandler.js";
import { listarMaquinas } from "./machineService.js";

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
