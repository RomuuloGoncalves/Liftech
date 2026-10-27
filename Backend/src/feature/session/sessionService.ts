import { Types } from "mongoose";
import { WorkSession } from "../../schemas/workSession.js";
import { Forklift } from "../../schemas/forklift.js";
import { Operator } from "../../schemas/operator.js";
import { workSessionModel } from "../../models/workSessionModel.js";
import { WorkSessionRepository } from "./workSessionRepository.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { OperatorRepository } from "../operator/operatorRepository.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";
import type { UsuarioRequisicao } from "../../core/autenticar.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { obterMaquina } from "../machine/machineService.js";
import { aplicarStatus } from "../machine/statusService.js";
import { nomesDosSetores } from "../sector/sectorService.js";

export interface FiltroLista {
  from?: unknown;
  to?: unknown;
  machineId?: unknown;
  filialId?: unknown;
}

const DIA = /^\d{4}-\d{2}-\d{2}$/;

export function exigirOperador(usuario: UsuarioRequisicao): string {
  if (!usuario.operadorId) throw new ErroHttp(StatusCode.FORBIDDEN, "Usuário sem operador ligado.");
  return usuario.operadorId;
}

export function lerMachineId(valor: unknown): string | undefined {
  if (valor === undefined || valor === "") return undefined;
  if (typeof valor !== "string" || !Types.ObjectId.isValid(valor)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'machineId' deve ser um ObjectId válido do MongoDB.");
  }
  return valor;
}

export function lerFilialId(valor: unknown): string | undefined {
  if (valor === undefined || valor === "") return undefined;
  if (typeof valor !== "string" || !Types.ObjectId.isValid(valor)) {
    throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'filialId' deve ser um ObjectId válido do MongoDB.");
  }
  return valor;
}

function lerDia(valor: unknown, campo: string): Date | undefined {
  if (valor === undefined || valor === "") return undefined;
  const data = typeof valor === "string" && DIA.test(valor) ? new Date(`${valor}T00:00:00`) : null;
  if (!data || Number.isNaN(data.getTime())) throw new ErroHttp(StatusCode.BAD_REQUEST, `O campo '${campo}' deve estar no formato YYYY-MM-DD.`);
  return data;
}

// Período por dia, inclusivo. Devolve null quando `from` > `to` (nada casa).
// ponytail: dia no fuso do servidor; passar o fuso do cliente se as filiais ficarem em fusos diferentes.
export function lerPeriodo(from: unknown, to: unknown): Record<string, Date> | null {
  const inicio = lerDia(from, "from");
  const fimDia = lerDia(to, "to");
  const periodo: Record<string, Date> = {};
  if (inicio) periodo.$gte = inicio;
  if (fimDia) {
    periodo.$lt = new Date(fimDia);
    periodo.$lt.setDate(periodo.$lt.getDate() + 1);
  }
  if (inicio && fimDia && inicio > fimDia) return null;
  return periodo;
}

export const LIMITE_HISTORICO = 500;

const sessoes = new WorkSessionRepository(WorkSession);
const empilhadeiras = new ForkliftRepository(Forklift);
const operadores = new OperatorRepository(Operator);

// Máquina e operador por id; a sessão de uma máquina apagada continua com `maquina: null`.
async function formatar(lista: workSessionModel[]) {
  const registros: any[] = lista.map((s) => s.obterDados());
  const [maquinas, ops] = await Promise.all([
    empilhadeiras.obterTodos({ _id: { $in: registros.map((s) => s.empilhadeiraId) } }).then((l) => l.map((m) => m.getDocumento())),
    operadores.obterTodos({ _id: { $in: registros.map((s) => s.operadorId) } }).then((l) => l.map((o) => o.obterDados())),
  ]);
  const setores = await nomesDosSetores(maquinas.map((m) => m.setorId));
  const porId = (lista: any[]) => new Map(lista.map((d) => [String(d._id), d]));
  const maquinaDe = porId(maquinas);
  const operadorDe = porId(ops);

  return registros.map((s) => {
    const maquina = maquinaDe.get(String(s.empilhadeiraId));
    return {
      _id: String(s._id),
      machineId: String(s.empilhadeiraId),
      maquina: maquina ? { nome: maquina.nome, identificacao: maquina.identificacao, setor: setores.get(String(maquina.setorId)) ?? "" } : null,
      operador: { nome: operadorDe.get(String(s.operadorId))?.nome ?? "" },
      inicio: new Date(s.inicio).toISOString(),
      fim: s.fim ? new Date(s.fim).toISOString() : null,
    };
  });
}

