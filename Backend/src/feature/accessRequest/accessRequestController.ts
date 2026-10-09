import type { Request, Response } from "express";
import { StatusCode, respostaSucesso, respostaErro } from "../../utils/responseHandler.js";
import { AccessRequest } from "../../schemas/accessRequest.js";
import regras from "./accessRequestRules.js";

export async function criar(req: Request, res: Response) {
  try {
    const { email, nomeEmpresa, nomeAdministrador } = req.body ?? {};

    const erros = regras.check({ email }, { nomeEmpresa }, { nomeAdministrador });
    if (erros) {
      return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    const emailNormalizado = email.trim().toLowerCase();

    if (await AccessRequest.findOne({ email: emailNormalizado, status: "pendente" }).lean()) {
      return respostaErro(res, StatusCode.CONFLICT, "Já existe uma solicitação pendente para este email.");
    }

    const doc = await AccessRequest.create({
      email: emailNormalizado,
      nomeEmpresa: nomeEmpresa.trim(),
      nomeAdministrador: nomeAdministrador.trim(),
    });
    return respostaSucesso(res, StatusCode.CREATED, doc.toObject());
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
