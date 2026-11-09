import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { Forklift } from "../../src/schemas/forklift.js";
import { Incident } from "../../src/schemas/incident.js";

vi.mock("../../src/schemas/forklift.js", () => ({
  Forklift: {
    findById: vi.fn(),
  },
}));

vi.mock("../../src/schemas/incident.js", () => ({
  Incident: {
    find: vi.fn(),
  },
}));

import { conectar, publicar, publicarMaquina, contarClientes, _resetarHub } from "../../src/feature/stream/streamHub.js";

describe("streamHub (T7: Conexões SSE, publicação e heartbeat)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    _resetarHub();
  });

  afterEach(() => {
    _resetarHub();
    vi.useRealTimers();
  });

  function criarMockRes() {
    const headers: Record<string, string> = {};
    const written: string[] = [];
    return {
      setHeader: vi.fn((key: string, val: string) => {
        headers[key] = val;
      }),
      getHeader: vi.fn((key: string) => headers[key]),
      write: vi.fn((chunk: string) => {
        written.push(chunk);
        return true;
      }),
      flushHeaders: vi.fn(),
      _headers: headers,
      _written: written,
    } as unknown as Response & { _headers: Record<string, string>; _written: string[] };
  }

  function criarMockReq(filiais: string[] = []) {
    const callbacks: Record<string, (() => void)[]> = {};
    return {
      escopo: {
        tipo: "filiais" as const,
        filiais: filiais.map((id) => ({ _id: id, nome: `Filial ${id}`, matriz: false })),
      },
      on: vi.fn((event: string, cb: () => void) => {
        callbacks[event] = callbacks[event] || [];
        callbacks[event].push(cb);
      }),
      _trigger: (event: string) => {
        for (const cb of callbacks[event] || []) {
          cb();
        }
      },
    } as unknown as Request & { _trigger: (event: string) => void };
  }

  test("conectar define cabeçalhos corretos para text/event-stream e registra o cliente", () => {
    const req = criarMockReq(["f1"]);
    const res = criarMockRes();

    conectar(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
    expect(res.setHeader).toHaveBeenCalledWith("X-Accel-Buffering", "no");
    expect(res.flushHeaders).toHaveBeenCalled();
    expect(contarClientes()).toBe(1);
  });

  test("evento close na requisição remove o cliente", () => {
    const req = criarMockReq(["f1"]);
    const res = criarMockRes();

    conectar(req, res);
    expect(contarClientes()).toBe(1);

    req._trigger("close");
    expect(contarClientes()).toBe(0);
  });

  test("publicar escreve apenas nas conexões cujo escopo inclui a filial", () => {
    const req1 = criarMockReq(["f1"]);
    const res1 = criarMockRes();

    const req2 = criarMockReq(["f2"]);
    const res2 = criarMockRes();

    const req3 = criarMockReq(["f1", "f2"]);
    const res3 = criarMockRes();

    const reqVazio = criarMockReq([]);
    const resVazio = criarMockRes();

    conectar(req1, res1);
    conectar(req2, res2);
    conectar(req3, res3);
    conectar(reqVazio, resVazio);

    const dados = { id: "m1", status: "alerta" };
    publicar("maquina", "f1", dados);

    const esperado = `event: maquina\ndata: ${JSON.stringify(dados)}\n\n`;

    expect(res1._written).toContain(esperado);
    expect(res3._written).toContain(esperado);
    expect(res2._written).toHaveLength(0);
    expect(resVazio._written).toHaveLength(0);
  });

  test("heartbeat ': ping\\n\\n' é enviado a cada 25 segundos", () => {
    const req = criarMockReq(["f1"]);
    const res = criarMockRes();

    conectar(req, res);
    expect(res._written).toHaveLength(0);

    vi.advanceTimersByTime(25_000);
    expect(res._written).toContain(": ping\n\n");

    vi.advanceTimersByTime(25_000);
    expect(res._written.filter((w) => w === ": ping\n\n")).toHaveLength(2);
  });

  test("erro de escrita no write remove o cliente sem lançar exceção", () => {
    const req = criarMockReq(["f1"]);
    const res = criarMockRes();

    res.write = vi.fn(() => {
      throw new Error("Conexão fechada inesperadamente");
    });

    conectar(req, res);
    expect(contarClientes()).toBe(1);

    // Não deve lançar
    expect(() => {
      publicar("maquina", "f1", { ok: true });
    }).not.toThrow();

    // Cliente deve ter sido removido
    expect(contarClientes()).toBe(0);
  });

  test("erro de escrita no heartbeat remove o cliente sem lançar exceção", () => {
    const req = criarMockReq(["f1"]);
    const res = criarMockRes();

    res.write = vi.fn(() => {
      throw new Error("Broken pipe");
    });

    conectar(req, res);
    expect(contarClientes()).toBe(1);

    expect(() => {
      vi.advanceTimersByTime(25_000);
    }).not.toThrow();

    expect(contarClientes()).toBe(0);
  });
});

