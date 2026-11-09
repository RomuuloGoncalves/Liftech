import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { processarMensagem, _setRepositorios } from "../../src/feature/telemetry/telemetryIngestService.js";
import { aplicarStatus } from "../../src/feature/machine/statusService.js";
import { publicarMaquina, publicar } from "../../src/feature/stream/streamHub.js";
import { formatar } from "../../src/feature/incident/incidentService.js";
import { logger } from "../../src/utils/logger.js";
import type { MensagemTelemetria, MensagemEvento } from "../../src/feature/telemetry/telemetryContrato.js";

vi.mock("../../src/feature/machine/statusService.js", () => ({
  aplicarStatus: vi.fn(),
}));

vi.mock("../../src/feature/stream/streamHub.js", () => ({
  publicarMaquina: vi.fn(),
  publicar: vi.fn(),
}));

vi.mock("../../src/feature/incident/incidentService.js", () => ({
  formatar: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("telemetryIngestService (T13: telemetria comum e volta de offline)", () => {
  let mockDispositivos: any;
  let mockEmpilhadeiras: any;
  let mockTelemetrias: any;
  let mockIncidentes: any;
  let mockSessoes: any;

  const movimentoPadrao = {
    aceleracaoX: 0.1,
    aceleracaoY: 0.2,
    aceleracaoZ: 0.98,
    inclinacaoX: 1.5,
    inclinacaoY: 2.0,
    magnitude: 1.0,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDispositivos = {
      obterPorMac: vi.fn(),
    };
    mockEmpilhadeiras = {
      obterUm: vi.fn(),
      buscarPorId: vi.fn(),
      atualizarUm: vi.fn(),
    };
    mockTelemetrias = {
      criarDados: vi.fn(),
    };
    mockIncidentes = {
      criar: vi.fn(),
    };
    mockSessoes = {
      obterUm: vi.fn(),
    };

    _setRepositorios({
      dispositivos: mockDispositivos,
      empilhadeiras: mockEmpilhadeiras,
      telemetrias: mockTelemetrias,
      incidentes: mockIncidentes,
      sessoes: mockSessoes,
    });
  });

  afterEach(() => {
    _setRepositorios();
  });

  test("grava leitura com dataDados igual ao agora recebido e movimento, ignorando tempo", async () => {
    const agora = new Date("2026-10-15T12:00:00.000Z");
    const msg: MensagemTelemetria = {
      tipo: "telemetria",
      dispositivo: "A1:B2:C3:D4:E5:F6",
      tempo: 1234567,
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue({
      getIdOriginal: () => "disp-123",
      obterDados: () => ({ id: "disp-123" }),
    });

    mockEmpilhadeiras.obterUm.mockResolvedValue({
      getDocumento: () => ({
        _id: "fork-456",
        filialId: "filial-789",
        status: "disponivel",
        offlineDesde: null,
      }),
    });

    await processarMensagem(msg, agora);

    expect(mockTelemetrias.criarDados).toHaveBeenCalledWith({
      dispositivoId: "disp-123",
      dataDados: agora,
      movimento: movimentoPadrao,
    });
    expect(mockEmpilhadeiras.atualizarUm).toHaveBeenCalledWith({ _id: "fork-456" }, { $set: { ultimaLeituraEm: agora } });
    expect(aplicarStatus).not.toHaveBeenCalled();
    expect(publicarMaquina).not.toHaveBeenCalled();
  });

  test("MAC em minúsculas casa com o dispositivo em maiúsculas", async () => {
    const agora = new Date("2026-10-15T12:00:00.000Z");
    const msg: MensagemTelemetria = {
      tipo: "telemetria",
      dispositivo: "a1:b2:c3:d4:e5:f6",
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockImplementation(async (mac: string) => {
      if (mac === "A1:B2:C3:D4:E5:F6") {
        return {
          getIdOriginal: () => "disp-123",
          obterDados: () => ({ id: "disp-123" }),
        };
      }
      return null;
    });

    mockEmpilhadeiras.obterUm.mockResolvedValue({
      getDocumento: () => ({
        _id: "fork-456",
        filialId: "filial-789",
        offlineDesde: null,
      }),
    });

    await processarMensagem(msg, agora);

    expect(mockDispositivos.obterPorMac).toHaveBeenCalledWith("A1:B2:C3:D4:E5:F6");
    expect(mockTelemetrias.criarDados).toHaveBeenCalled();
  });

  test("MAC desconhecido descarta com log e não grava leitura nem atualiza máquina", async () => {
    const msg: MensagemTelemetria = {
      tipo: "telemetria",
      dispositivo: "XX:XX:XX:XX:XX:XX",
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue(null);

    await processarMensagem(msg);

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("XX:XX:XX:XX:XX:XX"));
    expect(mockEmpilhadeiras.obterUm).not.toHaveBeenCalled();
    expect(mockTelemetrias.criarDados).not.toHaveBeenCalled();
  });

  test("dispositivo sem máquina ligada descarta com log", async () => {
    const msg: MensagemTelemetria = {
      tipo: "telemetria",
      dispositivo: "A1:B2:C3:D4:E5:F6",
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue({
      getIdOriginal: () => "disp-123",
      obterDados: () => ({ id: "disp-123" }),
    });
    mockEmpilhadeiras.obterUm.mockResolvedValue(null);

    await processarMensagem(msg);

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("não está vinculado"));
    expect(mockTelemetrias.criarDados).not.toHaveBeenCalled();
  });

  test("volta do offline: se manutencaoPorOffline era true, limpa marca e chama aplicarStatus(disponivel)", async () => {
    const agora = new Date("2026-10-15T12:00:00.000Z");
    const msg: MensagemTelemetria = {
      tipo: "telemetria",
      dispositivo: "A1:B2:C3:D4:E5:F6",
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue({
      getIdOriginal: () => "disp-123",
      obterDados: () => ({ id: "disp-123" }),
    });

    mockEmpilhadeiras.obterUm.mockResolvedValue({
      getDocumento: () => ({
        _id: "fork-456",
        filialId: "filial-789",
        status: "manutencao",
        offlineDesde: new Date("2026-10-15T11:59:00.000Z"),
        manutencaoPorOffline: true,
      }),
    });

    await processarMensagem(msg, agora);

    expect(mockEmpilhadeiras.atualizarUm).toHaveBeenCalledWith(
      { _id: "fork-456" },
      { $set: { ultimaLeituraEm: agora, offlineDesde: null, manutencaoPorOffline: false } }
    );
    expect(aplicarStatus).toHaveBeenCalledWith("fork-456", "disponivel");
  });

  test("volta do offline: se manutencao foi manual, limpa marca, publica maquina e mantém status", async () => {
    const agora = new Date("2026-10-15T12:00:00.000Z");
    const msg: MensagemTelemetria = {
      tipo: "telemetria",
      dispositivo: "A1:B2:C3:D4:E5:F6",
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue({
      getIdOriginal: () => "disp-123",
      obterDados: () => ({ id: "disp-123" }),
    });

    mockEmpilhadeiras.obterUm.mockResolvedValue({
      getDocumento: () => ({
        _id: "fork-456",
        filialId: "filial-789",
        status: "manutencao",
        offlineDesde: new Date("2026-10-15T11:59:00.000Z"),
        manutencaoPorOffline: false,
      }),
    });

    await processarMensagem(msg, agora);

    expect(mockEmpilhadeiras.atualizarUm).toHaveBeenCalledWith(
      { _id: "fork-456" },
      { $set: { ultimaLeituraEm: agora, offlineDesde: null, manutencaoPorOffline: false } }
    );
    expect(aplicarStatus).not.toHaveBeenCalled();
    expect(publicarMaquina).toHaveBeenCalledWith("fork-456");
  });
});

describe("telemetryIngestService (T14: processar evento de movimento)", () => {
  let mockDispositivos: any;
  let mockEmpilhadeiras: any;
  let mockTelemetrias: any;
  let mockIncidentes: any;
  let mockSessoes: any;

  const movimentoPadrao = {
    aceleracaoX: 2.5,
    aceleracaoY: 1.0,
    aceleracaoZ: 0.8,
    inclinacaoX: 5.0,
    inclinacaoY: 3.2,
    magnitude: 2.8,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDispositivos = {
      obterPorMac: vi.fn(),
    };
    mockEmpilhadeiras = {
      obterUm: vi.fn(),
      buscarPorId: vi.fn(),
      atualizarUm: vi.fn(),
    };
    mockTelemetrias = {
      criarDados: vi.fn(),
    };
    mockIncidentes = {
      criar: vi.fn(),
    };
    mockSessoes = {
      obterUm: vi.fn(),
    };

    _setRepositorios({
      dispositivos: mockDispositivos,
      empilhadeiras: mockEmpilhadeiras,
      telemetrias: mockTelemetrias,
      incidentes: mockIncidentes,
      sessoes: mockSessoes,
    });
  });

  afterEach(() => {
    _setRepositorios();
  });

  test("evento com sessão aberta: cria incidente, aplica status alerta e publica no stream", async () => {
    const agora = new Date("2026-10-15T12:00:00.000Z");
    const msg: MensagemEvento = {
      tipo: "evento",
      dispositivo: "A1:B2:C3:D4:E5:F6",
      evento: {
        tipo: "colisao",
        gravidade: "alta",
      },
      id_evento: 999,
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue({
      getIdOriginal: () => "disp-123",
      obterDados: () => ({ id: "disp-123" }),
    });

    mockEmpilhadeiras.obterUm.mockResolvedValue({
      getDocumento: () => ({
        _id: "fork-456",
        filialId: "filial-789",
        status: "em_uso",
        offlineDesde: null,
      }),
    });

    mockSessoes.obterUm.mockResolvedValue({
      obterDados: () => ({
        operadorId: "op-001",
        empilhadeiraId: "fork-456",
      }),
    });

    const mockIncidenteCriado = {
      obterDados: () => ({
        _id: "inc-100",
        empilhadeiraId: "fork-456",
        tipo: "colisao",
      }),
    };
    mockIncidentes.criar.mockResolvedValue(mockIncidenteCriado);

    const formatado = {
      _id: "inc-100",
      machineId: "fork-456",
      tipo: "colisao",
      operador: { nome: "Operador Teste" },
    };
    vi.mocked(formatar).mockResolvedValue([formatado] as any);

    await processarMensagem(msg, agora);

    expect(mockIncidentes.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        getDados: expect.any(Function),
      })
    );
    const incidentePassado = mockIncidentes.criar.mock.calls[0][0].getDados();
    expect(incidentePassado).toEqual({
      empilhadeiraId: "fork-456",
      operadorId: "op-001",
      filialId: "filial-789",
      dataIncidente: agora,
      status: "pendente",
      origem: "sensor",
      tipo: "colisao",
      movimento: movimentoPadrao,
    });

    expect(aplicarStatus).toHaveBeenCalledWith("fork-456", "alerta");
    expect(formatar).toHaveBeenCalledWith([mockIncidenteCriado]);
    // Achado 3: o payload publicado no stream deve conter filialId para filtragem de filial ativa no Frontend
    expect(publicar).toHaveBeenCalledWith("incidente", "filial-789", {
      ...formatado,
      filialId: "filial-789",
    });
  });

  test("evento sem sessão aberta: descarta com log, não cria incidente nem muda status", async () => {
    const agora = new Date("2026-10-15T12:00:00.000Z");
    const msg: MensagemEvento = {
      tipo: "evento",
      dispositivo: "A1:B2:C3:D4:E5:F6",
      evento: {
        tipo: "frenagem_brusca",
      },
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue({
      getIdOriginal: () => "disp-123",
      obterDados: () => ({ id: "disp-123" }),
    });

    mockEmpilhadeiras.obterUm.mockResolvedValue({
      getDocumento: () => ({
        _id: "fork-456",
        filialId: "filial-789",
        status: "disponivel",
        offlineDesde: null,
      }),
    });

    mockSessoes.obterUm.mockResolvedValue(null);

    await processarMensagem(msg, agora);

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("não possui sessão aberta"));
    expect(mockIncidentes.criar).not.toHaveBeenCalled();
    expect(aplicarStatus).not.toHaveBeenCalled();
    expect(publicar).not.toHaveBeenCalled();
    // ultimaLeituraEm ainda é atualizado
    expect(mockEmpilhadeiras.atualizarUm).toHaveBeenCalledWith({ _id: "fork-456" }, { $set: { ultimaLeituraEm: agora } });
  });

  test("máquina já em alerta com sessão: cria novo incidente, chama aplicarStatus(alerta) e publicarMaquina (Achado 5)", async () => {
    const agora = new Date("2026-10-15T12:00:00.000Z");
    const msg: MensagemEvento = {
      tipo: "evento",
      dispositivo: "A1:B2:C3:D4:E5:F6",
      evento: {
        tipo: "aceleracao_brusca",
      },
      movimento: movimentoPadrao,
    };

    mockDispositivos.obterPorMac.mockResolvedValue({
      getIdOriginal: () => "disp-123",
      obterDados: () => ({ id: "disp-123" }),
    });

    mockEmpilhadeiras.obterUm.mockResolvedValue({
      getDocumento: () => ({
        _id: "fork-456",
        filialId: "filial-789",
        status: "alerta",
        offlineDesde: null,
      }),
    });

    mockSessoes.obterUm.mockResolvedValue({
      obterDados: () => ({
        operadorId: "op-001",
        empilhadeiraId: "fork-456",
      }),
    });

    mockIncidentes.criar.mockResolvedValue({
      obterDados: () => ({ _id: "inc-200" }),
    });
    vi.mocked(formatar).mockResolvedValue([{ _id: "inc-200" }] as any);

    await processarMensagem(msg, agora);

    expect(mockIncidentes.criar).toHaveBeenCalled();
    expect(aplicarStatus).toHaveBeenCalledWith("fork-456", "alerta");
    // Achado 5: publicarMaquina é chamado mesmo quando status já era alerta para atualizar alertaTipos/urgência no front
    expect(publicarMaquina).toHaveBeenCalledWith("fork-456");
  });
});
