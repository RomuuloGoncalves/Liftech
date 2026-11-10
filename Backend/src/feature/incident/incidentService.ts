import { Types } from "mongoose";
import { Incident } from "../../schemas/incident.js";
import { WorkSession } from "../../schemas/workSession.js";
import { Forklift } from "../../schemas/forklift.js";
import { Operator } from "../../schemas/operator.js";
import { IncidentModel } from "../../models/incidentModel.js";
import { IncidentRepository } from "./incidentRepository.js";
import { WorkSessionRepository } from "../session/workSessionRepository.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { OperatorRepository } from "../operator/operatorRepository.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";
import type { UsuarioRequisicao } from "../../core/autenticar.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { aplicarStatus } from "../machine/statusService.js";
import { publicar } from "../stream/streamHub.js";
import { exigirOperador, lerMachineId, lerPeriodo, LIMITE_HISTORICO, type FiltroLista } from "../session/sessionService.js";
import { nomesDosSetores } from "../sector/sectorService.js";

const incidentes = new IncidentRepository(Incident);
const sessoes = new WorkSessionRepository(WorkSession);
const empilhadeiras = new ForkliftRepository(Forklift);
const operadores = new OperatorRepository(Operator);

export interface DadosOcorrencia {
  horario?: string;
  descricao?: string | null;
}

export async function formatar(lista: IncidentModel[]) {
  const registros: any[] = lista.map((i) => i.obterDados());
  const [maquinas, ops] = await Promise.all([
    empilhadeiras.obterTodos({ _id: { $in: registros.map((i) => i.empilhadeiraId) } }).then((l) => l.map((m) => m.getDocumento())),
    operadores.obterTodos({ _id: { $in: registros.map((i) => i.operadorId).filter(Boolean) } }).then((l) => l.map((o) => o.obterDados())),
  ]);
  const setores = await nomesDosSetores(maquinas.map((m) => m.setorId));
  const maquinaDe = new Map(maquinas.map((m) => [String(m._id), m]));
  const operadorDe = new Map(ops.map((o: any) => [String(o._id), o]));

  return registros.map((i) => {
    const maquina = maquinaDe.get(String(i.empilhadeiraId));
    const operador = i.operadorId && operadorDe.get(String(i.operadorId));
    return {
      _id: String(i._id),
      machineId: String(i.empilhadeiraId),
      maquina: maquina
        ? { nome: maquina.nome, identificacao: maquina.identificacao, setor: setores.get(String(maquina.setorId)) ?? "" }
        : null,
      operador: operador ? { nome: operador.nome } : null,
      dataIncidente: new Date(i.dataIncidente).toISOString(),
      forcaImpacto: i.forcaImpacto ?? null,
      tipo: i.tipo ?? null,
      status: i.status,
      origem: i.origem ?? "sensor",
      descricao: i.descricao ?? null,
    };
  });
}

// Ocorrência do funcionário: incidente pendente na máquina da sessão aberta, que vai para alerta.
export async function reportar(usuario: UsuarioRequisicao, dados: DadosOcorrencia) {
  const operadorId = exigirOperador(usuario);
  const sessao = (await sessoes.obterUm({ operadorId, fim: null }))?.getDados();
  if (!sessao) throw new ErroHttp(StatusCode.CONFLICT, "Nenhuma sessão aberta.");

  // `horario` é hoje, no fuso do servidor (mesmo critério do filtro por dia).
  const dataIncidente = new Date();
  if (dados.horario) {
    const [hora, minuto] = dados.horario.split(":").map(Number);
    dataIncidente.setHours(hora!, minuto!, 0, 0);
  }

  const incidente = await incidentes.criar(
    new IncidentModel({
      empilhadeiraId: sessao.empilhadeiraId,
      operadorId,
      filialId: sessao.filialId,
      dataIncidente,
      status: "pendente",
      origem: "funcionario",
      descricao: dados.descricao ?? null,
    })
  );
  await aplicarStatus(String(sessao.empilhadeiraId), "alerta");
  const formatado = (await formatar([incidente!]))[0]!;
  // Avisa o front na hora (pop-up e sino); falha na publicação não desfaz a ocorrência.
  try {
    publicar("incidente", String(sessao.filialId), { ...formatado, filialId: String(sessao.filialId) });
  } catch {
    // o polling de segurança do front cobre
  }
  return formatado;
}

export async function listar(escopo: Escopo, filtro: FiltroLista & { filialId?: unknown }) {
  let permitidas = filtroPorFilial(escopo).filialId.$in;
  if (filtro.filialId !== undefined && filtro.filialId !== "") {
    if (typeof filtro.filialId !== "string" || !Types.ObjectId.isValid(filtro.filialId)) {
      throw new ErroHttp(StatusCode.BAD_REQUEST, "O campo 'filialId' deve ser um ObjectId válido do MongoDB.");
    }
    permitidas = permitidas.filter((id) => id === filtro.filialId);
  }
  const machineId = lerMachineId(filtro.machineId);
  const periodo = lerPeriodo(filtro.from, filtro.to);
  if (!periodo) return [];
  const consulta: Record<string, unknown> = { filialId: { $in: permitidas }, ...(machineId && { empilhadeiraId: machineId }) };
  if (Object.keys(periodo).length > 0) consulta.dataIncidente = periodo;
  return formatar(await incidentes.obterTodos(consulta, { ordenacao: { dataIncidente: -1 }, limite: LIMITE_HISTORICO }));
}
