import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { ErroHttp, StatusCode, respostaSucesso, responderErro } from "../../utils/responseHandler.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import { resolverFilial } from "../../core/escopo.js";
import { exigirAdmin as exigirAdminDoUsuario } from "../../core/autenticar.js";
import * as servicoSetor from "./sectorService.js";

// Todos do escopo leem (o colaborador também); só admin cria, edita e exclui.
const exigirAdmin = (req: Request) => exigirAdminDoUsuario(req.usuario, "Apenas administradores podem gerenciar setores.");

const NOME_MAXIMO = 60;
const CAMPOS_EDITAVEIS = ["nome", "filialId"];

const erro = (mensagem: string) => new ErroHttp(StatusCode.BAD_REQUEST, mensagem);

function lerId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !mongooseTypes.ObjectId.isValid(id)) {
    throw erro("O ID fornecido não é um ObjectId válido do MongoDB.");
  }
  return id;
}

function lerCorpo(req: Request): Record<string, unknown> {
  const corpo = (req.body ?? {}) as Record<string, unknown>;
  exigirSemOperadores(corpo);
  return corpo;
}

function lerNome(valor: unknown): string {
  const nome = typeof valor === "string" ? valor.trim() : "";
  if (nome.length === 0 || nome.length > NOME_MAXIMO) {
    throw erro(`O campo 'nome' é obrigatório e deve ter até ${NOME_MAXIMO} caracteres.`);
  }
  return nome;
}

export async function listar(req: Request, res: Response) {
  try {
    const { filialId } = req.query;
    if (filialId !== undefined && (typeof filialId !== "string" || !mongooseTypes.ObjectId.isValid(filialId))) {
      throw erro("O filialId fornecido não é um ObjectId válido do MongoDB.");
    }
    return respostaSucesso(res, StatusCode.OK, await servicoSetor.listar(req.escopo, filialId));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    const corpo = lerCorpo(req);
    const nome = lerNome(corpo.nome);
    const filialId = resolverFilial(req.escopo, corpo.filialId);
    return respostaSucesso(res, StatusCode.CREATED, await servicoSetor.criar(req.escopo, { nome, filialId }));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

// A filial nova é conferida no service, que sabe se ela mudou (só o escopo empresa move).
export async function atualizar(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    const id = lerId(req);
    const corpo = lerCorpo(req);
    const fora = Object.keys(corpo).find((campo) => !CAMPOS_EDITAVEIS.includes(campo));
    if (fora) throw erro(`O campo '${fora}' não pode ser alterado.`);
    const dados: servicoSetor.DadosSetor = {
      ...(corpo.nome !== undefined && { nome: lerNome(corpo.nome) }),
      ...(corpo.filialId !== undefined && { filialId: corpo.filialId }),
    };
    return respostaSucesso(res, StatusCode.OK, await servicoSetor.atualizar(req.escopo, id, dados));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    return respostaSucesso(res, StatusCode.OK, await servicoSetor.excluir(req.escopo, lerId(req)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