describe("publicarMaquina (T8)", () => {
  const MAQUINA_ID = "665f1c2b9a1e4b00123456d1";
  const FILIAL_ID = "665f1c2b9a1e4b00123456b1";

  beforeEach(() => {
    vi.clearAllMocks();
    _resetarHub();
  });

  afterEach(() => {
    _resetarHub();
  });

  function criarMockRes() {
    const written: string[] = [];
    return {
      setHeader: vi.fn(),
      write: vi.fn((chunk: string) => {
        written.push(chunk);
        return true;
      }),
      flushHeaders: vi.fn(),
      _written: written,
    } as unknown as Response & { _written: string[] };
  }

  function criarMockReq(filiais: string[] = []) {
    return {
      escopo: {
        tipo: "filiais" as const,
        filiais: filiais.map((id) => ({ _id: id, nome: `Filial ${id}`, matriz: false })),
      },
      on: vi.fn(),
    } as unknown as Request;
  }

  test("publica maquina com os campos do contrato, alertaTipos ordenados e distintos", async () => {
    const docForklift = {
      _id: MAQUINA_ID,
      identificacao: "EMP-081",
      filialId: FILIAL_ID,
      status: "alerta",
      categoriaId: "cat1",
      categoriaTravada: true,
      offlineDesde: null,
    };

    const docIncidents = [
      {
        _id: "i1",
        empilhadeiraId: MAQUINA_ID,
        dataIncidente: new Date("2026-10-15T12:00:00Z"),
        status: "pendente",
        tipo: "colisao",
      },
      {
        _id: "i2",
        empilhadeiraId: MAQUINA_ID,
        dataIncidente: new Date("2026-10-15T11:00:00Z"),
        status: "pendente",
        tipo: "frenagem_brusca",
      },
      {
        _id: "i3",
        empilhadeiraId: MAQUINA_ID,
        dataIncidente: new Date("2026-10-15T10:00:00Z"),
        status: "pendente",
        tipo: "colisao", // Duplicata: deve ser deduplicado
      },
    ];

    vi.mocked(Forklift.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(docForklift),
    } as any);

    vi.mocked(Incident.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(docIncidents),
      }),
    } as any);

    const req = criarMockReq([FILIAL_ID]);
    const res = criarMockRes();
    conectar(req, res);

    await publicarMaquina(MAQUINA_ID);

    expect(res._written).toHaveLength(1);
    const mensagem = res._written[0]!;
    expect(mensagem).toContain("event: maquina\n");

    const jsonStr = mensagem.replace("event: maquina\ndata: ", "").trim();
    const payload = JSON.parse(jsonStr);

    expect(payload).toEqual({
      id: MAQUINA_ID,
      filialId: FILIAL_ID,
      status: "alerta",
      categoriaId: "cat1",
      categoriaTravada: true,
      alertaEm: new Date("2026-10-15T12:00:00Z").toISOString(),
      alertaTipos: ["colisao", "frenagem_brusca"],
      dispositivoOffline: false,
    });
  });

  test("dispositivoOffline é true quando offlineDesde está preenchido", async () => {
    const docForklift = {
      _id: MAQUINA_ID,
      identificacao: "EMP-081",
      filialId: FILIAL_ID,
      status: "disponivel",
      categoriaId: null,
      categoriaTravada: false,
      offlineDesde: new Date("2026-10-15T12:00:00Z"),
    };

    vi.mocked(Forklift.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(docForklift),
    } as any);

    vi.mocked(Incident.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const req = criarMockReq([FILIAL_ID]);
    const res = criarMockRes();
    conectar(req, res);

    await publicarMaquina(MAQUINA_ID);

    const payload = JSON.parse(res._written[0]!.replace("event: maquina\ndata: ", "").trim());
    expect(payload.dispositivoOffline).toBe(true);
    expect(payload.alertaEm).toBeNull();
    expect(payload.alertaTipos).toEqual([]);
  });

  test("empilhadeira inexistente não publica nem lança erro", async () => {
    vi.mocked(Forklift.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as any);

    const req = criarMockReq([FILIAL_ID]);
    const res = criarMockRes();
    conectar(req, res);

    await expect(publicarMaquina("inexistente")).resolves.toBeUndefined();
    expect(res._written).toHaveLength(0);
  });
});
