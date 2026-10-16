import { Operator } from "../../schemas/operator.js";
import { User } from "../../schemas/user.js";
import { WorkSession } from "../../schemas/workSession.js";
import { Branch } from "../../schemas/branch.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { gerarHashSenha } from "../../utils/senha.js";

export interface DadosOperador {
  nome?: string;
  telefone?: string;
  cargo?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
}

const CAMPOS_LIVRES = ["nome", "telefone", "cargo", "horarioEntrada", "horarioSaida"] as const;
const MATRICULA = /^EMP-(\d+)$/;

const USUARIO_EM_USO = "Este usuário já está em uso.";

const naoEncontrado = () => new ErroHttp(StatusCode.NOT_FOUND, "Operador não encontrado.");
const semLogin = () => new ErroHttp(StatusCode.NOT_FOUND, "Operador sem login.");

// O índice único em user.usuario recusa o usuário repetido numa corrida (11000).
function traduzirErro(error: any): never {
  throw error.code === 11000 ? new ErroHttp(StatusCode.CONFLICT, USUARIO_EM_USO) : error;
}

// Junta o login de cada operador numa consulta só. Acesso 'Permitido' só com login e sem acessoNegado.
async function formatar(operadores: any[]) {
  const logins: any[] = await User.find({ operadorId: { $in: operadores.map((o) => o._id) } }).lean();
  const loginDe = new Map(logins.map((u) => [String(u.operadorId), u]));
  return operadores.map((o) => {
    const login = loginDe.get(String(o._id));
    return {
      id: String(o._id),
      matricula: o.matricula ?? "",
      nome: o.nome ?? "",
      telefone: o.telefone ?? "",
      cargo: o.cargo ?? "",
      horarioEntrada: o.horarioEntrada ?? "",
      horarioSaida: o.horarioSaida ?? "",
      filialId: String(o.filialId),
      usuario: login?.usuario ?? null,
      acesso: login && login.acessoNegado !== true ? "Permitido" : "Negado",
    };
  });
}

async function obter(escopo: Escopo, id: string) {
  const operador = await Operator.findOne({ _id: id, ...filtroPorFilial(escopo) }).lean();
  if (!operador) throw naoEncontrado();
  return operador;
}

const obterFormatado = async (escopo: Escopo, id: string) => (await formatar([await obter(escopo, id)]))[0]!;

// ponytail: dois cadastros simultâneos podem gerar a mesma matrícula (sem índice). Índice { empresaId, matricula } quando o operador ganhar empresaId.
async function proximaMatricula(escopo: Escopo) {
  const filiais = await Branch.distinct("_id", { empresaId: escopo.empresaId });
  const matriculas: string[] = await Operator.distinct("matricula", { filialId: { $in: filiais } } as Record<string, unknown>);
  const maior = Math.max(0, ...matriculas.map((m) => Number(MATRICULA.exec(m)?.[1] ?? 0)));
  return `EMP-${String(maior + 1).padStart(3, "0")}`;
}

// `filialId` (filtro da tela) só reduz o escopo, como em listarMaquinas.
export async function listar(escopo: Escopo, filialId?: string) {
  const permitidas = filtroPorFilial(escopo).filialId.$in;
  const operadores = await Operator.find({ filialId: { $in: filialId ? permitidas.filter((id) => id === filialId) : permitidas } })
    .sort({ nome: 1 })
    .lean();
  return formatar(operadores);
}

export async function criar(escopo: Escopo, dados: DadosOperador & { filialId: string }) {
  const operador = await Operator.create({ ...dados, matricula: await proximaMatricula(escopo) });
  return (await formatar([operador]))[0]!;
}

export async function atualizar(escopo: Escopo, id: string, dados: DadosOperador) {
  const atual = await obter(escopo, id);
  const alteracoes: Record<string, unknown> = {};
  for (const campo of CAMPOS_LIVRES) {
    if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
  }
  if (Object.keys(alteracoes).length > 0) await Operator.updateOne({ _id: id }, { $set: alteracoes });
  // O login mostra o nome do operador.
  if (alteracoes.nome !== undefined && alteracoes.nome !== atual.nome) await User.updateOne({ operadorId: id }, { $set: { nome: alteracoes.nome } });
  return obterFormatado(escopo, id);
}

// Sessões antigas ficam no histórico; o login vai junto com o operador.
// ponytail: operador e login apagados sem transação; uma falha no meio deixa um login sem operador.
export async function excluir(escopo: Escopo, id: string) {
  await obter(escopo, id);
  if (await WorkSession.exists({ operadorId: id, fim: null })) {
    throw new ErroHttp(StatusCode.CONFLICT, "Operador com sessão aberta.");
  }
  await Operator.deleteOne({ _id: id });
  await User.deleteMany({ operadorId: id });
  return { _id: id, message: "Operador excluído com sucesso." };
}

// Login do colaborador no mesmo formato do seed: só a filial do operador.
export async function criarLogin(escopo: Escopo, id: string, dados: { usuario: string; senha: string }) {
  const operador = await obter(escopo, id);
  if (await User.exists({ operadorId: id })) throw new ErroHttp(StatusCode.CONFLICT, "Este operador já tem login.");
  if (await User.exists({ usuario: dados.usuario })) throw new ErroHttp(StatusCode.CONFLICT, USUARIO_EM_USO);
  await User.create({
    nome: operador.nome,
    role: "colaborador",
    usuario: dados.usuario,
    senhaHash: gerarHashSenha(dados.senha),
    empresaId: escopo.empresaId,
    escopo: "filiais",
    filiaisIds: [operador.filialId],
    operadorId: id,
  }).catch(traduzirErro);
  return obterFormatado(escopo, id);
}

export async function atualizarLogin(escopo: Escopo, id: string, dados: { senha?: string; acessoNegado?: boolean }) {
  await obter(escopo, id);
  const alteracoes: Record<string, unknown> = {};
  if (dados.senha !== undefined) alteracoes.senhaHash = gerarHashSenha(dados.senha);
  if (dados.acessoNegado !== undefined) alteracoes.acessoNegado = dados.acessoNegado;
  const { matchedCount } = await User.updateOne({ operadorId: id }, { $set: alteracoes });
  if (matchedCount === 0) throw semLogin();
  return obterFormatado(escopo, id);
}

export async function removerLogin(escopo: Escopo, id: string) {
  await obter(escopo, id);
  const { deletedCount } = await User.deleteOne({ operadorId: id });
  if (deletedCount === 0) throw semLogin();
  return obterFormatado(escopo, id);
}
