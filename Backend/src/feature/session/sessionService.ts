import { Types } from "mongoose";
import { WorkSession } from "../../schemas/workSession.js";
import { Forklift } from "../../schemas/forklift.js";
import { Operator } from "../../schemas/operator.js";
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

// Máquina e operador por id; a sessão de uma máquina apagada continua com `maquina: null`.
async function formatar(sessoes: any[]) {
  const [maquinas, operadores]: [any[], any[]] = await Promise.all([
    Forklift.find({ _id: { $in: sessoes.map((s) => s.empilhadeiraId) } }).lean(),
    Operator.find({ _id: { $in: sessoes.map((s) => s.operadorId) } }).lean(),
  ]);
  const setores = await nomesDosSetores(maquinas.map((m) => m.setorId));
  const porId = (lista: any[]) => new Map(lista.map((d) => [String(d._id), d]));
  const maquinaDe = porId(maquinas);
  const operadorDe = porId(operadores);

  return sessoes.map((s) => {
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
  const sessao = await WorkSession.findOne(filtro).lean();
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
  if (await WorkSession.exists({ fim: null, $or: [{ operadorId }, { empilhadeiraId: machineId }] })) throw ocupada();

  const inicio = new Date();
  let sessao: any;
  try {
    sessao = await WorkSession.create({ operadorId, empilhadeiraId: machineId, filialId: maquina.filialId, inicio });
  } catch (error: any) {
    // Corrida: o índice único parcial recusa a segunda sessão aberta.
    throw error.code === 11000 ? ocupada() : error;
  }
  await Forklift.updateOne({ _id: machineId }, { $set: { operadorConectadoId: operadorId, sessaoIniciadaEm: inicio } });
  await aplicarStatus(machineId, "em_uso");
  return buscarUma({ _id: sessao._id });
}

// Alerta (ou outro status) não volta para disponível sozinho; máquina apagada só fecha a sessão.
export async function encerrar(usuario: UsuarioRequisicao) {
  const sessao: any = await WorkSession.findOne({ operadorId: exigirOperador(usuario), fim: null }).lean();
  if (!sessao) throw new ErroHttp(StatusCode.CONFLICT, "Nenhuma sessão aberta.");

  await WorkSession.updateOne({ _id: sessao._id }, { $set: { fim: new Date() } });
  const maquina: any = await Forklift.findById(sessao.empilhadeiraId).lean();
  if (maquina) {
    await Forklift.updateOne({ _id: maquina._id }, { $unset: { operadorConectadoId: 1, sessaoIniciadaEm: 1 } });
    if (maquina.status === "em_uso") await aplicarStatus(String(maquina._id), "disponivel");
  }
  return buscarUma({ _id: sessao._id });
}

// Sem `machineId`, só as sessões do operador; com ela, as de qualquer operador da máquina no escopo.
export async function listar(escopo: Escopo, usuario: UsuarioRequisicao, filtro: FiltroLista) {
  const machineId = lerMachineId(filtro.machineId);
  const periodo = lerPeriodo(filtro.from, filtro.to);
  const consulta: Record<string, unknown> = {
    ...filtroPorFilial(escopo),
    ...(machineId ? { empilhadeiraId: machineId } : { operadorId: exigirOperador(usuario) }),
  };
  if (!periodo) return [];
  if (Object.keys(periodo).length > 0) consulta.inicio = periodo;
  return formatar(await WorkSession.find(consulta).sort({ inicio: -1 }).lean());
}
