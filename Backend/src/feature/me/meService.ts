import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { exigirSemOperadores } from "../../utils/corpo.js";
import { User } from "../../schemas/user.js";
import { exigirAdmin, type UsuarioRequisicao } from "../../core/autenticar.js";
import { verificarSenha, gerarHashSenha } from "../../utils/senha.js";

export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CAMPOS_PERMITIDOS_ATUALIZACAO = ["senhaAtual", "email", "novaSenha"];

export interface DadosAtualizacao {
  senhaAtual: string;
  email?: string;
  novaSenha?: string;
}

export interface DadosExclusao {
  senhaAtual: string;
}

export function validarAtualizacao(corpo: unknown): DadosAtualizacao {
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "Corpo de requisição inválido.");
  }

  const registro = corpo as Record<string, unknown>;
  exigirSemOperadores(registro);

  const chaves = Object.keys(registro);
  const proibida = chaves.find((k) => !CAMPOS_PERMITIDOS_ATUALIZACAO.includes(k));
  if (proibida) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${proibida}' não é permitido.`);
  }

  if (typeof registro.senhaAtual !== "string" || registro.senhaAtual.trim().length === 0) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'senhaAtual' é obrigatório e deve ser texto válido.");
  }

  if (registro.email === undefined && registro.novaSenha === undefined) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "É necessário informar 'email' ou 'novaSenha' para atualização.");
  }

  let emailNormalizado: string | undefined;
  if (registro.email !== undefined) {
    if (typeof registro.email !== "string") {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'email' deve ser um email válido.");
    }
    const trimEmail = registro.email.trim().toLowerCase();
    if (!REGEX_EMAIL.test(trimEmail)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'email' deve ser um email válido.");
    }
    emailNormalizado = trimEmail;
  }

  if (registro.novaSenha !== undefined) {
    if (typeof registro.novaSenha !== "string" || registro.novaSenha.length < 8) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'novaSenha' deve ter no mínimo 8 caracteres.");
    }
  }

  return {
    senhaAtual: registro.senhaAtual,
    ...(emailNormalizado !== undefined ? { email: emailNormalizado } : {}),
    ...(registro.novaSenha !== undefined ? { novaSenha: registro.novaSenha as string } : {}),
  };
}

export function validarExclusao(corpo: unknown): DadosExclusao {
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "Corpo de requisição inválido.");
  }

  const registro = corpo as Record<string, unknown>;
  exigirSemOperadores(registro);

  const chaves = Object.keys(registro);
  const proibida = chaves.find((k) => k !== "senhaAtual");
  if (proibida) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${proibida}' não é permitido.`);
  }

  if (typeof registro.senhaAtual !== "string" || registro.senhaAtual.trim().length === 0) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'senhaAtual' é obrigatório e deve ser texto válido.");
  }

  return {
    senhaAtual: registro.senhaAtual,
  };
}

export async function atualizarConta(
  usuario: UsuarioRequisicao,
  dados: DadosAtualizacao
): Promise<{ email: string }> {
  exigirAdmin(usuario, "Apenas administradores podem atualizar os dados de conta.");

  const usuarioDb = await User.findById(usuario._id).select("+senhaHash").lean();
  if (!usuarioDb) {
    throw new ErroHttp(StatusCode.NOT_FOUND, "Usuário não encontrado(a).");
  }

  if (!usuarioDb.senhaHash || !verificarSenha(dados.senhaAtual, usuarioDb.senhaHash)) {
    throw new ErroHttp(StatusCode.FORBIDDEN, "Senha atual incorreta.");
  }

  const updateFields: Record<string, unknown> = {};
  if (dados.email !== undefined) {
    updateFields.email = dados.email;
  }
  if (dados.novaSenha !== undefined) {
    updateFields.senhaHash = gerarHashSenha(dados.novaSenha);
  }

  try {
    await User.updateOne({ _id: usuario._id }, { $set: updateFields });
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new ErroHttp(StatusCode.CONFLICT, "E-mail já em uso.");
    }
    throw error;
  }

  return {
    email: dados.email ?? (usuarioDb.email || ""),
  };
}

export async function excluirConta(
  usuario: UsuarioRequisicao,
  empresaId: string | undefined,
  senhaAtual: string
): Promise<void> {
  exigirAdmin(usuario, "Apenas administradores podem excluir a conta.");

  const usuarioDb = await User.findById(usuario._id).select("+senhaHash").lean();
  if (!usuarioDb) {
    throw new ErroHttp(StatusCode.NOT_FOUND, "Usuário não encontrado(a).");
  }

  if (!usuarioDb.senhaHash || !verificarSenha(senhaAtual, usuarioDb.senhaHash)) {
    throw new ErroHttp(StatusCode.FORBIDDEN, "Senha atual incorreta.");
  }

  if (!empresaId) {
    throw new ErroHttp(StatusCode.CONFLICT, "Você é o único administrador da empresa.");
  }

  const outrosAdmins = await User.countDocuments({
    empresaId,
    role: "admin",
    _id: { $ne: usuario._id },
    email: { $exists: true },
    acessoNegado: { $ne: true },
  });

  if (outrosAdmins === 0) {
    throw new ErroHttp(StatusCode.CONFLICT, "Você é o único administrador da empresa.");
  }

  // ponytail: count + delete sem transação; usar transação se houver muitos admins
  await User.deleteOne({ _id: usuario._id });
}
