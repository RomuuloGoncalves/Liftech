import { Sector } from "../../schemas/sector.js";
import { Forklift } from "../../schemas/forklift.js";
import { exigirEmpresa, filtroPorFilial, resolverFilial, type Escopo } from "../../core/escopo.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";

export interface DadosSetor {
  nome?: string;
  filialId?: unknown;
}

// O nome da filial vem do escopo: todo setor listado é de uma filial do escopo.
const paraSetor = (escopo: Escopo, s: any) => {
  const filialId = String(s.filialId);
  return {
    _id: String(s._id),
    nome: s.nome,
    filialId,
    filial: { nome: escopo.filiais.find((f) => f._id === filialId)?.nome ?? "" },
  };
};

const naoEncontrado = () => new ErroHttp(StatusCode.NOT_FOUND, "Setor não encontrado.");

// O índice único { filialId, nome } (sem caixa) faz o Mongo recusar o nome repetido (código 11000).
function traduzirErro(error: any): never {
  throw error.code === 11000 ? new ErroHttp(StatusCode.CONFLICT, "Já existe um setor com este nome nesta filial.") : error;
}

const contarMaquinas = (id: string) => Forklift.countDocuments({ setorId: id });

// `filialId` (filtro da tela) só reduz o escopo: a interseção nunca amplia o que o chamador vê.
export async function listar(escopo: Escopo, filialId?: string) {
  const permitidas = filtroPorFilial(escopo).filialId.$in;
  const filiais = filialId ? permitidas.filter((id) => id === filialId) : permitidas;
  const setores = await Sector.find({ filialId: { $in: filiais } }).sort({ nome: 1 }).lean();
  return setores.map((s) => paraSetor(escopo, s));
}

export async function criar(escopo: Escopo, dados: { nome: string; filialId: string }) {
  try {
    return paraSetor(escopo, await Sector.create(dados));
  } catch (error) {
    return traduzirErro(error);
  }
}

// Mudar de filial é só do escopo empresa e só sem máquinas ligadas, senão elas ficariam com setor de outra filial.
export async function atualizar(escopo: Escopo, id: string, dados: DadosSetor) {
  const setor: any = await Sector.findOne({ _id: id, ...filtroPorFilial(escopo) }).lean();
  if (!setor) throw naoEncontrado();

  const alteracoes: Record<string, unknown> = {};
  if (dados.nome !== undefined) alteracoes.nome = dados.nome;
  if (dados.filialId !== undefined && dados.filialId !== String(setor.filialId)) {
    exigirEmpresa(escopo, "Apenas o escopo de empresa pode mover um setor de filial.");
    alteracoes.filialId = resolverFilial(escopo, dados.filialId);
    const maquinas = await contarMaquinas(id);
    if (maquinas > 0) {
      throw new ErroHttp(StatusCode.CONFLICT, `Setor com ${maquinas} máquina(s) ligada(s) não pode mudar de filial.`);
    }
  }

  try {
    const atualizado = await Sector.findOneAndUpdate({ _id: id }, { $set: alteracoes }, { returnDocument: "after", runValidators: true }).lean();
    if (!atualizado) throw naoEncontrado();
    return paraSetor(escopo, atualizado);
  } catch (error) {
    return traduzirErro(error);
  }
}

// ponytail: conta e apaga sem transação; uma máquina ligada no meio fica com setorId de setor apagado (o GET mostra setor '').
export async function excluir(escopo: Escopo, id: string) {
  if (!(await Sector.exists({ _id: id, ...filtroPorFilial(escopo) }))) throw naoEncontrado();
  const maquinas = await contarMaquinas(id);
  if (maquinas > 0) throw new ErroHttp(StatusCode.CONFLICT, `Setor com ${maquinas} máquina(s) ligada(s).`);
  await Sector.deleteOne({ _id: id });
  return { _id: id, message: "Setor excluído com sucesso." };
}

// A máquina só aponta para setor da própria filial.
export async function exigirSetorDaFilial(setorId: string, filialId: unknown) {
  if (!(await Sector.exists({ _id: setorId, filialId } as Record<string, unknown>))) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O setor informado não pertence à filial da máquina.");
  }
}
