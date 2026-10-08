import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { Incident } from "../../schemas/incident.js";
import { incidentModel } from "../../models/incidentModel.js";
import { IncidentRepository } from "./incidentRepository.js";
import { IncidentService } from "./incidentService.js";
import { StatusCode, respostaSucesso, respostaErro } from "../../utils/responseHandler.js";
import regras from "./incidentRules.js";

export const repositorioIncident = new IncidentRepository(Incident);
export const servicoIncident = new IncidentService(repositorioIncident);

function obterIdIncident(req: Request): string | null {
  const idDoParams = req.params.id;
  if (idDoParams && typeof idDoParams === 'string') return idDoParams;

  const corpo = req.body as { _id?: unknown; id?: unknown };
  if (corpo?._id && typeof corpo._id === "string") return corpo._id;
  if (corpo?.id && typeof corpo.id === "string") return corpo.id;
  return null;
}

export async function listar(req: Request, res: Response) {
  try {
    const { status, empilhadeiraId } = req.query;
    let incidentes: incidentModel[];

    if (typeof status === "string") {
      incidentes = await servicoIncident.listarPorStatus(status);
    } else if (typeof empilhadeiraId === "string") {
      if (!mongooseTypes.ObjectId.isValid(empilhadeiraId)) {
        return respostaErro(res, StatusCode.BAD_REQUEST, "O 'empilhadeiraId' não é um ObjectId válido do MongoDB.");
      }
      incidentes = await servicoIncident.listarPorEmpilhadeira(empilhadeiraId);
    } else {
      incidentes = await servicoIncident.listar();
    }

    return respostaSucesso(res, StatusCode.OK, incidentes.map(i => i.obterDados()));
  } catch (error: any) {
    if (error.message.startsWith("Status inválido")) {
      return respostaErro(res, StatusCode.BAD_REQUEST, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function buscar(req: Request, res: Response) {
  try {
    const id = obterIdIncident(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID não informado.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }
    const incidente = await servicoIncident.obterPorId(id);
    return respostaSucesso(res, StatusCode.OK, incidente.obterDados());
  } catch (error: any) {
    if (error.message === "Incidente não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = req.body;

    const erros = regras.check({
      dataIncidente: corpo.dataIncidente,
      forcaImpacto: corpo.forcaImpacto,
      status: corpo.status,
      empilhadeiraId: corpo.empilhadeiraId,
      operadorId: corpo.operadorId
    });

    if (erros) {
      return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    const incidente = new incidentModel(
      new Date(corpo.dataIncidente),
      Number(corpo.forcaImpacto),
      corpo.status,
      corpo.empilhadeiraId || undefined,
      corpo.operadorId || undefined
    );

    const criado = await servicoIncident.criar(incidente);
    return respostaSucesso(res, StatusCode.CREATED, criado.obterDados());
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const id = obterIdIncident(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    const deletado = await servicoIncident.deletar(id);
    return respostaSucesso(res, StatusCode.OK, { _id: deletado.getID(), message: "Incidente excluído com sucesso." });
  } catch (error: any) {
    if (error.message === "Incidente não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    const id = obterIdIncident(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    // só o status pode mudar depois de criado
    const { status } = req.body;
    if (status === undefined) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O campo 'status' é obrigatório.");
    }

    const erros = regras.check({ status });
    if (erros) {
      return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    const atualizado = await servicoIncident.atualizar(id, { status });
    return respostaSucesso(res, StatusCode.OK, atualizado.obterDados());
  } catch (error: any) {
    if (error.message === "Incidente não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}