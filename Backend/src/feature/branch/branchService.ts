import type { Model } from "mongoose";
import { Branch } from "../../schemas/branch.js";
import { Forklift } from "../../schemas/forklift.js";
import { Device } from "../../schemas/device.js";
import { Operator } from "../../schemas/operator.js";
import { Incident } from "../../schemas/incident.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import type { Escopo } from "../../core/escopo.js";

const paraFilial = (f: any) => ({ _id: String(f._id), nome: f.nome, matriz: f.matriz });

const naoEncontrada = () => new ErroHttp(StatusCode.NOT_FOUND, "Filial não encontrada.");

// O índice único { empresaId, nome } faz o Mongo recusar o nome repetido (código 11000).
function traduzirErro(error: any): never {
  throw error.code === 11000 ? new ErroHttp(StatusCode.CONFLICT, "Já existe uma filial com este nome.") : error;
}

export async function criar(escopo: Escopo, nome: string) {
  try {
    return paraFilial(await Branch.create({ nome, empresaId: escopo.empresaId }));
  } catch (error) {
    return traduzirErro(error);
  }
}

export async function renomear(escopo: Escopo, id: string, nome: string) {
  try {
    const filial = await Branch.findOneAndUpdate(
      { _id: id, empresaId: escopo.empresaId },
      { nome },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!filial) throw naoEncontrada();
    return paraFilial(filial);
  } catch (error) {
    return traduzirErro(error);
  }
}

// ponytail: checa os vínculos e depois apaga, sem transação; uma empilhadeira criada entre os dois passos ficaria órfã.
export async function excluir(escopo: Escopo, id: string) {
  const filial = await Branch.findOne({ _id: id, empresaId: escopo.empresaId }).lean();
  if (!filial) throw naoEncontrada();
  if (filial.matriz) throw new ErroHttp(StatusCode.CONFLICT, "A filial matriz não pode ser excluída.");

  const recursos: Model<any>[] = [Forklift, Device, Operator, Incident];
  const vinculos = await Promise.all(recursos.map((m) => m.exists({ filialId: id })));
  if (vinculos.some(Boolean)) {
    throw new ErroHttp(StatusCode.CONFLICT, "A filial ainda tem empilhadeiras, dispositivos, operadores ou incidentes.");
  }

  await Branch.deleteOne({ _id: id });
  return { _id: id, message: "Filial excluída com sucesso." };
}
