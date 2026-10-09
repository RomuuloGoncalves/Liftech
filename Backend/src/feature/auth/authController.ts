import type { Request, Response } from "express";
import { StatusCode, respostaSucesso, respostaErro } from "../../utils/responseHandler.js";
import * as servicoAuth from "./authService.js";
import regras from "./authRules.js";

export async function login(req: Request, res: Response) {
  try {
    const { role, login, senha } = req.body ?? {};

    const erros = regras.check({ role }, { login }, { senha });
    if (erros) {
      return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    const resultado = await servicoAuth.login(role, login, senha);
    return respostaSucesso(res, StatusCode.OK, resultado);
  } catch (error: any) {
    if (error.message === servicoAuth.CREDENCIAIS_INVALIDAS) {
      return respostaErro(res, StatusCode.UNAUTHORIZED, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
