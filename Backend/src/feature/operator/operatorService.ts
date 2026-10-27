import { Operator } from "../../schemas/operator.js";
import { User } from "../../schemas/user.js";
import { WorkSession } from "../../schemas/workSession.js";
import { Branch } from "../../schemas/branch.js";
import { operatorModel } from "../../models/operatorModel.js";
import { OperatorRepository } from "./operatorRepository.js";
import { UserRepository } from "../user/userRepository.js";
import { WorkSessionRepository } from "../session/workSessionRepository.js";
import { BranchRepository } from "../branch/branchRepository.js";
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

const operadores = new OperatorRepository(Operator);
const usuarios = new UserRepository(User);
const sessoes = new WorkSessionRepository(WorkSession);
const filiais = new BranchRepository(Branch);

const naoEncontrado = () => new ErroHttp(StatusCode.NOT_FOUND, "Operador não encontrado.");
const semLogin = () => new ErroHttp(StatusCode.NOT_FOUND, "Operador sem login.");

// O índice único em user.usuario recusa o usuário repetido numa corrida (11000).
function traduzirErro(error: any): never {
  throw error.code === 11000 ? new ErroHttp(StatusCode.CONFLICT, USUARIO_EM_USO) : error;
}

// Junta o login de cada operador numa consulta só. Acesso 'Permitido' só com login e sem acessoNegado.
async function formatar(lista: operatorModel[]) {
  const logins = await usuarios.obterTodos({ operadorId: { $in: lista.map((o) => o.getIdOriginal()) } });
  const loginDe = new Map(logins.map((u) => [String(u.getOperadorId()), u]));
  return lista.map((o) => {
    const dados = o.getDados();
    const login = loginDe.get(String(o.getID()));
    return {
      id: String(o.getID()),
      matricula: dados.matricula ?? "",
      nome: dados.nome ?? "",
      telefone: dados.telefone ?? "",
      cargo: dados.cargo ?? "",
      horarioEntrada: dados.horarioEntrada ?? "",
      horarioSaida: dados.horarioSaida ?? "",
      filialId: String(dados.filialId),
      usuario: login?.getUsuario() ?? null,
      acesso: login && !login.getAcessoNegado() ? "Permitido" : "Negado",
    };
  });
}

async function obter(escopo: Escopo, id: string) {
  const operador = await operadores.obterPorId(id, filtroPorFilial(escopo));
  if (!operador) throw naoEncontrado();
  return operador;
}

const obterFormatado = async (escopo: Escopo, id: string) => (await formatar([await obter(escopo, id)]))[0]!;

async function proximaMatricula(escopo: Escopo) {
  const daEmpresa = await filiais.distinto("_id", { empresaId: escopo.empresaId });
  const matriculas = (await operadores.distinto("matricula", { filialId: { $in: daEmpresa } })) as string[];
  const maior = Math.max(0, ...matriculas.map((m) => Number(MATRICULA.exec(m)?.[1] ?? 0)));
  return `EMP-${String(maior + 1).padStart(3, "0")}`;
}

// `filialId` (filtro da tela) só reduz o escopo, como em listarMaquinas.
export async function listar(escopo: Escopo, filialId?: string) {
  const permitidas = filtroPorFilial(escopo).filialId.$in;
  const lista = await operadores.obterTodos(
    { filialId: { $in: filialId ? permitidas.filter((id) => id === filialId) : permitidas } },
    { ordenacao: { nome: 1 } }
  );
  return formatar(lista);
}

const TENTATIVAS_MATRICULA = 5;

// O índice único { empresaId, matricula } recusa a matrícula repetida numa corrida (11000): recalcula e tenta de novo.
async function criarComMatricula(escopo: Escopo, dados: DadosOperador & { filialId: string }) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const operador = await operadores.criar(
        new operatorModel({ ...dados, empresaId: escopo.empresaId, matricula: await proximaMatricula(escopo) })
      );
      return operador!;
    } catch (error: any) {
      if (error.code !== 11000 || tentativa >= TENTATIVAS_MATRICULA) throw error;
    }
  }
}

