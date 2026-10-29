import jwt from "jsonwebtoken";
import { User } from "../../schemas/user.js";
import { Company } from "../../schemas/company.js";
import { Operator } from "../../schemas/operator.js";
import { UserRepository } from "../user/userRepository.js";
import { CompanyRepository } from "../company/companyRepository.js";
import { OperatorRepository } from "../operator/operatorRepository.js";
import { carregarEscopo } from "../../core/escopo.js";
import { env } from "../../config/env.js";
import { verificarSenha } from "../../utils/senha.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";

type RoleLogin = "admin" | "colaborador";

export const CREDENCIAIS_INVALIDAS = "Credenciais inválidas.";

const usuarios = new UserRepository(User);
const empresas = new CompanyRepository(Company);
const operadores = new OperatorRepository(Operator);

export async function login(role: RoleLogin, login: string, senha: string) {
  if (!env.jwt_secret) {
    throw new Error("JWT_SECRET não configurado.");
  }

  const filtro = role === "admin"
    ? { role, email: login.trim().toLowerCase() }
    : { role, usuario: login.trim() };

  const usuario = await usuarios.obterUm(filtro, "+senhaHash");
  const senhaHash = usuario?.getSenhaHash();
  if (!usuario || !senhaHash || !verificarSenha(senha, senhaHash)) {
    throw new Error(CREDENCIAIS_INVALIDAS);
  }
  // Depois da senha: quem erra a senha não descobre que o acesso foi negado.
  if (usuario.getAcessoNegado()) throw new ErroHttp(StatusCode.FORBIDDEN, "Acesso negado.");

  const _id = String(usuario.getID());
  const token = jwt.sign({ sub: _id, role: usuario.getRole() }, env.jwt_secret, {
    expiresIn: env.jwt_expires_in as jwt.SignOptions["expiresIn"],
  });

  const empresaId = usuario.getEmpresaId();
  const escopo = await carregarEscopo({ empresaId, escopo: usuario.getEscopo(), filiaisIds: usuario.getFiliaisIds() });
  const empresa = empresaId ? await empresas.buscarPorId(empresaId) : null;
  // Só o colaborador tem operador; admin sempre null.
  const operadorId = usuario.getOperadorId();
  const operador = usuario.getRole() === "colaborador" && operadorId ? await operadores.buscarPorId(operadorId) : null;

  return {
    token,
    user: {
      _id,
      nome: usuario.getNome(),
      role: usuario.getRole(),
      email: usuario.getEmail(),
      telefone: usuario.getTelefone(),
      cargo: usuario.getCargo(),
      empresa: empresa && { _id: String(empresa.getID()), nome: empresa.getNome() },
      escopo: escopo.tipo,
      filiais: escopo.filiais,
      operador: operador && { _id: String(operador.getID()), nome: operador.getNome() },
    },
  };
}
