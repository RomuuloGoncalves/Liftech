import { Forklift } from "../../schemas/forklift.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { aplicarStatus } from "../machine/statusService.js";
import { publicarMaquina, publicar } from "../stream/streamHub.js";
import { logger } from "../../utils/logger.js";

const OFFLINE_LIMITE_PADRAO_MS = 30000;

let repoEmpilhadeiras = new ForkliftRepository(Forklift);
let timerVarredor: NodeJS.Timeout | null = null;
let emExecucao = false;

/** Limiar em milissegundos sem leituras para marcar a máquina como offline. */
export function obterOfflineLimiteMs(): number {
  const bruto = process.env.OFFLINE_LIMITE_MS?.trim();
  const valor = Number(bruto);
  return bruto && Number.isFinite(valor) && valor > 0 ? valor : OFFLINE_LIMITE_PADRAO_MS;
}

export function _setRepositorios(deps?: { empilhadeiras?: ForkliftRepository }): void {
  repoEmpilhadeiras = deps?.empilhadeiras ?? new ForkliftRepository(Forklift);
}

export async function varrerOffline(agora = new Date()): Promise<void> {
  const limite = new Date(agora.getTime() - obterOfflineLimiteMs());
  const filtro = {
    dispositivoConectadoId: { $ne: null },
    ultimaLeituraEm: { $ne: null, $lt: limite },
    offlineDesde: null,
  };

  const maquinasOffline = await repoEmpilhadeiras.obterTodos(filtro);

  for (const emp of maquinasOffline) {
    const doc = emp.getDocumento();
    const id = String(doc._id);
    const filialId = String(doc.filialId);
    const identificacao = doc.identificacao;
    const status = doc.status ?? "disponivel";

    const atualizou = await repoEmpilhadeiras.atualizarUm(
      { _id: id, offlineDesde: null, ultimaLeituraEm: { $lt: limite } },
      { $set: { offlineDesde: agora } }
    );

    if (!atualizou) {
      continue;
    }

    if (status === "disponivel") {
      try {
        await aplicarStatus(id, "manutencao", true);
      } catch (err) {
        logger.error(`Falha ao pôr a máquina ${id} em manutenção por offline: ${err}`);
      }
    } else {
      try {
        await publicarMaquina(id);
      } catch {
        // Falha na publicação não interrompe o fluxo
      }
    }

    try {
      publicar("dispositivo_offline", filialId, {
        machineId: id,
        identificacao,
        filialId,
      });
    } catch {
      // Falha na publicação não interrompe o fluxo
    }
  }
}

export function iniciarVarredor(intervaloMs = 10000): void {
  if (timerVarredor) return;

  timerVarredor = setInterval(async () => {
    if (emExecucao) return;
    emExecucao = true;
    try {
      await varrerOffline();
    } catch (err) {
      logger.error(`Erro no varredor de offline: ${err}`);
    } finally {
      emExecucao = false;
    }
  }, intervaloMs);

  if (timerVarredor.unref) {
    timerVarredor.unref();
  }
}

export function pararVarredor(): void {
  if (timerVarredor) {
    clearInterval(timerVarredor);
    timerVarredor = null;
  }
  emExecucao = false;
}

export function _obterEstadoVarredor() {
  return {
    ativo: timerVarredor !== null,
    emExecucao,
  };
}
