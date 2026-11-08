import amqplib from "amqplib";
import { env } from "../config/env.js";
import { montarTelemetria, montarEvento, type Movimento, type TipoEvento, TIPOS_EVENTO } from "../feature/telemetry/telemetryContrato.js";

export const MAC_PADRAO = "A2:C9:9B:1D:F7";
export const INTERVALO_PADRAO = 5;

// Modo --demo: EMP-082 (em_uso no seed, com sessão aberta) recebe eventos sorteados;
// EMP-083 (disponivel) some por 45 s a cada 2 min para mostrar a placa offline.
export const MAC_EVENTOS_DEMO = "A2:C9:9B:1D:F8";
export const MAC_OFFLINE_DEMO = "A2:C9:9B:1D:F9";

export function sortearEvento(rand: () => number = Math.random): TipoEvento {
  return TIPOS_EVENTO[Math.floor(rand() * TIPOS_EVENTO.length)]!;
}

// Entre 45 s e 90 s até o próximo evento do demo.
export function sortearIntervaloEvento(rand: () => number = Math.random): number {
  return 45 + Math.floor(rand() * 46);
}

// Ciclo de 120 s: segundos 60 a 105 sem enviar nada (passa dos 30 s do varredor de offline).
export function deveSilenciar(segundos: number): boolean {
  const t = segundos % 120;
  return t >= 60 && t < 105;
}

export const TECLAS_EVENTO: Record<string, TipoEvento> = {
  c: "colisao",
  f: "frenagem_brusca",
  a: "aceleracao_brusca",
  u: "curva_brusca",
  i: "inclinacao_excessiva",
};

export function eventoDaTecla(tecla: string): TipoEvento | undefined {
  return TECLAS_EVENTO[tecla.toLowerCase()];
}

export interface ArgumentosSimulador {
  macs: string[];
  mac: string;
  intervalo: number;
  evento?: TipoEvento;
  demo: boolean;
}

export function parseArgs(argv: string[]): ArgumentosSimulador {
  const macs: string[] = [];
  let intervalo = INTERVALO_PADRAO;
  let evento: TipoEvento | undefined;
  let demo = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mac" && i + 1 < argv.length) {
      const valor = argv[++i]!;
      const partes = valor
        .split(",")
        .map((m) => m.trim().toUpperCase())
        .filter(Boolean);
      macs.push(...partes);
    } else if (arg === "--intervalo" && i + 1 < argv.length) {
      const parsed = parseFloat(argv[++i]!);
      if (!isNaN(parsed) && parsed > 0) {
        intervalo = parsed;
      }
    } else if (arg === "--demo") {
      demo = true;
    } else if (arg === "--evento" && i + 1 < argv.length) {
      const tipo = argv[++i] as TipoEvento;
      if (TIPOS_EVENTO.includes(tipo)) {
        evento = tipo;
      }
    }
  }

  if (macs.length === 0 && demo) {
    macs.push(MAC_EVENTOS_DEMO, MAC_OFFLINE_DEMO);
  }
  if (macs.length === 0) {
    macs.push(MAC_PADRAO);
  }

  return { macs, mac: macs[0]!, intervalo, evento, demo };
}

export function calcularMensagensMes(intervaloSegundos: number, quantidadeMacs = 1): number {
  if (intervaloSegundos <= 0 || quantidadeMacs <= 0) return 0;
  return Math.round((quantidadeMacs * 30 * 24 * 3600) / intervaloSegundos);
}

export function obterRoutingKey(tipo: "telemetria" | "evento", mac: string, prefixo = ""): string {
  return `${prefixo}${tipo}.${mac.toUpperCase()}`;
}

