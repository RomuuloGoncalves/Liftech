import { Incident } from "../../schemas/incident.js";
import { WorkSession } from "../../schemas/workSession.js";
import { Forklift } from "../../schemas/forklift.js";
import { Operator } from "../../schemas/operator.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";
import type { UsuarioRequisicao } from "../../core/autenticar.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { aplicarStatus } from "../machine/statusService.js";
import { exigirOperador, lerMachineId, lerPeriodo, type FiltroLista } from "../session/sessionService.js";
import { nomesDosSetores } from "../sector/sectorService.js";

export interface DadosOcorrencia {
  horario?: string;
  descricao?: string | null;
}

async function formatar(incidentes: any[]) {
  const [maquinas, operadores]: [any[], any[]] = await Promise.all([
    Forklift.find({ _id: { $in: incidentes.map((i) => i.empilhadeiraId) } }).lean(),
    Operator.find({ _id: { $in: incidentes.map((i) => i.operadorId).filter(Boolean) } }).lean(),
  ]);
  const setores = await nomesDosSetores(maquinas.map((m) => m.setorId));
  const maquinaDe = new Map(maquinas.map((m) => [String(m._id), m]));
  const operadorDe = new Map(operadores.map((o) => [String(o._id), o]));

  return incidentes.map((i) => {
    const maquina = maquinaDe.get(String(i.empilhadeiraId));
    const operador = i.operadorId && operadorDe.get(String(i.operadorId));
    return {
      _id: String(i._id),
      machineId: String(i.empilhadeiraId),
      maquina: maquina ? { nome: maquina.nome, identificacao: maquina.identificacao, setor: setores.get(String(maquina.setorId)) ?? "" } : null,
      operador: operador ? { nome: operador.nome } : null,
      dataIncidente: new Date(i.dataIncidente).toISOString(),
      forcaImpacto: i.forcaImpacto ?? null,
      status: i.status,
      origem: i.origem ?? "sensor",
      descricao: i.descricao ?? null,
    };
  });
}

// Ocorrência do funcionário: incidente pendente na máquina da sessão aberta, que vai para alerta.
export async function reportar(usuario: UsuarioRequisicao, dados: DadosOcorrencia) {
  const operadorId = exigirOperador(usuario);
  const sessao: any = await WorkSession.findOne({ operadorId, fim: null }).lean();
  if (!sessao) throw new ErroHttp(StatusCode.CONFLICT, "Nenhuma sessão aberta.");

  // `horario` é hoje, no fuso do servidor (mesmo critério do filtro por dia).
  const dataIncidente = new Date();
  if (dados.horario) {
    const [hora, minuto] = dados.horario.split(":").map(Number);
    dataIncidente.setHours(hora!, minuto!, 0, 0);
  }

  const incidente = await Incident.create({
    empilhadeiraId: sessao.empilhadeiraId,
    operadorId,
    filialId: sessao.filialId,
    dataIncidente,
    status: "pendente",
    origem: "funcionario",
    descricao: dados.descricao ?? null,
  });
  await aplicarStatus(String(sessao.empilhadeiraId), "alerta");
  return (await formatar([incidente]))[0]!;
}

export async function listar(escopo: Escopo, filtro: FiltroLista) {
  const machineId = lerMachineId(filtro.machineId);
  const periodo = lerPeriodo(filtro.from, filtro.to);
  if (!periodo) return [];
  const consulta: Record<string, unknown> = { ...filtroPorFilial(escopo), ...(machineId && { empilhadeiraId: machineId }) };
  if (Object.keys(periodo).length > 0) consulta.dataIncidente = periodo;
  return formatar(await Incident.find(consulta).sort({ dataIncidente: -1 }).lean());
}
