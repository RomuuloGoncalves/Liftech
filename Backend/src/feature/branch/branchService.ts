import { Branch } from "../../schemas/branch.js";
import { Forklift } from "../../schemas/forklift.js";
import { Device } from "../../schemas/device.js";
import { Operator } from "../../schemas/operator.js";
import { Incident } from "../../schemas/incident.js";
import { branchModel } from "../../models/branchModel.js";
import { BranchRepository } from "./branchRepository.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { DeviceRepository } from "../device/deviceRepository.js";
import { OperatorRepository } from "../operator/operatorRepository.js";
import { IncidentRepository } from "../incident/incidentRepository.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import type { Escopo } from "../../core/escopo.js";

const filiais = new BranchRepository(Branch);
// Recursos que prendem a filial: com qualquer um deles ligado, ela não pode ser excluída.
const recursos = [new ForkliftRepository(Forklift), new DeviceRepository(Device), new OperatorRepository(Operator), new IncidentRepository(Incident)];

const paraFilial = (f: branchModel) => ({ _id: String(f.getID()), nome: f.getNome(), matriz: f.getMatriz() });

const naoEncontrada = () => new ErroHttp(StatusCode.NOT_FOUND, "Filial não encontrada.");

// O índice único { empresaId, nome } faz o Mongo recusar o nome repetido (código 11000).
function traduzirErro(error: any): never {
  throw error.code === 11000 ? new ErroHttp(StatusCode.CONFLICT, "Já existe uma filial com este nome.") : error;
}

export async function criar(escopo: Escopo, nome: string) {
  try {
    return paraFilial((await filiais.criar(new branchModel(nome, escopo.empresaId)))!);
  } catch (error) {
    return traduzirErro(error);
  }
}

export async function renomear(escopo: Escopo, id: string, nome: string) {
  try {
    const filial = await filiais.atualizarPorId(id, { nome }, { returnDocument: "after", runValidators: true }, { empresaId: escopo.empresaId });
    if (!filial) throw naoEncontrada();
    return paraFilial(filial);
  } catch (error) {
    return traduzirErro(error);
  }
}

// ponytail: checa os vínculos e depois apaga, sem transação; uma empilhadeira criada entre os dois passos ficaria órfã.
export async function excluir(escopo: Escopo, id: string) {
  const filial = await filiais.obterPorId(id, { empresaId: escopo.empresaId });
  if (!filial) throw naoEncontrada();
  if (filial.getMatriz()) throw new ErroHttp(StatusCode.CONFLICT, "A filial matriz não pode ser excluída.");

  const vinculos = await Promise.all(recursos.map((r) => r.existe({ filialId: id })));
  if (vinculos.some(Boolean)) {
    throw new ErroHttp(StatusCode.CONFLICT, "A filial ainda tem empilhadeiras, dispositivos, operadores ou incidentes.");
  }

  await filiais.deletarUm({ _id: id });
  return { _id: id, message: "Filial excluída com sucesso." };
}