export function gerarMovimentoSimulado(passo = 0): Movimento {
  const t = passo * 0.1;
  const ax = Math.round(Math.sin(t) * 0.3 * 100) / 100;
  const ay = Math.round(Math.cos(t) * 0.3 * 100) / 100;
  const az = Math.round((0.98 + Math.sin(t * 0.5) * 0.05) * 100) / 100;
  const ix = Math.round(Math.sin(t * 0.7) * 2.0 * 10) / 10;
  const iy = Math.round(Math.cos(t * 0.7) * 2.0 * 10) / 10;
  const magnitude = Math.round(Math.sqrt(ax * ax + ay * ay + az * az) * 100) / 100;

  return {
    aceleracaoX: ax,
    aceleracaoY: ay,
    aceleracaoZ: az,
    inclinacaoX: ix,
    inclinacaoY: iy,
    magnitude,
  };
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  const prefixo = env.rabbit_prefixo ?? "";

  if (!env.rabbit_url) {
    console.error("Erro: Variável de ambiente RABBITMQ_URL não configurada.");
    process.exit(1);
  }

  const mensagensMes = calcularMensagensMes(args.intervalo, args.macs.length);
  console.log("=== Simulador de Hardware Liftech ===");
  console.log(`Dispositivos MAC (${args.macs.length}): ${args.macs.join(", ")}`);
  console.log(`Intervalo de telemetria: ${args.intervalo}s`);
  console.log(`Estimativa de mensagens por mês (30 dias): ~${mensagensMes.toLocaleString("pt-BR")}`);
  console.log(`Exchange: amq.topic (prefixo: "${prefixo}")`);
  console.log("Comandos de evento interativos via teclado:");
  console.log("  [c] Colisão");
  console.log("  [f] Frenagem brusca");
  console.log("  [a] Aceleração brusca");
  console.log("  [u] Curva brusca");
  console.log("  [i] Inclinação excessiva");
  console.log("  [Ctrl+C] Sair");
  console.log("-------------------------------------");

  const conexao = await amqplib.connect(env.rabbit_url);
  const canal = await conexao.createChannel();
  await canal.assertExchange("amq.topic", "topic", { durable: true });

  let passo = 0;
  const inicio = Date.now();

  const enviarTelemetria = () => {
    for (const mac of args.macs) {
      if (args.demo && mac === MAC_OFFLINE_DEMO && deveSilenciar((Date.now() - inicio) / 1000)) {
        console.log(`[DEMO] ${mac} sem enviar (simulando placa offline)`);
        continue;
      }
      const mov = gerarMovimentoSimulado(passo);
      const payload = montarTelemetria(mac, mov);
      const key = obterRoutingKey("telemetria", mac, prefixo);
      canal.publish("amq.topic", key, Buffer.from(payload));
      console.log(`[Telemetria] -> ${key}: ax=${mov.aceleracaoX} ay=${mov.aceleracaoY} az=${mov.aceleracaoZ} mag=${mov.magnitude}`);
    }
    passo++;
  };

  const enviarEvento = (tipo: TipoEvento, macs: string[] = args.macs) => {
    for (const mac of macs) {
      const mov = gerarMovimentoSimulado(passo);
      // Para evento, acentua os valores do movimento de acordo com o tipo
      if (tipo === "colisao") mov.magnitude = 4.5;
      if (tipo === "inclinacao_excessiva") mov.inclinacaoX = 18.5;
      const payload = montarEvento(mac, tipo, mov);
      const key = obterRoutingKey("evento", mac, prefixo);
      canal.publish("amq.topic", key, Buffer.from(payload));
      console.log(`[EVENTO] -> ${key}: tipo=${tipo}`);
    }
  };

  // Se --evento foi passado como argumento CLI, envia uma vez
  if (args.evento) {
    enviarEvento(args.evento);
  }

  // Inicia envio periódico
  enviarTelemetria();
  const timer = setInterval(enviarTelemetria, args.intervalo * 1000);

  // Demo: um evento sorteado de tempos em tempos na máquina em uso
  let timerDemo: NodeJS.Timeout | undefined;
  const agendarEventoDemo = () => {
    timerDemo = setTimeout(() => {
      enviarEvento(sortearEvento(), [MAC_EVENTOS_DEMO]);
      agendarEventoDemo();
    }, sortearIntervaloEvento() * 1000);
  };
  if (args.demo) {
    console.log(
      `[DEMO] ${MAC_EVENTOS_DEMO} (em uso) recebe um evento sorteado a cada 45-90 s; ${MAC_OFFLINE_DEMO} some 45 s a cada 2 min.`
    );
    agendarEventoDemo();
  }

  const encerrar = async () => {
    clearInterval(timer);
    if (timerDemo) clearTimeout(timerDemo);
    try {
      await canal.close();
      await conexao.close();
    } catch {
      // Ignora erro no fechamento
    }
    console.log("\nSimulador encerrado.");
    process.exit(0);
  };

  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (key: string) => {
      if (key === "\u0003") {
        encerrar();
        return;
      }
      const tipo = eventoDaTecla(key);
      if (tipo) {
        enviarEvento(tipo);
      }
    });
  } else {
    // Sem terminal (ex.: rodando pelo "yarn dev --simulate"): lê teclas de linhas digitadas
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (texto: string) => {
      for (const tecla of texto) {
        const tipo = eventoDaTecla(tecla);
        if (tipo) enviarEvento(tipo);
      }
    });
  }
}

if (process.argv[1]?.includes("simulateHardware")) {
  main().catch((err) => {
    console.error("Erro fatal no simulador:", err);
    process.exit(1);
  });
}
