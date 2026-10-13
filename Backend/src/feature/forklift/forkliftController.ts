import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { Forklift } from "../../schemas/forklift.js";
import { forkliftModel } from "../../models/forkliftModel.js";
import { ForkliftRepository } from "./forkliftRepository.js";
import { ForkliftService } from "./forkliftService.js";
import { StatusCode, respostaSucesso, respostaErro, responderErro } from "../../utils/responseHandler.js";
import { exigirEmpresa, filtroPorFilial, resolverFilial } from "../../core/escopo.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import regras from "./forkliftRules.js";

export const repositorioForklift = new ForkliftRepository(Forklift);
export const servicoForklift = new ForkliftService(repositorioForklift);

function obterIdForklift(req: Request): string | null {
  const idDoParams = req.params.id;
  if (idDoParams && typeof idDoParams === 'string') return idDoParams;

  const corpo = req.body as { _id?: unknown; id?: unknown };
  if (corpo?._id && typeof corpo._id === "string") return corpo._id;
  if (corpo?.id && typeof corpo.id === "string") return corpo.id;
  return null;
}

export async function listar(req: Request, res: Response) {
  try {
    const forklifts = await servicoForklift.listar(filtroPorFilial(req.escopo));
    return respostaSucesso(res, StatusCode.OK, forklifts.map(f => f.obterDados()));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function buscar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID não informado.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }
    const forklift = await servicoForklift.obterPorId(id, filtroPorFilial(req.escopo));
    return respostaSucesso(res, StatusCode.OK, forklift.obterDados());
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = req.body;

    const erros = regras.check({
      id: corpo.id,
      dispositivoConectadoId: corpo.dispositivoConectadoId,
      operadorConectadoId: corpo.operadorConectadoId
    });

    if (erros) {
        return respostaErro(res, StatusCode.BAD_REQUEST, erros);
    }

    const forklift = new forkliftModel(
      corpo.id,
      corpo.dispositivoConectadoId,
      corpo.operadorConectadoId,
      undefined,
      resolverFilial(req.escopo, corpo.filialId)
    );

    const criado = await servicoForklift.criar(forklift);
    return respostaSucesso(res, StatusCode.CREATED, criado.obterDados());
  } catch (error: any) {
    if (error.message.includes("Já existe")) {
      return respostaErro(res, StatusCode.CONFLICT, error.message);
    }
    return responderErro(res, error);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    const deletado = await servicoForklift.deletar(id, filtroPorFilial(req.escopo));
    return respostaSucesso(res, StatusCode.OK, { _id: deletado.getID(), message: "Empilhadeira excluída com sucesso." });
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "ID do banco de dados não informado na rota.");
    }
    if (!mongooseTypes.ObjectId.isValid(id)) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
    }

    const corpo = (req.body ?? {}) as Partial<Record<string, unknown>>;
    exigirSemOperadores(corpo);
    if (corpo.filialId !== undefined) {
      exigirEmpresa(req.escopo, "Apenas o escopo de empresa pode mover uma empilhadeira de filial.");
      corpo.filialId = resolverFilial(req.escopo, corpo.filialId);
    }
    if (corpo.id !== undefined) {
      corpo.identificacao = corpo.id;
      delete corpo.id;
    }
    delete corpo._id;

    const atualizado = await servicoForklift.atualizar(id, corpo, filtroPorFilial(req.escopo));
    return respostaSucesso(res, StatusCode.OK, atualizado.obterDados());
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrado(a).") {
      return respostaErro(res, StatusCode.NOT_FOUND, error.message);
    }
    return responderErro(res, error);
  }
}
