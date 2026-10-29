import { AccessRequest } from "../../schemas/accessRequest.js";
import { accessRequestModel } from "../../models/accessRequestModel.js";
import { AccessRequestRepository } from "./accessRequestRepository.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";

export interface DadosSolicitacao {
  email: string;
  nomeEmpresa: string;
  nomeAdministrador: string;
}

const solicitacoes = new AccessRequestRepository(AccessRequest);

// Pedido público de acesso (tela "Solicite o acesso"): um pendente por email.
export async function solicitar(dados: DadosSolicitacao) {
  const email = dados.email.trim().toLowerCase();

  if (await solicitacoes.obterUm({ email, status: "pendente" })) {
    throw new ErroHttp(StatusCode.CONFLICT, "Já existe uma solicitação pendente para este email.");
  }

  const criada = await solicitacoes.criar(new accessRequestModel({
    email,
    nomeEmpresa: dados.nomeEmpresa.trim(),
    nomeAdministrador: dados.nomeAdministrador.trim(),
  }));
  return criada?.obterDados();
}
