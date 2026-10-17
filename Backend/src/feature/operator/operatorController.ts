import type { Request, Response } from "express";
import { Types as mongooseTypes } from "mongoose";
import { ErroHttp, StatusCode, respostaSucesso, responderErro } from "../../utils/responseHandler.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import { resolverFilial } from "../../core/escopo.js";
import { exigirAdmin as exigirAdminDoUsuario } from "../../core/autenticar.js";
import * as servicoOperador from "./operatorService.js";

// As rotas da equipe criam credenciais: só admin.
const exigirAdmin = (req: Request) => exigirAdminDoUsuario(req.usuario, "Apenas administradores podem gerenciar a equipe.");

const CAMPOS_LIVRES = ["nome", "telefone", "cargo", "horarioEntrada", "horarioSaida"] as const;
const NOME_MAXIMO = 80;
const TEXTO_MAXIMO = 40;
const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const USUARIO = /^\S{3,40}$/;
const SENHA_MINIMA = 8;
const SENHA_MAXIMA = 72;

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

// No POST o nome é obrigatório; os demais campos só são validados quando vierem. Horário vazio limpa o campo.
function lerDados(corpo: Record<string, unknown>, obrigatorio: boolean): servicoOperador.DadosOperador {
  const dados: servicoOperador.DadosOperador = {};
  for (const campo of CAMPOS_LIVRES) {
    const valor = corpo[campo];
    if (valor === undefined && !(obrigatorio && campo === "nome")) continue;
    const texto = typeof valor === "string" ? valor.trim() : undefined;
    if (campo === "nome") {
      if (!texto || texto.length > NOME_MAXIMO) throw erro(`O campo 'nome' é obrigatório e deve ter até ${NOME_MAXIMO} caracteres.`);
    } else if (campo === "horarioEntrada" || campo === "horarioSaida") {
      if (texto === undefined || (texto !== "" && !HORARIO.test(texto))) throw erro(`O campo '${campo}' deve estar no formato HH:mm.`);
    } else if (texto === undefined || texto.length > TEXTO_MAXIMO) {
      throw erro(`O campo '${campo}' deve ser texto de até ${TEXTO_MAXIMO} caracteres.`);
    }
    dados[campo] = texto;
  }
  return dados;
}

function lerSenha(valor: unknown): string {
  if (typeof valor !== "string" || valor.length < SENHA_MINIMA || valor.length > SENHA_MAXIMA) {
    throw erro(`O campo 'senha' deve ter de ${SENHA_MINIMA} a ${SENHA_MAXIMA} caracteres.`);
  }
  return valor;
}

export async function listar(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    const { filialId } = req.query;
    if (filialId !== undefined && (typeof filialId !== "string" || !mongooseTypes.ObjectId.isValid(filialId))) {
      throw erro("O filialId fornecido não é um ObjectId válido do MongoDB.");
    }
    return respostaSucesso(res, StatusCode.OK, await servicoOperador.listar(req.escopo, filialId));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function criar(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    const corpo = lerCorpo(req);
    const dados = lerDados(corpo, true);
    const filialId = resolverFilial(req.escopo, corpo.filialId);
    return respostaSucesso(res, StatusCode.CREATED, await servicoOperador.criar(req.escopo, { ...dados, filialId }));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    const id = lerId(req);
    const corpo = lerCorpo(req);
    const fora = Object.keys(corpo).find((campo) => !(CAMPOS_LIVRES as readonly string[]).includes(campo));
    if (fora) throw erro(`O campo '${fora}' não pode ser alterado.`);
    return respostaSucesso(res, StatusCode.OK, await servicoOperador.atualizar(req.escopo, id, lerDados(corpo, false)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function deletar(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    return respostaSucesso(res, StatusCode.OK, await servicoOperador.excluir(req.escopo, lerId(req)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function criarLogin(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    const id = lerId(req);
    const { usuario, senha } = lerCorpo(req);
    if (typeof usuario !== "string" || !USUARIO.test(usuario)) {
      throw erro("O campo 'usuario' deve ter de 3 a 40 caracteres, sem espaços.");
    }
    return respostaSucesso(res, StatusCode.CREATED, await servicoOperador.criarLogin(req.escopo, id, { usuario, senha: lerSenha(senha) }));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function atualizarLogin(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    const id = lerId(req);
    const { senha, acessoNegado } = lerCorpo(req);
    if (senha === undefined && acessoNegado === undefined) throw erro("Informe 'senha' ou 'acessoNegado'.");
    if (acessoNegado !== undefined && typeof acessoNegado !== "boolean") throw erro("O campo 'acessoNegado' deve ser true ou false.");
    const dados = {
      ...(senha !== undefined && { senha: lerSenha(senha) }),
      ...(acessoNegado !== undefined && { acessoNegado }),
    };
    return respostaSucesso(res, StatusCode.OK, await servicoOperador.atualizarLogin(req.escopo, id, dados));
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function removerLogin(req: Request, res: Response) {
  try {
    exigirAdmin(req);
    return respostaSucesso(res, StatusCode.OK, await servicoOperador.removerLogin(req.escopo, lerId(req)));
  } catch (error: any) {
    return responderErro(res, error);
  }
}
