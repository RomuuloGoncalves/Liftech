import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { iniciarConsumidor, pararConsumidor, tratar, _obterEstadoConsumidor } from "../../src/feature/telemetry/telemetryConsumer.js";
import { env } from "../../src/config/env.js";
import { logger } from "../../src/utils/logger.js";
import { lerMensagem } from "../../src/feature/telemetry/telemetryContrato.js";
import { processarMensagem } from "../../src/feature/telemetry/telemetryIngestService.js";
import amqplib from "amqplib";

vi.mock("amqplib", () => ({
  default: {
    connect: vi.fn(),
  },
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../src/feature/telemetry/telemetryContrato.js", () => ({
  lerMensagem: vi.fn(),
}));

vi.mock("../../src/feature/telemetry/telemetryIngestService.js", () => ({
  processarMensagem: vi.fn(),
}));

describe("telemetryConsumer (T15: Conexão e Topologia)", () => {
  let mockChannel: any;
  let mockConnection: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    await pararConsumidor();

    mockChannel = {
      assertExchange: vi.fn().mockResolvedValue({}),
      assertQueue: vi.fn().mockResolvedValue({}),
      bindQueue: vi.fn().mockResolvedValue({}),
      prefetch: vi.fn().mockResolvedValue({}),
      consume: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
    };

    mockConnection = {
      createChannel: vi.fn().mockResolvedValue(mockChannel),
      on: vi.fn(),
      close: vi.fn().mockResolvedValue({}),
    };

    vi.mocked(amqplib.connect).mockResolvedValue(mockConnection as any);
  });

  afterEach(async () => {
    await pararConsumidor();
  });

  test("sem rabbit_url: loga aviso e retorna sem conectar", async () => {
    const originalUrl = env.rabbit_url;
    (env as any).rabbit_url = undefined;

    try {
      await iniciarConsumidor();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("RABBITMQ_URL não configurada"));
      expect(amqplib.connect).not.toHaveBeenCalled();
    } finally {
      (env as any).rabbit_url = originalUrl;
    }
  });

  test("com rabbit_url: conecta e declara topologia esperada com TTL e bindings", async () => {
    const originalUrl = env.rabbit_url;
    const originalPrefixo = env.rabbit_prefixo;
    (env as any).rabbit_url = "amqp://localhost:5672";
    (env as any).rabbit_prefixo = "dev_";

    try {
      await iniciarConsumidor();

      expect(amqplib.connect).toHaveBeenCalledWith("amqp://localhost:5672");
      expect(mockChannel.assertExchange).toHaveBeenCalledWith("amq.topic", "topic", { durable: true });

      expect(mockChannel.assertQueue).toHaveBeenCalledWith("dev_telemetria", {
        durable: true,
        arguments: { "x-message-ttl": 60000 },
      });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith("dev_telemetria", "amq.topic", "dev_telemetria.*");

      expect(mockChannel.assertQueue).toHaveBeenCalledWith("dev_eventos", {
        durable: true,
        arguments: { "x-message-ttl": 300000 },
      });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith("dev_eventos", "amq.topic", "dev_evento.*");

      expect(mockChannel.prefetch).toHaveBeenCalledWith(1);
      expect(mockChannel.consume).toHaveBeenCalledWith("dev_telemetria", expect.any(Function));
      expect(mockChannel.consume).toHaveBeenCalledWith("dev_eventos", expect.any(Function));
    } finally {
      (env as any).rabbit_url = originalUrl;
      (env as any).rabbit_prefixo = originalPrefixo;
    }
  });
});

describe("telemetryConsumer (T16: Ack, Descarte e Reentrega)", () => {
  let mockChannel: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel = {
      ack: vi.fn(),
      nack: vi.fn(),
    };
  });

  test("mensagem válida: processarMensagem é chamado e ack ocorre após processamento", async () => {
    const msg = {
      content: Buffer.from('{"tipo":"telemetria"}'),
      fields: { redelivered: false },
    } as any;

    const parsed = { tipo: "telemetria", dispositivo: "AA:BB:CC:DD:EE:FF" } as any;
    vi.mocked(lerMensagem).mockReturnValue(parsed);
    vi.mocked(processarMensagem).mockResolvedValue(undefined);

    await tratar(msg, mockChannel);

    expect(lerMensagem).toHaveBeenCalledWith(msg.content);
    expect(processarMensagem).toHaveBeenCalledWith(parsed);
    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });

  test("mensagem inválida: descarta com log e faz ack, sem requeue", async () => {
    const msg = {
      content: Buffer.from("invalid json"),
      fields: { redelivered: false },
    } as any;

    vi.mocked(lerMensagem).mockReturnValue(null);

    await tratar(msg, mockChannel);

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("descartada: formato ou campos inválidos"));
    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(mockChannel.nack).not.toHaveBeenCalled();
    expect(processarMensagem).not.toHaveBeenCalled();
  });

  test("erro de banco com redelivered: false: faz nack com requeue", async () => {
    const msg = {
      content: Buffer.from('{"tipo":"telemetria"}'),
      fields: { redelivered: false },
    } as any;

    const parsed = { tipo: "telemetria" } as any;
    vi.mocked(lerMensagem).mockReturnValue(parsed);
    vi.mocked(processarMensagem).mockRejectedValue(new Error("Erro de conexão com o banco"));

    await tratar(msg, mockChannel);

    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, true);
    expect(mockChannel.ack).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("requeue agendado"));
  });

  test("erro de banco com redelivered: true: descarta com log de erro e faz ack", async () => {
    const msg = {
      content: Buffer.from('{"tipo":"telemetria"}'),
      fields: { redelivered: true },
    } as any;

    const parsed = { tipo: "telemetria" } as any;
    vi.mocked(lerMensagem).mockReturnValue(parsed);
    vi.mocked(processarMensagem).mockRejectedValue(new Error("Erro persistente no banco"));

    await tratar(msg, mockChannel);

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("descartando"));
    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });
});

