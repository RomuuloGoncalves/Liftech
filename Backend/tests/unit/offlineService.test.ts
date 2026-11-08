import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  varrerOffline,
  iniciarVarredor,
  pararVarredor,
  _setRepositorios,
  _obterEstadoVarredor,
} from "../../src/feature/telemetry/offlineService.js";
import { aplicarStatus } from "../../src/feature/machine/statusService.js";
import { publicarMaquina, publicar } from "../../src/feature/stream/streamHub.js";

vi.mock("../../src/feature/machine/statusService.js", () => ({
  aplicarStatus: vi.fn(),
}));

vi.mock("../../src/feature/stream/streamHub.js", () => ({
  publicarMaquina: vi.fn(),
  publicar: vi.fn(),
}));

describe("offlineService (T18: Varredor de offline)", () => {
  let mockEmpilhadeiras: any;

  beforeEach(() => {
    vi.clearAllMocks();
    pararVarredor();

    mockEmpilhadeiras = {
      obterTodos: vi.fn(),
      atualizarUm: vi.fn().mockResolvedValue(true),
    };

    _setRepositorios({
      empilhadeiras: mockEmpilhadeiras,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    pararVarredor();
    _setRepositorios();
  });

  test("falha no aplicarStatus não impede o aviso dispositivo_offline", async () => {
    const doc = {
      _id: "fork-009",
      identificacao: "EMP-009",
      filialId: "filial-123",
      status: "disponivel",
      dispositivoConectadoId: "disp-009",
      ultimaLeituraEm: new Date("2026-10-15T12:00:00.000Z"),
      offlineDesde: null,
    };
    mockEmpilhadeiras.obterTodos.mockResolvedValue([{ getDocumento: () => doc }]);
    vi.mocked(aplicarStatus).mockRejectedValueOnce(new Error("falha de banco"));

    await varrerOffline(new Date("2026-10-15T12:00:35.000Z"));

    expect(publicar).toHaveBeenCalledWith("dispositivo_offline", "filial-123", {
      machineId: "fork-009",
      identificacao: "EMP-009",
      filialId: "filial-123",
    });
  });

  test("máquina com leitura de mais de 30s em status disponivel: grava offlineDesde, aplicarStatus(manutencao, true) e publica eventos", async () => {
    const agora = new Date("2026-10-15T12:00:35.000Z");
    const doc = {
      _id: "fork-001",
      identificacao: "EMP-001",
      filialId: "filial-123",
      status: "disponivel",
      dispositivoConectadoId: "disp-001",
      ultimaLeituraEm: new Date("2026-10-15T12:00:00.000Z"),
      offlineDesde: null,
    };

    mockEmpilhadeiras.obterTodos.mockResolvedValue([{ getDocumento: () => doc }]);

    await varrerOffline(agora);

    // Confere filtro de 30s
    expect(mockEmpilhadeiras.obterTodos).toHaveBeenCalledWith({
      dispositivoConectadoId: { $ne: null },
      ultimaLeituraEm: { $ne: null, $lt: new Date("2026-10-15T12:00:05.000Z") },
      offlineDesde: null,
    });

    expect(mockEmpilhadeiras.atualizarUm).toHaveBeenCalledWith(
      { _id: "fork-001", offlineDesde: null, ultimaLeituraEm: { $lt: new Date("2026-10-15T12:00:05.000Z") } },
      { $set: { offlineDesde: agora } }
    );
    expect(aplicarStatus).toHaveBeenCalledWith("fork-001", "manutencao", true);
    expect(publicar).toHaveBeenCalledWith("dispositivo_offline", "filial-123", {
      machineId: "fork-001",
      identificacao: "EMP-001",
      filialId: "filial-123",
    });
  });

  test("máquina com leitura de mais de 30s em outro status (ex.: em_uso): grava offlineDesde e publica maquina, sem mudar status", async () => {
    const agora = new Date("2026-10-15T12:00:35.000Z");
    const doc = {
      _id: "fork-002",
      identificacao: "EMP-002",
      filialId: "filial-123",
      status: "em_uso",
      dispositivoConectadoId: "disp-002",
      ultimaLeituraEm: new Date("2026-10-15T12:00:00.000Z"),
      offlineDesde: null,
    };

    mockEmpilhadeiras.obterTodos.mockResolvedValue([{ getDocumento: () => doc }]);

    await varrerOffline(agora);

    expect(mockEmpilhadeiras.atualizarUm).toHaveBeenCalledWith(
      { _id: "fork-002", offlineDesde: null, ultimaLeituraEm: { $lt: new Date("2026-10-15T12:00:05.000Z") } },
      { $set: { offlineDesde: agora } }
    );
    expect(aplicarStatus).not.toHaveBeenCalled();
    expect(publicarMaquina).toHaveBeenCalledWith("fork-002");
    expect(publicar).toHaveBeenCalledWith("dispositivo_offline", "filial-123", {
      machineId: "fork-002",
      identificacao: "EMP-002",
      filialId: "filial-123",
    });
  });

  test("corrida: se leitura nova chegou antes do update (atualizarUm retorna false), descarta transição", async () => {
    const agora = new Date("2026-10-15T12:00:35.000Z");
    const doc = {
      _id: "fork-003",
      identificacao: "EMP-003",
      filialId: "filial-123",
      status: "disponivel",
      dispositivoConectadoId: "disp-003",
      ultimaLeituraEm: new Date("2026-10-15T12:00:00.000Z"),
      offlineDesde: null,
    };

    mockEmpilhadeiras.obterTodos.mockResolvedValue([{ getDocumento: () => doc }]);
    // Simula que a condição { offlineDesde: null, ultimaLeituraEm: { $lt: limite } } não casou porque chegou leitura
    mockEmpilhadeiras.atualizarUm.mockResolvedValue(false);

    await varrerOffline(agora);

    expect(mockEmpilhadeiras.atualizarUm).toHaveBeenCalled();
    expect(aplicarStatus).not.toHaveBeenCalled();
    expect(publicarMaquina).not.toHaveBeenCalled();
    expect(publicar).not.toHaveBeenCalled();
  });

  test("sem máquinas offline: não faz atualizações nem publica", async () => {
    mockEmpilhadeiras.obterTodos.mockResolvedValue([]);

    await varrerOffline(new Date());

    expect(mockEmpilhadeiras.atualizarUm).not.toHaveBeenCalled();
    expect(aplicarStatus).not.toHaveBeenCalled();
    expect(publicar).not.toHaveBeenCalled();
  });

  test("iniciarVarredor roda periodicamente com intervalo e evita sobreposição de ticks", async () => {
    vi.useFakeTimers();

    let resolverPrimeiroTick: (() => void) | null = null;
    mockEmpilhadeiras.obterTodos
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolverPrimeiroTick = () => resolve([]);
          })
      )
      .mockResolvedValue([]);

    iniciarVarredor(10000);
    expect(_obterEstadoVarredor().ativo).toBe(true);

    // Dispara 1º tick (ainda pendente)
    vi.advanceTimersByTime(10000);
    expect(mockEmpilhadeiras.obterTodos).toHaveBeenCalledTimes(1);

    // Dispara 2º tick enquanto 1º está rodando: deve ignorar
    vi.advanceTimersByTime(10000);
    expect(mockEmpilhadeiras.obterTodos).toHaveBeenCalledTimes(1);

    // Conclui 1º tick
    resolverPrimeiroTick!();
    await vi.advanceTimersByTimeAsync(0);

    // Dispara 3º tick após liberação
    vi.advanceTimersByTime(10000);
    expect(mockEmpilhadeiras.obterTodos).toHaveBeenCalledTimes(2);

    pararVarredor();
    expect(_obterEstadoVarredor().ativo).toBe(false);
  });
});
