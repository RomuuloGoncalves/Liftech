import { Device } from "../../schemas/device.js";
import { Forklift } from "../../schemas/forklift.js";
import { Telemetry } from "../../schemas/telemetry.js";
import { Incident } from "../../schemas/incident.js";
import { WorkSession } from "../../schemas/workSession.js";

import { DeviceRepository } from "../device/deviceRepository.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { TelemetryRepository } from "./telemetryRepository.js";
import { IncidentRepository } from "../incident/incidentRepository.js";
import { WorkSessionRepository } from "../session/workSessionRepository.js";

import { IncidentModel } from "../../models/incidentModel.js";
import { aplicarStatus } from "../machine/statusService.js";
import { publicarMaquina, publicar } from "../stream/streamHub.js";
import { formatar } from "../incident/incidentService.js";
import { logger } from "../../utils/logger.js";
import type { Mensagem } from "./telemetryContrato.js";

let repoDispositivos = new DeviceRepository(Device);
let repoEmpilhadeiras = new ForkliftRepository(Forklift);
let repoTelemetrias = new TelemetryRepository(Telemetry);
let repoIncidentes = new IncidentRepository(Incident);
let repoSessoes = new WorkSessionRepository(WorkSession);

export function _setRepositorios(deps?: {
  dispositivos?: DeviceRepository;
  empilhadeiras?: ForkliftRepository;
  telemetrias?: TelemetryRepository;
  incidentes?: IncidentRepository;
  sessoes?: WorkSessionRepository;
}): void {
  repoDispositivos = deps?.dispositivos ?? new DeviceRepository(Device);
  repoEmpilhadeiras = deps?.empilhadeiras ?? new ForkliftRepository(Forklift);
  repoTelemetrias = deps?.telemetrias ?? new TelemetryRepository(Telemetry);
  repoIncidentes = deps?.incidentes ?? new IncidentRepository(Incident);
  repoSessoes = deps?.sessoes ?? new WorkSessionRepository(WorkSession);
}

export async function processarMensagem(msg: Mensagem, agora = new Date()): Promise<void> {
  const macUpper = msg.dispositivo.toUpperCase();
  let dispositivo = await repoDispositivos.obterPorMac(macUpper);
  if (!dispositivo && macUpper !== msg.dispositivo) {
    dispositivo = await repoDispositivos.obterPorMac(msg.dispositivo);
  }

  if (!dispositivo) {
    logger.warn(`Dispositivo com MAC ${msg.dispositivo} não encontrado.`);
    return;
  }

  const dispositivoId = dispositivo.getIdOriginal() ?? dispositivo.obterDados().id;
  let empilhadeira = await repoEmpilhadeiras.obterUm({ dispositivoConectadoId: dispositivoId });
  if (!empilhadeira && dispositivo.obterDados().empilhadeiraId) {
    empilhadeira = await repoEmpilhadeiras.buscarPorId(String(dispositivo.obterDados().empilhadeiraId));
  }

  if (!empilhadeira) {
    logger.warn(`Dispositivo ${macUpper} não está vinculado a nenhuma empilhadeira.`);
    return;
  }

  const empDoc = empilhadeira.getDocumento();
  const empId = String(empDoc._id);
  const estavaOffline = empDoc.offlineDesde != null;
  const eraManutencaoPorOffline = empDoc.manutencaoPorOffline === true;

  if (estavaOffline) {
    await repoEmpilhadeiras.atualizarUm(
      { _id: empId },
      { $set: { ultimaLeituraEm: agora, offlineDesde: null, manutencaoPorOffline: false } }
    );
    if (eraManutencaoPorOffline) {
      await aplicarStatus(empId, "disponivel");
    } else {
      try {
        await publicarMaquina(empId);
      } catch {
        // Falha na publicação não interrompe o processamento
      }
    }
  } else {
    await repoEmpilhadeiras.atualizarUm({ _id: empId }, { $set: { ultimaLeituraEm: agora } });
  }

  if (msg.tipo === "telemetria") {
    await repoTelemetrias.criarDados({
      dispositivoId,
      dataDados: agora,
      movimento: msg.movimento,
    });
    return;
  }

  if (msg.tipo === "evento") {
    const sessao = await repoSessoes.obterUm({
      empilhadeiraId: { $in: [empId, empDoc._id] },
      fim: null,
    });

    if (!sessao) {
      logger.warn(`Evento descartado: empilhadeira ${empId} não possui sessão aberta.`);
      return;
    }

    const sessaoDados = sessao.obterDados() as any;
    const operadorId = sessaoDados.operadorId;
    const filialId = empDoc.filialId;

    const incidente = await repoIncidentes.criar(
      new IncidentModel({
        empilhadeiraId: empDoc._id ?? empId,
        operadorId,
        filialId,
        dataIncidente: agora,
        status: "pendente",
        origem: "sensor",
        tipo: msg.evento.tipo,
        movimento: msg.movimento,
      })
    );

    await aplicarStatus(empId, "alerta");

    try {
      await publicarMaquina(empId);
    } catch {
      // Falha na publicação não afeta o fluxo
    }

    if (incidente) {
      try {
        const formatados = await formatar([incidente]);
        if (formatados[0]) {
          publicar("incidente", String(filialId), {
            ...formatados[0],
            filialId: String(filialId),
          });
        }
      } catch {
        // Falha na publicação não afeta a gravação
      }
    }
  }
}