describe("telemetryConsumer (T17: Reconexão do Consumidor)", () => {
  let mockChannel: any;
  let mockConnection: any;
  let closeListener: (() => void) | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    await pararConsumidor();
    closeListener = null;

    mockChannel = {
      assertExchange: vi.fn().mockResolvedValue({}),
      assertQueue: vi.fn().mockResolvedValue({}),
      bindQueue: vi.fn().mockResolvedValue({}),
      prefetch: vi.fn().mockResolvedValue({}),
      consume: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
    };

    mockConnection = {
      createChannel: vi.fn().mockResolvedValue(mockChannel),
      on: vi.fn().mockImplementation((event: string, cb: () => void) => {
        if (event === "close") {
          closeListener = cb;
        }
      }),
      close: vi.fn().mockResolvedValue({}),
    };
  });

  afterEach(async () => {
    vi.useRealTimers();
    await pararConsumidor();
  });

  test("falha ao conectar agenda reconexão exponencial (1s, 2s, 4s... até 30s) sem quebrar processo", async () => {
    vi.useFakeTimers();
    const originalUrl = env.rabbit_url;
    (env as any).rabbit_url = "amqp://localhost:5672";

    try {
      vi.mocked(amqplib.connect).mockRejectedValue(new Error("Connection refused"));

      await iniciarConsumidor();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Connection refused"));
      expect(_obterEstadoConsumidor().tentativa).toBe(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(_obterEstadoConsumidor().tentativa).toBe(2);

      await vi.advanceTimersByTimeAsync(2000);
      expect(_obterEstadoConsumidor().tentativa).toBe(3);

      await vi.advanceTimersByTimeAsync(4000);
      expect(_obterEstadoConsumidor().tentativa).toBe(4);

      await vi.advanceTimersByTimeAsync(8000);
      expect(_obterEstadoConsumidor().tentativa).toBe(5);

      await vi.advanceTimersByTimeAsync(16000);
      expect(_obterEstadoConsumidor().tentativa).toBe(6);

      await vi.advanceTimersByTimeAsync(30000);
      expect(_obterEstadoConsumidor().tentativa).toBe(7);
    } finally {
      (env as any).rabbit_url = originalUrl;
    }
  });

  test("evento close na conexão dispara reconexão e reconexão bem-sucedida zera a espera", async () => {
    vi.useFakeTimers();
    const originalUrl = env.rabbit_url;
    (env as any).rabbit_url = "amqp://localhost:5672";

    try {
      vi.mocked(amqplib.connect).mockResolvedValueOnce(mockConnection as any);

      await iniciarConsumidor();
      expect(amqplib.connect).toHaveBeenCalledTimes(1);
      expect(_obterEstadoConsumidor().tentativa).toBe(0);
      expect(closeListener).toBeDefined();

      vi.mocked(amqplib.connect).mockResolvedValueOnce(mockConnection as any);

      closeListener!();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Conexão com RabbitMQ fechada"));
      expect(_obterEstadoConsumidor().tentativa).toBe(1);

      await vi.advanceTimersByTimeAsync(1000);

      expect(amqplib.connect).toHaveBeenCalledTimes(2);
      expect(_obterEstadoConsumidor().tentativa).toBe(0);
    } finally {
      (env as any).rabbit_url = originalUrl;
    }
  });

  test("falha de setup após connect fecha a conexão para não vazar e mantém incremento de tentativa", async () => {
    vi.useFakeTimers();
    const originalUrl = env.rabbit_url;
    (env as any).rabbit_url = "amqp://localhost:5672";

    try {
      mockChannel.assertQueue.mockRejectedValueOnce(new Error("PRECONDITION_FAILED"));
      vi.mocked(amqplib.connect).mockResolvedValueOnce(mockConnection as any);

      await iniciarConsumidor();

      expect(mockConnection.close).toHaveBeenCalledTimes(1);
      expect(_obterEstadoConsumidor().tentativa).toBe(1);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("PRECONDITION_FAILED"));
    } finally {
      (env as any).rabbit_url = originalUrl;
    }
  });

  test("evento close no canal fecha a conexão para disparar fluxo de reconexão", async () => {
    vi.useFakeTimers();
    const originalUrl = env.rabbit_url;
    (env as any).rabbit_url = "amqp://localhost:5672";

    let canalCloseListener: (() => void) | null = null;
    mockChannel.on.mockImplementation((event: string, cb: () => void) => {
      if (event === "close") {
        canalCloseListener = cb;
      }
    });

    try {
      vi.mocked(amqplib.connect).mockResolvedValueOnce(mockConnection as any);

      await iniciarConsumidor();
      expect(canalCloseListener).toBeDefined();

      canalCloseListener!();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Canal do RabbitMQ fechado"));
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
    } finally {
      (env as any).rabbit_url = originalUrl;
    }
  });
});
