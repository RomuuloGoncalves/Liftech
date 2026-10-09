import jwt from "jsonwebtoken";
import { User } from "../../schemas/user.js";
import { env } from "../../config/env.js";
import { verificarSenha } from "../../utils/senha.js";

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

  const _id = String(usuario._id);
  const token = jwt.sign({ sub: _id, role: usuario.role }, env.jwt_secret, {
    expiresIn: env.jwt_expires_in as jwt.SignOptions["expiresIn"],
  });

  return { token, user: { _id, nome: usuario.nome, role: usuario.role } };
}
