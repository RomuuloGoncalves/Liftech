import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { telemetryModel } from "../../models/telemetryModel.js";
import { Telemetry } from "../../schemas/telemetry.js";
import { TelemetryRepository } from "./telemetryRepository.js";
import { TelemetryService } from "./telemetryService.js";
import { StatusCode, respostaSucesso, respostaErro } from "../../utils/responseHandler.js";
import regras from "./telemetryRules.js";

export const repositorioTelemetry = new TelemetryRepository(Telemetry);
export const servicoTelemetry = new TelemetryService(repositorioTelemetry);

function obterId(req: Request): string | null {
  const idDoParams = req.params.id;
  if (idDoParams && typeof idDoParams === 'string') return idDoParams;

  const corpo = req.body as { _id?: unknown; id?: unknown };
  if (corpo?._id && typeof corpo._id === "string") return corpo._id;
  if (corpo?.id && typeof corpo.id === "string") return corpo.id;
  return null;
}

export async function listar(req: Request, res: Response) {
  try {
    const dispositivoId = req.query.dispositivoId as string;
    
    const dataInicial = req.query.dataInicial as string;
    const dataFinal = req.query.dataFinal as string;
    
    let registros;

    if (dispositivoId) {
       if (!mongooseTypes.ObjectId.isValid(dispositivoId)) {
        return respostaErro(res, StatusCode.BAD_REQUEST, "O dispositivoId fornecido não é válido.");
      }
      registros = await servicoTelemetry.listarPorDispositivo(dispositivoId, dataInicial, dataFinal);
    } else {
      registros = await servicoTelemetry.listar();
    }
    
    return respostaSucesso(res, StatusCode.OK, registros.map(r => r.obterDados()));
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function buscar(req: Request, res: Response) {
  try {
    const id = obterId(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID não informado.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }
    
    const registro = await servicoTelemetry.obterPorId(id);
    return respostaSucesso(res, StatusCode.CREATED, registro.obterDados());
  } catch (error: any) {
    if (error.message === "Telemetria não encontrado(a)." || error.message.includes("não encontrado")) {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = req.body;

    const erros = regras.check({
      dispositivoId: corpo.dispositivoId,
      dataDados: corpo.dataDados
    });

    if (erros) {
      return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    const telemetria = new telemetryModel(
      new Date(corpo.dataDados),
      corpo.dispositivoId
    );

    const criado = await servicoTelemetry.criar(telemetria);
    return respostaSucesso(res, StatusCode.CREATED, criado.obterDados());
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const id = obterId(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    const deletado = await servicoTelemetry.deletar(id);
    return respostaSucesso(res, StatusCode.CREATED, deletado.obterDados());
  } catch (error: any) {
    if (error.message.includes("não encontrado")) {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    const id = obterId(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    const corpo = req.body as Partial<Record<string, unknown>>;
    delete corpo._id;
    delete corpo.id;
    
    if (corpo.dataDados) {
       corpo.dataDados = new Date(corpo.dataDados as string);
    }

    const atualizado = await servicoTelemetry.atualizar(id, corpo);
    return respostaSucesso(res, StatusCode.CREATED, atualizado.obterDados());
  } catch (error: any) {
    if (error.message.includes("não encontrado")) {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}