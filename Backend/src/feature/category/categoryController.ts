import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { ErroHttp, StatusCode, respostaSucesso, responderErro } from "../../utils/responseHandler.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import { exigirEmpresa as exigirEmpresaDoEscopo } from "../../core/escopo.js";
import * as servicoCategoria from "./categoryService.js";

// Só o escopo de empresa cria, edita e exclui categorias; todos da empresa leem.
const exigirEmpresa = (req: Request) => exigirEmpresaDoEscopo(req.escopo, "Apenas o escopo de empresa pode gerenciar categorias.");

const NOME_MAXIMO = 40;
const COR = /^#[0-9a-fA-F]{6}$/;

function lerId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !mongooseTypes.ObjectId.isValid(id)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O ID fornecido não é um ObjectId válido do MongoDB.");
  }
  return id;
}

// No POST nome e cor são obrigatórios; no PUT só são validados quando vierem.
function lerDados(req: Request, obrigatorio: boolean): servicoCategoria.DadosCategoria {
  const corpo = (req.body ?? {}) as Record<string, unknown>;
  exigirSemOperadores(corpo);
  const dados: servicoCategoria.DadosCategoria = {};

  if (obrigatorio || corpo.nome !== undefined) {
    const nome = typeof corpo.nome === "string" ? corpo.nome.trim() : "";
    if (nome.length === 0 || nome.length > NOME_MAXIMO) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo 'nome' é obrigatório e deve ter até ${NOME_MAXIMO} caracteres.`);
    }
    dados.nome = nome;
  }
  if (obrigatorio || corpo.cor !== undefined) {
    if (typeof corpo.cor !== "string" || !COR.test(corpo.cor)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'cor' deve estar no formato #RRGGBB.");
    }
    dados.cor = corpo.cor;
  }
  if (corpo.statusVinculados !== undefined) dados.statusVinculados = corpo.statusVinculados;
  return dados;
}

export async function listar(req: Request, res: Response) {
  try {
    return respostaSucesso(res, StatusCode.OK, await servicoCategoria.listar(req.escopo));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    exigirEmpresa(req);
    return respostaSucesso(res, StatusCode.CREATED, await servicoCategoria.criar(req.escopo, lerDados(req, true)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    exigirEmpresa(req);
    const id = lerId(req);
    return respostaSucesso(res, StatusCode.OK, await servicoCategoria.atualizar(req.escopo, id, lerDados(req, false)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    exigirEmpresa(req);
    return respostaSucesso(res, StatusCode.OK, await servicoCategoria.excluir(req.escopo, lerId(req)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
