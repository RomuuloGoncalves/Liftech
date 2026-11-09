import type { Request, Response } from "express";
import { Forklift } from "../../schemas/forklift.js";
import { Incident } from "../../schemas/incident.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { IncidentRepository } from "../incident/incidentRepository.js";

export type EventoStream = "incidente" | "maquina" | "dispositivo_offline";

export interface ClienteSSE {
  res: Response;
  filiais: Set<string>;
}

const clientes = new Set<ClienteSSE>();
let timerHeartbeat: NodeJS.Timeout | null = null;

const empilhadeiras = new ForkliftRepository(Forklift);
const incidentes = new IncidentRepository(Incident);

export function enviarHeartbeat(): void {
  for (const cliente of [...clientes]) {
    try {
      cliente.res.write(": ping\n\n");
    } catch {
      removerCliente(cliente);
    }
  }
}

export function iniciarHeartbeat(): void {
  if (!timerHeartbeat) {
    timerHeartbeat = setInterval(() => {
      enviarHeartbeat();
    }, 25_000);
    if (timerHeartbeat.unref) {
      timerHeartbeat.unref();
    }
  }
}

export function pararHeartbeat(): void {
  if (timerHeartbeat) {
    clearInterval(timerHeartbeat);
    timerHeartbeat = null;
  }
}

export function removerCliente(cliente: ClienteSSE): void {
  clientes.delete(cliente);
  if (clientes.size === 0) {
    pararHeartbeat();
  }
}

export function conectar(req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }

  const filiais = new Set((req.escopo?.filiais ?? []).map((f) => String(f._id)));
  const cliente: ClienteSSE = { res, filiais };
  clientes.add(cliente);
  iniciarHeartbeat();

  req.on("close", () => {
    removerCliente(cliente);
  });
}

export function publicar(evento: EventoStream, filialId: string, dados: object): void {
  const fId = String(filialId);
  const payload = `event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`;

  for (const cliente of [...clientes]) {
    if (cliente.filiais.has(fId)) {
      try {
        cliente.res.write(payload);
      } catch {
        removerCliente(cliente);
      }
    }
  }
}

export function contarClientes(): number {
  return clientes.size;
}

export function _resetarHub(): void {
  clientes.clear();
  pararHeartbeat();
}

export async function publicarMaquina(forkliftId: string): Promise<void> {
  const emp = (await empilhadeiras.buscarPorId(forkliftId))?.getDocumento();
  if (!emp) return;

  const fId = String(emp._id ?? forkliftId);
  const filialId = String(emp.filialId);
  const status = emp.status ?? "disponivel";

  const pendentesDocs = await incidentes.obterTodos(
    { empilhadeiraId: { $in: [fId, emp._id] }, status: "pendente" },
    { ordenacao: { dataIncidente: -1 } }
  );

  let alertaEm: string | null = null;
  const tiposVistos = new Set<string>();
  const alertaTipos: string[] = [];

  for (const inc of pendentesDocs) {
    const dados = inc.obterDados();
    if (!alertaEm && dados.dataIncidente) {
      alertaEm = new Date(dados.dataIncidente as string | Date).toISOString();
    }
    if (dados.tipo && typeof dados.tipo === "string" && !tiposVistos.has(dados.tipo)) {
      tiposVistos.add(dados.tipo);
      alertaTipos.push(dados.tipo);
    }
  }

  const alertaEmFinal = status === "alerta" ? alertaEm : null;

  const payload = {
    id: fId,
    filialId,
    status,
    categoriaId: emp.categoriaId ? String(emp.categoriaId) : null,
    categoriaTravada: emp.categoriaTravada === true,
    alertaEm: alertaEmFinal,
    alertaTipos,
    dispositivoOffline: emp.offlineDesde != null,
  };

  publicar("maquina", filialId, payload);
}
