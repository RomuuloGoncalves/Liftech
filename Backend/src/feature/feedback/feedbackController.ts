import type { Request, Response } from "express";
import {
  ErroHttp,
  StatusCode,
  respostaSucesso,
  responderErro,
} from "../../utils/responseHandler.js";
import * as feedbackService from "./feedbackService.js";

const TAMANHO_MAXIMO = 1000;
const ERRO_MENSAGEM = "O campo 'mensagem' deve ter de 1 a 1000 caracteres.";

function lerMensagem(req: Request): string {
  const mensagem = req.body?.mensagem;
  if (typeof mensagem !== "string") {
    throw new ErroHttp(StatusCode.BAD_REQUEST, ERRO_MENSAGEM);
  }
  const mensagemCortada = mensagem.trim();
  if (mensagemCortada.length === 0 || mensagemCortada.length > TAMANHO_MAXIMO) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, ERRO_MENSAGEM);
  }
  return mensagemCortada;
}

export async function enviar(req: Request, res: Response) {
  try {
    const mensagem = lerMensagem(req);
    const resultado = await feedbackService.enviar(
      req.usuario,
      req.escopo,
      mensagem
    );
    return respostaSucesso(res, StatusCode.CREATED, resultado);
  } catch (error: any) {
    return responderErro(res, error);
  }
}
