import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { telemetryModel } from "../../models/telemetryModel.js";
import { Telemetry } from "../../schemas/telemetry.js";
import { TelemetryRepository } from "./telemetryRepository.js";
import { TelemetryService } from "./telemetryService.js";
import { ErroHttp, StatusCode, respostaSucesso, respostaErro, responderErro } from "../../utils/responseHandler.js";
import { Device } from "../../schemas/device.js";
import { filtroPorFilial } from "../../core/escopo.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import regras from "./telemetryRules.js";
import { limiteImpacto, registrarImpacto } from "../machine/statusService.js";

const repositorioTelemetry = new TelemetryRepository(Telemetry);
export const servicoTelemetry = new TelemetryService(repositorioTelemetry);

function obterId(req: Request): string | null {
  const idDoParams = req.params.id;
  if (idDoParams && typeof idDoParams === 'string') return idDoParams;

  const corpo = req.body as { _id?: unknown; id?: unknown };
  if (corpo?._id && typeof corpo._id === "string") return corpo._id;
  if (corpo?.id && typeof corpo.id === "string") return corpo.id;
  return null;
}

// A telemetria não tem filial: ela é isolada pelos dispositivos que estão nas filiais do escopo.
async function idsDosDispositivos(req: Request): Promise<string[]> {
  return (await Device.find(filtroPorFilial(req.escopo)).distinct("_id")).map(String);
}

const filtroDosDispositivos = (ids: string[]) => ({ dispositivoId: { $in: ids } });

export async function listar(req: Request, res: Response) {
  try {
    const dispositivoId = req.query.dispositivoId as string;
    const dataInicial = req.query.dataInicial as string;
    const dataFinal = req.query.dataFinal as string;
    const ids = await idsDosDispositivos(req);
    let registros;

    if (dispositivoId) {
       if (!mongooseTypes.ObjectId.isValid(dispositivoId)) {
        return respostaErro(res, StatusCode.BAD_REQUEST, "O dispositivoId fornecido não é válido.");
      }
      registros = ids.includes(dispositivoId) ? await servicoTelemetry.listarPorDispositivo(dispositivoId, dataInicial, dataFinal) : [];
    } else {
      registros = await servicoTelemetry.listar(filtroDosDispositivos(ids));
    }
    
    return respostaSucesso(res, StatusCode.OK, registros.map(r => r.obterDados()));
  } catch (error: any) {
    return responderErro(res, error);
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
    
    const registro = await servicoTelemetry.obterPorId(id, filtroDosDispositivos(await idsDosDispositivos(req)));
    return respostaSucesso(res, StatusCode.CREATED, registro.obterDados());
  } catch (error: any) {
    if (error.message === "Telemetria não encontrado(a)." || error.message.includes("não encontrado")) {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
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

    const { forcaImpacto } = corpo;
    if (forcaImpacto !== undefined && (typeof forcaImpacto !== "number" || !Number.isFinite(forcaImpacto) || forcaImpacto < 0)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O campo 'forcaImpacto' deve ser um número maior ou igual a 0.");
    }

    if (!(await idsDosDispositivos(req)).includes(String(corpo.dispositivoId))) {
      throw new ErroHttp(StatusCode.NOT_FOUND, "Dispositivo não encontrado(a).");
    }

    const dataDados = new Date(corpo.dataDados);
    const telemetria = new telemetryModel(dataDados, corpo.dispositivoId, undefined, forcaImpacto);

    const criado = await servicoTelemetry.criar(telemetria);
    // A leitura fica gravada mesmo que a regra de impacto falhe depois.
    if (forcaImpacto !== undefined && forcaImpacto >= limiteImpacto()) {
      await registrarImpacto(String(corpo.dispositivoId), forcaImpacto, dataDados);
    }
    return respostaSucesso(res, StatusCode.CREATED, criado.obterDados());
  } catch (error: any) {
    return responderErro(res, error);
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

    const deletado = await servicoTelemetry.deletar(id, filtroDosDispositivos(await idsDosDispositivos(req)));
    return respostaSucesso(res, StatusCode.CREATED, deletado.obterDados());
  } catch (error: any) {
    if (error.message.includes("não encontrado")) {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
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

    const corpo = (req.body ?? {}) as Partial<Record<string, unknown>>;
    exigirSemOperadores(corpo);
    const ids = await idsDosDispositivos(req);
    if (corpo.dispositivoId !== undefined && !ids.includes(String(corpo.dispositivoId))) {
      throw new ErroHttp(StatusCode.NOT_FOUND, "Dispositivo não encontrado(a).");
    }
    delete corpo._id;
    delete corpo.id;
    
    if (corpo.dataDados) {
       corpo.dataDados = new Date(corpo.dataDados as string);
    }

    const atualizado = await servicoTelemetry.atualizar(id, corpo, filtroDosDispositivos(ids));
    return respostaSucesso(res, StatusCode.CREATED, atualizado.obterDados());
  } catch (error: any) {
    if (error.message.includes("não encontrado")) {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
  }
}