import { Feedback } from "../../schemas/feedback.js";
import type { UsuarioRequisicao } from "../../core/autenticar.js";
import type { Escopo } from "../../core/escopo.js";

export async function enviar(
  usuario: UsuarioRequisicao,
  escopo: Escopo,
  mensagem: string
): Promise<{ _id: string; criadoEm: string }> {
  const doc = await Feedback.create({
    mensagem,
    usuarioId: usuario._id,
    empresaId: escopo.empresaId ?? null,
    role: usuario.role,
  });

  const criadoEm =
    doc.criadoEm instanceof Date
      ? doc.criadoEm.toISOString()
      : new Date(doc.criadoEm).toISOString();

  return {
    _id: String(doc._id),
    criadoEm,
  };
}

export const feedbackService = {
  enviar,
};
