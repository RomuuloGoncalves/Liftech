import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { ErroHttp, StatusCode, respostaSucesso, respostaErro, responderErro } from "../../utils/responseHandler.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import { resolverFilial } from "../../core/escopo.js";
import { atualizarMaquina, criarMaquina, definirTrava, excluirMaquina, listarMaquinas, moverParaCategoria, obterMaquina, type DadosMaquina } from "./machineService.js";
import { aplicarStatus, ehStatus } from "./statusService.js";

function lerId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !mongooseTypes.ObjectId.isValid(id)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
  }
  return id;
}

function lerCorpo(req: Request): Record<string, unknown> {
  const corpo = (req.body ?? {}) as Record<string, unknown>;
  exigirSemOperadores(corpo);
  return corpo;
}

export async function listar(req: Request, res: Response) {
  try {
    const { filialId } = req.query;
    if (filialId !== undefined && (typeof filialId !== "string" || !mongooseTypes.ObjectId.isValid(filialId))) {
      return respostaErro(res, StatusCode.BAD_REQUEST, "O filialId fornecido não é um ObjectId válido do MongoDB.");
    }
    return respostaSucesso(res, StatusCode.OK, await listarMaquinas(req.escopo, filialId));
  } catch (error: any) {
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
}

export async function alterarStatus(req: Request, res: Response) {
  try {
    const id = lerId(req);
    const { status } = lerCorpo(req);
    if (!ehStatus(status)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'status' deve ser disponivel, em_uso, manutencao, alerta ou offline.");
    }
    await obterMaquina(req.escopo, id);
    await aplicarStatus(id, status);
    return respostaSucesso(res, StatusCode.OK, await obterMaquina(req.escopo, id));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function travar(req: Request, res: Response) {
  try {
    const id = lerId(req);
    const { categoriaTravada } = lerCorpo(req);
    if (typeof categoriaTravada !== "boolean") {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'categoriaTravada' deve ser true ou false.");
    }
    return respostaSucesso(res, StatusCode.OK, await definirTrava(req.escopo, id, categoriaTravada));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

const ehObjectId = (valor: unknown): valor is string => typeof valor === "string" && mongooseTypes.ObjectId.isValid(valor);

export async function mover(req: Request, res: Response) {
  try {
    const { machineIds, categoriaId } = lerCorpo(req);
    if (!Array.isArray(machineIds) || machineIds.length === 0 || !machineIds.every(ehObjectId)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'machineIds' deve ser uma lista não vazia de ObjectIds.");
    }
    if (categoriaId !== null && !ehObjectId(categoriaId)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'categoriaId' deve ser um ObjectId ou null.");
    }
    return respostaSucesso(res, StatusCode.OK, await moverParaCategoria(req.escopo, machineIds, categoriaId));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

const CAMPOS_MAQUINA = ["nome", "identificacao", "setor", "nomeDispositivo", "enderecoMac"] as const;
const OBRIGATORIOS: readonly string[] = ["nome", "identificacao", "enderecoMac"];
const MAC_MAXIMO = 32;

// No POST nome, identificação e MAC são obrigatórios; no PUT só são validados quando vierem.
function lerDadosMaquina(corpo: Record<string, unknown>, obrigatorio: boolean): DadosMaquina {
  const dados: DadosMaquina = {};
  for (const campo of CAMPOS_MAQUINA) {
    const valor = corpo[campo];
    const exigido = OBRIGATORIOS.includes(campo);
    if (valor === undefined && !(obrigatorio && exigido)) continue;
    const texto = typeof valor === "string" ? valor.trim() : undefined;
    if (texto === undefined || (exigido && texto.length === 0)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${campo}' ${exigido ? "é obrigatório e " : ""}deve ser texto.`);
    }
    dados[campo] = texto;
  }
  if (dados.enderecoMac !== undefined && dados.enderecoMac.length > MAC_MAXIMO) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo 'enderecoMac' deve ter até ${MAC_MAXIMO} caracteres.`);
  }
  return dados;
}

export async function criar(req: Request, res: Response) {
  try {
    const corpo = lerCorpo(req);
    const dados = lerDadosMaquina(corpo, true);
    const filialId = resolverFilial(req.escopo, corpo.filialId);
    return respostaSucesso(res, StatusCode.CREATED, await criarMaquina(req.escopo, { ...dados, filialId }));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    const id = lerId(req);
    const corpo = lerCorpo(req);
    const fora = Object.keys(corpo).find((campo) => !(CAMPOS_MAQUINA as readonly string[]).includes(campo));
    if (fora) throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${fora}' não pode ser alterado por esta rota.`);
    return respostaSucesso(res, StatusCode.OK, await atualizarMaquina(req.escopo, id, lerDadosMaquina(corpo, false)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.OK, await excluirMaquina(req.escopo, lerId(req)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
