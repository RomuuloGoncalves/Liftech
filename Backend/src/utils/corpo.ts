import type { Request } from "express";
import { ErroHttp, StatusCode } from "./responseHandler.js";

// Corpo de update não pode levar operadores do Mongo ($set, $where...): eles contornariam as checagens de escopo.
export function exigirSemOperadores(corpo: Record<string, unknown>) {
  const chave = Object.keys(corpo).find((k) => k.startsWith("$"));
  if (chave) throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${chave}' não é permitido.`);
}

// Id da rota (`:id`) ou, na falta dele, `_id`/`id` do corpo.
export function obterIdDaRequisicao(req: Request): string | null {
  if (typeof req.params.id === "string" && req.params.id) return req.params.id;

  const corpo = req.body as { _id?: unknown; id?: unknown } | undefined;
  if (typeof corpo?._id === "string" && corpo._id) return corpo._id;
  if (typeof corpo?.id === "string" && corpo.id) return corpo.id;
  return null;
}