async function buscarUma(filtro: Record<string, unknown>) {
  const sessao = await sessoes.obterUm(filtro);
  return sessao ? (await formatar([sessao]))[0]! : null;
}

export async function atual(usuario: UsuarioRequisicao) {
  return buscarUma({ operadorId: exigirOperador(usuario), fim: null });
}

const ocupada = () => new ErroHttp(StatusCode.CONFLICT, "O operador ou a máquina já tem sessão aberta.");

export async function iniciar(escopo: Escopo, usuario: UsuarioRequisicao, machineId: string) {
  const operadorId = exigirOperador(usuario);
  const maquina = await obterMaquina(escopo, machineId);
  if (maquina.status !== "disponivel") throw new ErroHttp(StatusCode.CONFLICT, "A máquina não está disponível.");
  if (await sessoes.existe({ fim: null, $or: [{ operadorId }, { empilhadeiraId: machineId }] })) throw ocupada();

  const inicio = new Date();
  let sessao: workSessionModel | null;
  try {
    sessao = await sessoes.criar(new workSessionModel({ operadorId, empilhadeiraId: machineId, filialId: maquina.filialId, inicio }));
  } catch (error: any) {
    // Corrida: o índice único parcial recusa a segunda sessão aberta.
    throw error.code === 11000 ? ocupada() : error;
  }
  await empilhadeiras.atualizarUm({ _id: machineId }, { $set: { operadorConectadoId: operadorId, sessaoIniciadaEm: inicio } });
  await aplicarStatus(machineId, "em_uso");
  return buscarUma({ _id: sessao?.getIdOriginal() });
}

// Alerta (ou outro status) não volta para disponível sozinho; máquina apagada só fecha a sessão.
export async function encerrar(usuario: UsuarioRequisicao) {
  const sessao = await sessoes.obterUm({ operadorId: exigirOperador(usuario), fim: null });
  if (!sessao) throw new ErroHttp(StatusCode.CONFLICT, "Nenhuma sessão aberta.");

  await sessoes.atualizarUm({ _id: sessao.getIdOriginal() }, { $set: { fim: new Date() } });
  const maquina = (await empilhadeiras.buscarPorId(sessao.getDados().empilhadeiraId))?.getDocumento();
  if (maquina) {
    await empilhadeiras.atualizarUm({ _id: maquina._id }, { $unset: { operadorConectadoId: 1, sessaoIniciadaEm: 1 } });
    if (maquina.status === "em_uso") await aplicarStatus(String(maquina._id), "disponivel");
  }
  return buscarUma({ _id: sessao.getIdOriginal() });
}

// Sem `machineId`, admin vê todas do escopo (com filialId opcional); colaborador só as suas. Com ela, as de qualquer operador da máquina no escopo.
export async function listar(escopo: Escopo, usuario: UsuarioRequisicao, filtro: FiltroLista) {
  const machineId = lerMachineId(filtro.machineId);
  const filialId = lerFilialId(filtro.filialId);
  const periodo = lerPeriodo(filtro.from, filtro.to);

  const permitidas = filtroPorFilial(escopo).filialId.$in;
  const filialFiltro = { filialId: { $in: filialId ? permitidas.filter((id) => id === filialId) : permitidas } };

  const donoFiltro = machineId
    ? { empilhadeiraId: machineId }
    : usuario.role === "admin"
      ? {}
      : { operadorId: exigirOperador(usuario) };

  const consulta: Record<string, unknown> = {
    ...filialFiltro,
    ...donoFiltro,
  };
  if (!periodo) return [];
  if (Object.keys(periodo).length > 0) consulta.inicio = periodo;
  return formatar(await sessoes.obterTodos(consulta, { ordenacao: { inicio: -1 }, limite: LIMITE_HISTORICO }));
}
