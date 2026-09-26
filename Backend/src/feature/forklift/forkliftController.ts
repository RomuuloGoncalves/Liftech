import type { Request, Response } from "express";
import { Forklift } from "../../schemas/forklift.js";
import { forkliftModel } from "../../models/forkliftModel.js";
import { ForkliftRepository } from "./forkliftRepository.js";
import { ForkliftService } from "./forkliftService.js";
import { HttpStatus, handleSuccess, handleError } from "../../utils/responseHandler.js";

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

export async function listar(_req: Request, res: Response) {
  try {
    const forklifts = await servicoForklift.listar();
    return handleSuccess(res, HttpStatus.OK, forklifts.map(f => f.obterDados()));
  } catch (error: any) {
    return handleError(res, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function buscar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return handleError(res, HttpStatus.BAD_REQUEST, "ID não informado.");
    }
    const forklift = await servicoForklift.obterPorId(id);
    return handleSuccess(res, HttpStatus.OK, forklift.obterDados());
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrado(a).") {
      return handleError(res, HttpStatus.NOT_FOUND, error.message);
    }
    return handleError(res, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = req.body;
    if (!corpo.identificacao || typeof corpo.identificacao !== 'string' || corpo.identificacao.trim() === '') {
        return handleError(res, HttpStatus.BAD_REQUEST, "Identificação é obrigatória e deve ser texto válido.");
    }

    const forklift = new forkliftModel(
      corpo.identificacao,
      corpo.dispositivoConectadoId,
      corpo.operadorConectadoId
    );

    const criado = await servicoForklift.criar(forklift);
    return handleSuccess(res, HttpStatus.CREATED, criado.obterDados());
  } catch (error: any) {
    if (error.message.includes("Já existe")) {
      return handleError(res, HttpStatus.CONFLICT, error.message);
    }
    return handleError(res, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return handleError(res, HttpStatus.BAD_REQUEST, "ID não informado.");
    }

    const deletado = await servicoForklift.deletar(id);
    return handleSuccess(res, HttpStatus.OK, { id: deletado.getID(), message: "Empilhadeira excluída com sucesso." });
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrado(a).") {
      return handleError(res, HttpStatus.NOT_FOUND, error.message);
    }
    return handleError(res, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return handleError(res, HttpStatus.BAD_REQUEST, "ID não informado.");
    }

    const corpo = req.body as Partial<Record<string, unknown>>;
    delete corpo.id;
    delete corpo._id;

    const atualizado = await servicoForklift.atualizar(id, corpo);
    return handleSuccess(res, HttpStatus.OK, atualizado.obterDados());
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrado(a).") {
      return handleError(res, HttpStatus.NOT_FOUND, error.message);
    }
    return handleError(res, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
}