// Com `login` o cadastro é um só: se o login falha, o operador recém-criado é desfeito.
export async function criar(escopo: Escopo, dados: DadosOperador & { filialId: string; login?: { usuario: string; senha: string } }) {
  const { login, ...campos } = dados;
  if (login && (await usuarios.existe({ usuario: login.usuario }))) throw new ErroHttp(StatusCode.CONFLICT, USUARIO_EM_USO);
  const operador = await criarComMatricula(escopo, campos);
  if (!login) return (await formatar([operador]))[0]!;
  try {
    return await criarLogin(escopo, String(operador.getID()), login);
  } catch (error) {
    await operadores.deletarUm({ _id: operador.getIdOriginal() });
    throw error;
  }
}

export async function atualizar(escopo: Escopo, id: string, dados: DadosOperador) {
  const atual = await obter(escopo, id);
  const alteracoes: Record<string, unknown> = {};
  for (const campo of CAMPOS_LIVRES) {
    if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
  }
  if (Object.keys(alteracoes).length > 0) await operadores.atualizarUm({ _id: id }, { $set: alteracoes });
  // O login mostra o nome do operador.
  if (alteracoes.nome !== undefined && alteracoes.nome !== atual.getNome()) {
    await usuarios.atualizarUm({ operadorId: id }, { $set: { nome: alteracoes.nome } });
  }
  return obterFormatado(escopo, id);
}

// Sessões antigas ficam no histórico; o login vai junto com o operador.
// Login primeiro: uma falha no meio deixa um operador sem login (reaproveitável), nunca um login sem operador.
export async function excluir(escopo: Escopo, id: string) {
  await obter(escopo, id);
  if (await sessoes.existe({ operadorId: id, fim: null })) {
    throw new ErroHttp(StatusCode.CONFLICT, "Operador com sessão aberta.");
  }
  await usuarios.deletarVarios({ operadorId: id });
  await operadores.deletarUm({ _id: id });
  return { _id: id, message: "Operador excluído com sucesso." };
}

// Login do colaborador no mesmo formato do seed: só a filial do operador.
export async function criarLogin(escopo: Escopo, id: string, dados: { usuario: string; senha: string }) {
  const operador = await obter(escopo, id);
  if (await usuarios.existe({ operadorId: id })) throw new ErroHttp(StatusCode.CONFLICT, "Este operador já tem login.");
  if (await usuarios.existe({ usuario: dados.usuario })) throw new ErroHttp(StatusCode.CONFLICT, USUARIO_EM_USO);
  await usuarios.criarComCredenciais({
    nome: operador.getNome(),
    role: "colaborador",
    usuario: dados.usuario,
    senhaHash: gerarHashSenha(dados.senha),
    empresaId: escopo.empresaId,
    escopo: "filiais",
    filiaisIds: [operador.getFilialId()],
    operadorId: id,
  }).catch(traduzirErro);
  return obterFormatado(escopo, id);
}

export async function atualizarLogin(escopo: Escopo, id: string, dados: { senha?: string; acessoNegado?: boolean }) {
  await obter(escopo, id);
  const alteracoes: Record<string, unknown> = {};
  if (dados.senha !== undefined) alteracoes.senhaHash = gerarHashSenha(dados.senha);
  if (dados.acessoNegado !== undefined) alteracoes.acessoNegado = dados.acessoNegado;
  if (!(await usuarios.atualizarUm({ operadorId: id }, { $set: alteracoes }))) throw semLogin();
  return obterFormatado(escopo, id);
}

export async function removerLogin(escopo: Escopo, id: string) {
  await obter(escopo, id);
  if (!(await usuarios.deletarUm({ operadorId: id }))) throw semLogin();
  return obterFormatado(escopo, id);
}
