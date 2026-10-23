import type { Request, Response } from "express";
import {
  validarAtualizacao,
  validarExclusao,
  atualizarConta,
  excluirConta,
} from "./meService.js";
import {
  respostaSucesso,
  responderErro,
  StatusCode,
} from "../../utils/responseHandler.js";

export async function atualizar(req: Request, res: Response) {
  try {
    const dados = validarAtualizacao(req.body);
    const resultado = await atualizarConta(req.usuario, dados);
    return respostaSucesso(res, StatusCode.OK, resultado);
  } catch (error: any) {
    return responderErro(res, error);
  }
}

export async function excluir(req: Request, res: Response) {
  try {
    const dados = validarExclusao(req.body);
    await excluirConta(req.usuario, req.escopo?.empresaId, dados.senhaAtual);
    return respostaSucesso(res, StatusCode.OK, {
      _id: req.usuario._id,
      message: "Conta excluída com sucesso.",
    });
  } catch (error: any) {
    return responderErro(res, error);
  }
}
