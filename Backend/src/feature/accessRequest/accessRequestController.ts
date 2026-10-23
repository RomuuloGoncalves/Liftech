import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import {
  StatusCode,
  respostaSucesso,
  respostaErro,
  responderErro,
  ErroHttp,
} from "../../utils/responseHandler.js";
import { AccessRequest } from "../../schemas/accessRequest.js";
import regras from "./accessRequestRules.js";
import * as servicoAccessRequest from "./accessRequestService.js";

function lerId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !mongooseTypes.ObjectId.isValid(id)) {
    throw new ErroHttp(
      StatusCode.BAD_REQUEST,
      "O ID fornecido não é um ObjectId válido do MongoDB."
    );
  }
  return id;
}

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

export async function listar(req: Request, res: Response) {
  try {
    const statusQuery = req.query.status;
    let status: servicoAccessRequest.StatusFiltro | undefined = undefined;

    if (statusQuery !== undefined) {
      if (
        typeof statusQuery !== "string" ||
        !["pendente", "aprovada", "recusada"].includes(statusQuery)
      ) {
        throw new ErroHttp(
          StatusCode.BAD_REQUEST,
          "O campo 'status' deve ser pendente, aprovada ou recusada."
        );
      }
      status = statusQuery as servicoAccessRequest.StatusFiltro;
    }

    const solicitacoes = await servicoAccessRequest.listar(status);
    return respostaSucesso(res, StatusCode.OK, solicitacoes);
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function aprovar(req: Request, res: Response) {
  try {
    const id = lerId(req);
    const resultado = await servicoAccessRequest.aprovar(id);
    return respostaSucesso(res, StatusCode.OK, resultado);
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function recusar(req: Request, res: Response) {
  try {
    const id = lerId(req);
    const motivoRaw = req.body?.motivo;
    let motivo: string | undefined = undefined;

    if (motivoRaw !== undefined && motivoRaw !== null) {
      if (typeof motivoRaw !== "string") {
        throw new ErroHttp(
          StatusCode.BAD_REQUEST,
          "O campo 'motivo' deve ser texto de até 200 caracteres."
        );
      }
      const cortado = motivoRaw.trim();
      if (cortado.length > 200) {
        throw new ErroHttp(
          StatusCode.BAD_REQUEST,
          "O campo 'motivo' deve ser texto de até 200 caracteres."
        );
      }
      if (cortado.length > 0) {
        motivo = cortado;
      }
    }

    const resultado = await servicoAccessRequest.recusar(id, motivo);
    return respostaSucesso(res, StatusCode.OK, resultado);
  } catch (error: any) {
    return responderErro(res, error);
  }
}
