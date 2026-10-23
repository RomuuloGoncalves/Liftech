import { randomBytes } from "node:crypto";
import { AccessRequest } from "../../schemas/accessRequest.js";
import { Company } from "../../schemas/company.js";
import { Branch } from "../../schemas/branch.js";
import { User } from "../../schemas/user.js";
import { MATRIZ_NOME } from "../../scripts/seedDataset.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { gerarHashSenha } from "../../utils/senha.js";

export type StatusFiltro = "pendente" | "aprovada" | "recusada";

export function gerarSenhaInicial(): string {
  return randomBytes(9).toString("base64url");
}

async function naoPendente(id: string): Promise<never> {
  const existe = await AccessRequest.exists({ _id: id });
  if (existe) {
    throw new ErroHttp(StatusCode.CONFLICT, "Solicitação já decidida.");
  }
  throw new ErroHttp(StatusCode.NOT_FOUND, "Solicitação não encontrada.");
}

export async function listar(status?: StatusFiltro) {
  const filtro: Record<string, unknown> = status ? { status } : { status: "pendente" };
  const sort = status ? { createdAt: -1 as const } : { createdAt: 1 as const };
  return (AccessRequest as any).find(filtro).sort(sort).lean();
}

// ponytail: claim + compensação sem transação; um crash entre o claim e o passo 5 deixa a solicitação em 'aprovando' (fora das abas). Trocar por transação quando houver replica set.
export async function aprovar(id: string) {
  const solicitacao: any = await AccessRequest.findOneAndUpdate(
    { _id: id, status: "pendente" },
    { $set: { status: "aprovando" } },
    { returnDocument: "after" }
  ).lean();

  if (!solicitacao) {
    return await naoPendente(id);
  }

  let companyCriada: any = null;
  let branchCriada: any = null;
  let userCriado: any = null;

  try {
    const email = solicitacao.email.trim().toLowerCase();
    const nomeEmpresa = solicitacao.nomeEmpresa.trim();
    const nomeAdministrador = solicitacao.nomeAdministrador.trim();

    if (await User.exists({ email })) {
      throw new ErroHttp(StatusCode.CONFLICT, "Já existe um usuário com este e-mail.");
    }
    if (await Company.exists({ nome: nomeEmpresa })) {
      throw new ErroHttp(StatusCode.CONFLICT, "Já existe uma empresa com este nome.");
    }

    const senhaInicial = gerarSenhaInicial();
    const senhaHash = gerarHashSenha(senhaInicial);

    try {
      companyCriada = await Company.create({ nome: nomeEmpresa });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ErroHttp(StatusCode.CONFLICT, "Já existe uma empresa com este nome.");
      }
      throw err;
    }

    const empresaId = companyCriada._id;

    branchCriada = await Branch.create({
      nome: MATRIZ_NOME,
      empresaId,
      matriz: true,
    });

    try {
      userCriado = await User.create({
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
    const aprovada = await AccessRequest.findOneAndUpdate(
      { _id: id },
      { $set: { status: "aprovada", empresaId, decididaEm } },
      { returnDocument: "after" }
    ).lean();

    return {
      ...aprovada,
      senhaInicial,
    };
  } catch (error) {
    if (userCriado) {
      await User.deleteOne({ _id: userCriado._id }).catch(() => {});
    }
    if (branchCriada) {
      await Branch.deleteOne({ _id: branchCriada._id }).catch(() => {});
    }
    if (companyCriada) {
      await Company.deleteOne({ _id: companyCriada._id }).catch(() => {});
    }

    await AccessRequest.updateOne(
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

  const recusada = await AccessRequest.findOneAndUpdate(
    { _id: id, status: "pendente" },
    { $set: setPayload },
    { returnDocument: "after" }
  ).lean();

  if (!recusada) {
    return await naoPendente(id);
  }

  return recusada;
}
