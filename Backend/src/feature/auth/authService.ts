import jwt from "jsonwebtoken";
import { User } from "../../schemas/user.js";
import { Company } from "../../schemas/company.js";
import { Operator } from "../../schemas/operator.js";
import { carregarEscopo } from "../../core/escopo.js";
import { env } from "../../config/env.js";
import { verificarSenha } from "../../utils/senha.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";

export type RoleLogin = "admin" | "colaborador";

export const CREDENCIAIS_INVALIDAS = "Credenciais inválidas.";

export async function login(role: RoleLogin, login: string, senha: string) {
  if (!env.jwt_secret) {
    throw new Error("JWT_SECRET não configurado.");
  }

  const filtro = role === "admin"
    ? { role, email: login.trim().toLowerCase() }
    : { role, usuario: login.trim() };

  const usuario = await User.findOne(filtro).select("+senhaHash").lean();
  if (!usuario?.senhaHash || !verificarSenha(senha, usuario.senhaHash)) {
    throw new Error(CREDENCIAIS_INVALIDAS);
  }
  // Depois da senha: quem erra a senha não descobre que o acesso foi negado.
  if (usuario.acessoNegado) throw new ErroHttp(StatusCode.FORBIDDEN, "Acesso negado.");

  const _id = String(usuario._id);
  const token = jwt.sign({ sub: _id, role: usuario.role }, env.jwt_secret, {
    expiresIn: env.jwt_expires_in as jwt.SignOptions["expiresIn"],
  });

  const escopo = await carregarEscopo(usuario);
  const empresa = usuario.empresaId ? await Company.findById(usuario.empresaId).lean() : null;
  // Só o colaborador tem operador; admin sempre null.
  const operador = usuario.role === "colaborador" && usuario.operadorId ? await Operator.findById(usuario.operadorId).lean() : null;

  return {
    token,
    user: {
      _id,
      nome: usuario.nome,
      role: usuario.role,
      telefone: usuario.telefone,
      cargo: usuario.cargo,
      empresa: empresa && { _id: String(empresa._id), nome: empresa.nome },
      escopo: escopo.tipo,
      filiais: escopo.filiais,
      operador: operador && { _id: String(operador._id), nome: operador.nome },
    },
  };
}
