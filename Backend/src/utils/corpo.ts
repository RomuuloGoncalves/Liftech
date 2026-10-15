import { ErroHttp, StatusCode } from "./responseHandler.js";

// Corpo de update não pode levar operadores do Mongo ($set, $where...): eles contornariam as checagens de escopo.
export function exigirSemOperadores(corpo: Record<string, unknown>) {
  const chave = Object.keys(corpo).find((k) => k.startsWith("$"));
  if (chave) throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${chave}' não é permitido.`);
}
