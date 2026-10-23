import { Category } from "../../schemas/category.js";
import { Forklift } from "../../schemas/forklift.js";
import { filtroPorEmpresa, type Escopo } from "../../core/escopo.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { ehStatus, type Status } from "../machine/statusService.js";

export interface DadosCategoria {
  nome?: string;
  cor?: string;
  statusVinculados?: unknown;
}

// Quadro do Figma: cada empresa começa com estas categorias, ligadas a um status cada.
const QUADRO_INICIAL = [
  { chave: "acidentes", nome: "Acidentes", cor: "#EF4444", status: "alerta" },
  { chave: "ativas", nome: "Ativas", cor: "#3A9CFF", status: "em_uso" },
  { chave: "manutencao", nome: "Manutenção", cor: "#FFC93A", status: "manutencao" },
  { chave: "disponiveis", nome: "Disponíveis", cor: "#22C55E", status: "disponivel" },
] as const;

const paraCategoria = (c: any) => ({
  _id: String(c._id),
  nome: c.nome,
  cor: c.cor,
  chave: c.chave ?? null,
  statusVinculados: c.statusVinculados ?? [],
});

const naoEncontrada = () => new ErroHttp(StatusCode.NOT_FOUND, "Categoria não encontrada.");

// O índice único { empresaId, nome } (sem caixa) faz o Mongo recusar o nome repetido (código 11000).
function traduzirErro(error: any): never {
  throw error.code === 11000 ? new ErroHttp(StatusCode.CONFLICT, "Já existe uma categoria com este nome.") : error;
}

function lerStatusVinculados(valor: unknown): Status[] {
  if (!Array.isArray(valor) || !valor.every(ehStatus) || new Set(valor).size !== valor.length) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'statusVinculados' deve ser uma lista de status válidos, sem repetição.");
  }
  return valor;
}

// Um status leva a no máximo uma categoria da empresa, senão a mudança de status não teria destino único.
async function exigirStatusLivres(escopo: Escopo, status: Status[], excetoId?: string) {
  if (status.length === 0) return;
  const ocupado = await Category.exists({
    ...filtroPorEmpresa(escopo),
    statusVinculados: { $in: status },
    ...(excetoId && { _id: { $ne: excetoId } }),
  });
  if (ocupado) throw new ErroHttp(StatusCode.CONFLICT, "Um dos status já está ligado a outra categoria.");
}

export async function listar(escopo: Escopo) {
  // _id cresce com a criação: ordenar por ele é a ordem de criação.
  const categorias = await Category.find(filtroPorEmpresa(escopo)).sort({ _id: 1 }).lean();
  return categorias.map(paraCategoria);
}

export async function criar(escopo: Escopo, dados: DadosCategoria) {
  const statusVinculados = lerStatusVinculados(dados.statusVinculados ?? []);
  await exigirStatusLivres(escopo, statusVinculados);
  try {
    const categoria = await Category.create({ empresaId: escopo.empresaId, nome: dados.nome, cor: dados.cor, statusVinculados });
    return paraCategoria(categoria);
  } catch (error) {
    return traduzirErro(error);
  }
}

// Mudar a ligação de status não move nenhuma máquina: só a próxima mudança de status usa a ligação nova.
export async function atualizar(escopo: Escopo, id: string, dados: DadosCategoria) {
  const alteracoes: Record<string, unknown> = {};
  if (dados.nome !== undefined) {
    alteracoes.nome = dados.nome;
    alteracoes.chave = null;
  }
  if (dados.cor !== undefined) alteracoes.cor = dados.cor;
  if (dados.statusVinculados !== undefined) {
    alteracoes.statusVinculados = lerStatusVinculados(dados.statusVinculados);
    await exigirStatusLivres(escopo, alteracoes.statusVinculados as Status[], id);
  }

  try {
    const categoria = await Category.findOneAndUpdate(
      { _id: id, ...filtroPorEmpresa(escopo) },
      { $set: alteracoes },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!categoria) throw naoEncontrada();
    return paraCategoria(categoria);
  } catch (error) {
    return traduzirErro(error);
  }
}

// ponytail: solta as máquinas e depois apaga, sem transação; uma falha no meio deixa a categoria vazia, não máquina órfã.
export async function excluir(escopo: Escopo, id: string) {
  const categoria = await Category.findOne({ _id: id, ...filtroPorEmpresa(escopo) }).lean();
  if (!categoria) throw naoEncontrada();

  await Forklift.updateMany({ categoriaId: id }, { $set: { categoriaId: null, categoriaTravada: false } });
  await Category.deleteOne({ _id: id });
  return { _id: id, message: "Categoria excluída com sucesso." };
}

// Cria o quadro inicial de uma empresa sem categorias. Devolve a categoria de cada status, ou null se a empresa já tinha quadro.
export async function criarQuadroInicial(empresaId: unknown): Promise<Map<Status, unknown> | null> {
  if (await Category.exists({ empresaId } as Record<string, unknown>)) return null;
  const criadas: any[] = await Category.insertMany(
    QUADRO_INICIAL.map(({ chave, nome, cor, status }) => ({ empresaId, chave, nome, cor, statusVinculados: [status] }))
  );
  return new Map(QUADRO_INICIAL.map(({ status }, i) => [status as Status, criadas[i]._id]));
}

// Põe cada empilhadeira sem categoria das filiais na categoria ligada ao seu status; status sem ligação fica sem categoria.
export async function posicionarSemCategoria(filialIds: unknown[], quadro: Map<Status, unknown>) {
  for (const [status, categoriaId] of quadro) {
    await Forklift.updateMany({ filialId: { $in: filialIds }, categoriaId: null, status } as Record<string, unknown>, { $set: { categoriaId } });
  }
}
