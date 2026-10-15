import type { Request, Response } from "express";
import { ErroHttp, StatusCode, respostaSucesso, responderErro } from "../../utils/responseHandler.js";
import * as servicoIncidente from "./incidentService.js";

const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const DESCRICAO_MAXIMA = 500;

function lerOcorrencia(req: Request): servicoIncidente.DadosOcorrencia {
  const { horario, descricao } = (req.body ?? {}) as Record<string, unknown>;
  const dados: servicoIncidente.DadosOcorrencia = {};
  if (horario !== undefined && horario !== null) {
    if (typeof horario !== "string" || !HORARIO.test(horario)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'horario' deve estar no formato HH:mm.");
    }
    dados.horario = horario;
  }
  if (descricao !== undefined && descricao !== null) {
    if (typeof descricao !== "string" || descricao.trim().length > DESCRICAO_MAXIMA) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo 'descricao' deve ter até ${DESCRICAO_MAXIMA} caracteres.`);
    }
    dados.descricao = descricao.trim() || null;
  }
  return dados;
}

export async function reportar(req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.CREATED, await servicoIncidente.reportar(req.usuario, lerOcorrencia(req)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function listar(req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.OK, await servicoIncidente.listar(req.escopo, req.query));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
