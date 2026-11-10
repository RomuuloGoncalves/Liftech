export const TIPOS_EVENTO = ["colisao", "frenagem_brusca", "aceleracao_brusca", "curva_brusca", "inclinacao_excessiva"] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface Movimento {
  aceleracaoX: number;
  aceleracaoY: number;
  aceleracaoZ: number;
  inclinacaoX: number;
  inclinacaoY: number;
  magnitude: number;
}

export interface MensagemTelemetria {
  tipo: "telemetria";
  dispositivo: string;
  movimento: Movimento;
  tempo?: number;
}

export interface MensagemEvento {
  tipo: "evento";
  dispositivo: string;
  evento: {
    tipo: TipoEvento;
    gravidade?: string;
  };
  movimento: Movimento;
  id_evento?: number;
  tempo?: number;
}

export type Mensagem = MensagemTelemetria | MensagemEvento;

function normalizarMovimento(raw: any): Movimento | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const ax = raw.aceleracao_x !== undefined ? raw.aceleracao_x : raw.aceleracaoX;
  const ay = raw.aceleracao_y !== undefined ? raw.aceleracao_y : raw.aceleracaoY;
  const az = raw.aceleracao_z !== undefined ? raw.aceleracao_z : raw.aceleracaoZ;
  const ix = raw.inclinacao_x !== undefined ? raw.inclinacao_x : raw.inclinacaoX;
  const iy = raw.inclinacao_y !== undefined ? raw.inclinacao_y : raw.inclinacaoY;
  const mag = raw.magnitude;

  const valores = [ax, ay, az, ix, iy, mag];
  for (const v of valores) {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return null;
    }
  }

  return {
    aceleracaoX: ax,
    aceleracaoY: ay,
    aceleracaoZ: az,
    inclinacaoX: ix,
    inclinacaoY: iy,
    magnitude: mag,
  };
}

export function lerMensagem(buffer: Buffer | string): Mensagem | null {
  let parsed: any;
  try {
    const texto = typeof buffer === "string" ? buffer : buffer.toString("utf-8");
    parsed = JSON.parse(texto);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  if (typeof parsed.dispositivo !== "string" || !parsed.dispositivo.trim()) {
    return null;
  }

  const movimento = normalizarMovimento(parsed.movimento);
  if (!movimento) {
    return null;
  }

  if (parsed.tipo === "telemetria") {
    return {
      tipo: "telemetria",
      dispositivo: parsed.dispositivo,
      movimento,
      ...(typeof parsed.tempo === "number" && Number.isFinite(parsed.tempo) ? { tempo: parsed.tempo } : {}),
    };
  }

  if (parsed.tipo === "evento") {
    if (!parsed.evento || typeof parsed.evento !== "object" || Array.isArray(parsed.evento)) {
      return null;
    }

    if (!TIPOS_EVENTO.includes(parsed.evento.tipo)) {
      return null;
    }

    return {
      tipo: "evento",
      dispositivo: parsed.dispositivo,
      evento: {
        tipo: parsed.evento.tipo,
        ...(typeof parsed.evento.gravidade === "string" ? { gravidade: parsed.evento.gravidade } : {}),
      },
      movimento,
      ...(typeof parsed.id_evento === "number" && Number.isFinite(parsed.id_evento) ? { id_evento: parsed.id_evento } : {}),
      ...(typeof parsed.tempo === "number" && Number.isFinite(parsed.tempo) ? { tempo: parsed.tempo } : {}),
    };
  }

  return null;
}

export function montarTelemetria(dispositivo: string, movimento?: Partial<Movimento>): string {
  const mov = {
    aceleracao_x: movimento?.aceleracaoX ?? (movimento as any)?.aceleracao_x ?? 0,
    aceleracao_y: movimento?.aceleracaoY ?? (movimento as any)?.aceleracao_y ?? 0,
    aceleracao_z: movimento?.aceleracaoZ ?? (movimento as any)?.aceleracao_z ?? 9.8,
    inclinacao_x: movimento?.inclinacaoX ?? (movimento as any)?.inclinacao_x ?? 0,
    inclinacao_y: movimento?.inclinacaoY ?? (movimento as any)?.inclinacao_y ?? 0,
    magnitude: movimento?.magnitude ?? 0,
  };

  return JSON.stringify({
    tipo: "telemetria",
    dispositivo,
    tempo: Date.now(),
    movimento: mov,
  });
}

export function montarEvento(dispositivo: string, tipo: TipoEvento, movimento?: Partial<Movimento>, gravidade = "critica"): string {
  const mov = {
    aceleracao_x: movimento?.aceleracaoX ?? (movimento as any)?.aceleracao_x ?? 0,
    aceleracao_y: movimento?.aceleracaoY ?? (movimento as any)?.aceleracao_y ?? 0,
    aceleracao_z: movimento?.aceleracaoZ ?? (movimento as any)?.aceleracao_z ?? 9.8,
    inclinacao_x: movimento?.inclinacaoX ?? (movimento as any)?.inclinacao_x ?? 0,
    inclinacao_y: movimento?.inclinacaoY ?? (movimento as any)?.inclinacao_y ?? 0,
    magnitude: movimento?.magnitude ?? 0,
  };

  return JSON.stringify({
    tipo: "evento",
    dispositivo,
    id_evento: 1,
    tempo: Date.now(),
    evento: {
      tipo,
      gravidade,
    },
    movimento: mov,
  });
}
