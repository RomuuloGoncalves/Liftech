import amqplib from "amqplib";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { lerMensagem } from "./telemetryContrato.js";
import { processarMensagem } from "./telemetryIngestService.js";

let tentativa = 0;
let timerReconexao: NodeJS.Timeout | null = null;
let conexaoAtiva: amqplib.ChannelModel | null = null;
let parado = false;

export async function tratar(msg: amqplib.ConsumeMessage, canal: amqplib.Channel): Promise<void> {
  const parsed = lerMensagem(msg.content);
  if (!parsed) {
    logger.warn("Mensagem da fila descartada: formato ou campos inválidos.");
    canal.ack(msg);
    return;
  }

  try {
    await processarMensagem(parsed);
    canal.ack(msg);
  } catch (erro) {
    if (!msg.fields?.redelivered) {
      logger.warn(`Erro ao processar mensagem, requeue agendado: ${erro}`);
      canal.nack(msg, false, true);
    } else {
      logger.error(`Erro ao processar mensagem reentregue, descartando: ${erro}`);
      canal.ack(msg);
    }
  }
}

async function conectar(): Promise<void> {
  if (parado) return;

  if (!env.rabbit_url) {
    logger.warn("RABBITMQ_URL não configurada. Consumidor de telemetria desativado.");
    return;
  }

  let conexao: amqplib.ChannelModel | null = null;

  try {
    conexao = await amqplib.connect(env.rabbit_url);
    conexaoAtiva = conexao;

    conexao.on("error", (err: Error) => {
      logger.error(`Erro na conexão com RabbitMQ: ${err?.message ?? err}`);
    });

    conexao.on("close", () => {
      conexaoAtiva = null;
      if (!parado) {
        logger.warn("Conexão com RabbitMQ fechada. Tentando reconectar...");
        agendarReconexao();
      }
    });

    const canal = await conexao.createChannel();
    canal.on("error", (err: Error) => {
      logger.error(`Erro no canal do RabbitMQ: ${err?.message ?? err}`);
    });

    canal.on("close", () => {
      if (!parado && conexaoAtiva) {
        logger.warn("Canal do RabbitMQ fechado. Encerrando conexão para reconectar...");
        conexaoAtiva.close().catch(() => {});
      }
    });

    const prefixo = env.rabbit_prefixo ?? "";
    await canal.assertExchange("amq.topic", "topic", { durable: true });

    const filaTelemetria = `${prefixo}telemetria`;
    await canal.assertQueue(filaTelemetria, {
      durable: true,
      arguments: { "x-message-ttl": 60000 },
    });
    await canal.bindQueue(filaTelemetria, "amq.topic", `${prefixo}telemetria.*`);

    const filaEventos = `${prefixo}eventos`;
    await canal.assertQueue(filaEventos, {
      durable: true,
      arguments: { "x-message-ttl": 300000 },
    });
    await canal.bindQueue(filaEventos, "amq.topic", `${prefixo}evento.*`);

    await canal.prefetch(1);

    await canal.consume(filaTelemetria, (msg) => {
      if (msg) {
        tratar(msg, canal).catch((err) => {
          logger.error(`Erro inesperado no tratamento de telemetria: ${err}`);
        });
      }
    });

    await canal.consume(filaEventos, (msg) => {
      if (msg) {
        tratar(msg, canal).catch((err) => {
          logger.error(`Erro inesperado no tratamento de eventos: ${err}`);
        });
      }
    });

    tentativa = 0;
    logger.info("Consumidor RabbitMQ iniciado com sucesso.");
  } catch (erro: any) {
    logger.error(`Falha ao conectar ao RabbitMQ: ${erro?.message ?? erro}`);
    if (conexao) {
      try {
        await conexao.close();
      } catch {
        // Ignora erro ao fechar conexão com falha
      }
      if (conexaoAtiva === conexao) {
        conexaoAtiva = null;
      }
    }
    agendarReconexao();
  }
}

function agendarReconexao(): void {
  if (parado || timerReconexao) return;

  const espera = Math.min(30000, 1000 * Math.pow(2, tentativa));
  tentativa++;

  timerReconexao = setTimeout(async () => {
    timerReconexao = null;
    try {
      await conectar();
    } catch {
      // Ignora erro para não gerar unhandledRejection
    }
  }, espera);

  if (timerReconexao.unref) {
    timerReconexao.unref();
  }
}

export async function iniciarConsumidor(): Promise<void> {
  parado = false;
  await conectar();
}

export async function pararConsumidor(): Promise<void> {
  parado = true;
  if (timerReconexao) {
    clearTimeout(timerReconexao);
    timerReconexao = null;
  }
  tentativa = 0;
  if (conexaoAtiva) {
    try {
      await conexaoAtiva.close();
    } catch {
      // Ignora erro ao fechar conexão
    }
    conexaoAtiva = null;
  }
}

export function _obterEstadoConsumidor() {
  return {
    tentativa,
    temTimer: timerReconexao !== null,
    conectado: conexaoAtiva !== null,
  };
}
