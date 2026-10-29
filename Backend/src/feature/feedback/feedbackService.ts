import { Feedback } from "../../schemas/feedback.js";
import { feedbackModel } from "../../models/feedbackModel.js";
import { FeedbackRepository } from "./feedbackRepository.js";
import type { UsuarioRequisicao } from "../../core/autenticar.js";
import type { Escopo } from "../../core/escopo.js";

const repositorio = new FeedbackRepository(Feedback);

export async function enviar(
  usuario: UsuarioRequisicao,
  escopo: Escopo,
  mensagem: string
): Promise<{ _id: string; criadoEm: string }> {
  const criado = await repositorio.criar(new feedbackModel(mensagem, usuario._id, escopo.empresaId ?? null, usuario.role));

  return {
    _id: String(criado?.getID()),
    criadoEm: new Date(criado?.getCriadoEm() as Date).toISOString(),
  };
}

export const feedbackService = {
  enviar,
};
