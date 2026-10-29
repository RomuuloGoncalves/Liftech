import { randomBytes } from "node:crypto";
import { AccessRequest } from "../../schemas/accessRequest.js";
import { Company } from "../../schemas/company.js";
import { Branch } from "../../schemas/branch.js";
import { User } from "../../schemas/user.js";
import { MATRIZ_NOME } from "../../scripts/seedDataset.js";
import { companyModel } from "../../models/companyModel.js";
import { branchModel } from "../../models/branchModel.js";
import type { userModel } from "../../models/userModel.js";
import { AccessRequestRepository } from "./accessRequestRepository.js";
import { CompanyRepository } from "../company/companyRepository.js";
import { BranchRepository } from "../branch/branchRepository.js";
import { UserRepository } from "../user/userRepository.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { gerarHashSenha } from "../../utils/senha.js";

export type StatusFiltro = "pendente" | "aprovada" | "recusada";

const solicitacoes = new AccessRequestRepository(AccessRequest);
const empresas = new CompanyRepository(Company);
const filiais = new BranchRepository(Branch);
const usuarios = new UserRepository(User);

export function gerarSenhaInicial(): string {
  return randomBytes(9).toString("base64url");
}

async function naoPendente(id: string): Promise<never> {
  const existe = await solicitacoes.existe({ _id: id });
  if (existe) {
    throw new ErroHttp(StatusCode.CONFLICT, "Solicitação já decidida.");
  }
  throw new ErroHttp(StatusCode.NOT_FOUND, "Solicitação não encontrada.");
}

export async function listar(status?: StatusFiltro) {
  const filtro: Record<string, unknown> = status ? { status } : { status: "pendente" };
  const ordenacao = status ? { createdAt: -1 as const } : { createdAt: 1 as const };
  const lista = await solicitacoes.obterTodos(filtro, { ordenacao });
  return lista.map((s) => s.obterDados());
}

// ponytail: claim + compensação sem transação; um crash entre o claim e o passo 5 deixa a solicitação em 'aprovando' (fora das abas). Trocar por transação quando houver replica set.
export async function aprovar(id: string) {
  const solicitacao = await solicitacoes.atualizarPorId(
    id,
    { $set: { status: "aprovando" } },
    { returnDocument: "after" },
    { status: "pendente" }
  );

  if (!solicitacao) {
    return await naoPendente(id);
  }

  let companyCriada: companyModel | null = null;
  let branchCriada: branchModel | null = null;
  let userCriado: userModel | null = null;

  try {
    const email = solicitacao.getEmail().trim().toLowerCase();
    const nomeEmpresa = solicitacao.getNomeEmpresa().trim();
    const nomeAdministrador = solicitacao.getNomeAdministrador().trim();

    if (await usuarios.existe({ email })) {
      throw new ErroHttp(StatusCode.CONFLICT, "Já existe um usuário com este e-mail.");
    }
    if (await empresas.existe({ nome: nomeEmpresa })) {
      throw new ErroHttp(StatusCode.CONFLICT, "Já existe uma empresa com este nome.");
    }

    const senhaInicial = gerarSenhaInicial();
    const senhaHash = gerarHashSenha(senhaInicial);

    try {
      companyCriada = await empresas.criar(new companyModel(nomeEmpresa));
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ErroHttp(StatusCode.CONFLICT, "Já existe uma empresa com este nome.");
      }
      throw err;
    }

    const empresaId = companyCriada?.getID();

    branchCriada = await filiais.criar(new branchModel(MATRIZ_NOME, empresaId, true));

    try {
      userCriado = await usuarios.criarComCredenciais({
        nome: nomeAdministrador,
        email,
        role: "admin",
        escopo: "empresa",
        empresaId,
        senhaHash,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ErroHttp(StatusCode.CONFLICT, "Já existe um usuário com este e-mail.");
      }
      throw err;
    }

    const decididaEm = new Date();
    const aprovada = await solicitacoes.atualizarPorId(
      id,
      { $set: { status: "aprovada", empresaId, decididaEm } },
      { returnDocument: "after" }
    );

    return {
      ...aprovada?.obterDados(),
      senhaInicial,
    };
  } catch (error) {
    if (userCriado) {
      await usuarios.deletarUm({ _id: userCriado.getID() }).catch(() => {});
    }
    if (branchCriada) {
      await filiais.deletarUm({ _id: branchCriada.getID() }).catch(() => {});
    }
    if (companyCriada) {
      await empresas.deletarUm({ _id: companyCriada.getID() }).catch(() => {});
    }

    await solicitacoes.atualizarUm(
      { _id: id, status: "aprovando" },
      { $set: { status: "pendente" } }
    ).catch(() => {});

    throw error;
  }
}

export async function recusar(id: string, motivo?: string) {
  const motivoNormalizado = motivo?.trim();
  const setPayload: Record<string, unknown> = {
    status: "recusada",
    decididaEm: new Date(),
  };
  if (motivoNormalizado && motivoNormalizado.length > 0) {
    setPayload.motivoRecusa = motivoNormalizado;
  }

  const recusada = await solicitacoes.atualizarPorId(
    id,
    { $set: setPayload },
    { returnDocument: "after" },
    { status: "pendente" }
  );

  if (!recusada) {
    return await naoPendente(id);
  }

  return recusada.obterDados();
}
