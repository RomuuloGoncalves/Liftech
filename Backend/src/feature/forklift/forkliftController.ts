import type { Request, Response } from "express";
import { Forklift } from "../../schemas/forklift.js";
import { forkliftModel } from "../../models/forkliftModel.js";
import { ForkliftRepository } from "./forkliftRepository.js";
import { ForkliftService } from "./forkliftService.js";

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
    return res.status(200).json(forklifts.map(f => f.obterDados()));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function buscar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }
    const forklift = await servicoForklift.obterPorId(id);
    return res.status(200).json(forklift.obterDados());
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrada.") {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = req.body;
    if (!corpo.identificacao || typeof corpo.identificacao !== 'string' || corpo.identificacao.trim() === '') {
        return res.status(400).json({ error: "Identificação é obrigatória e deve ser texto válido." });
    }

    const forklift = new forkliftModel(
      corpo.identificacao,
      corpo.dispositivoConectadoId,
      corpo.operadorConectadoId
    );

    const criado = await servicoForklift.criar(forklift);
    return res.status(201).json(criado.obterDados());
  } catch (error: any) {
    if (error.message.includes("Já existe")) {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }

    const deletado = await servicoForklift.deletar(id);
    return res.status(200).json({ id: deletado.getID(), message: "Empilhadeira excluída com sucesso." });
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrada.") {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    const id = obterIdForklift(req);
    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }

    const corpo = req.body as Partial<Record<string, unknown>>;
    delete corpo.id;
    delete corpo._id;

    const atualizado = await servicoForklift.atualizar(id, corpo);
    return res.status(200).json(atualizado.obterDados());
  } catch (error: any) {
    if (error.message === "Empilhadeira não encontrada.") {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}
