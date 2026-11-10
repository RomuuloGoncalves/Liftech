import { describe, test, expect, vi, beforeEach } from "vitest";
import { TIPOS_EVENTO } from "../../src/feature/telemetry/telemetryContrato.js";
import {
  parseArgs,
  calcularMensagensMes,
  obterRoutingKey,
  gerarMovimentoSimulado,
  TECLAS_EVENTO,
  MAC_PADRAO,
  eventoDaTecla,
  sortearEvento,
  sortearIntervaloEvento,
  deveSilenciar,
  MAC_EVENTOS_DEMO,
  MAC_OFFLINE_DEMO,
  INTERVALO_PADRAO,
  main,
} from "../../src/scripts/simulateHardware.js";
import { env } from "../../src/config/env.js";
import fs from "node:fs";
import path from "node:path";

describe("simulateHardware (T20: Simulador de hardware)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("não importa conn nem mongoose (teste lê o arquivo)", () => {
    const caminho = path.resolve(__dirname, "../../src/scripts/simulateHardware.ts");
    const conteudo = fs.readFileSync(caminho, "utf-8");

    expect(conteudo).not.toMatch(/from\s+['"].*conn/);
    expect(conteudo).not.toMatch(/from\s+['"]mongoose['"]/);
  });

  test("MAC_PADRAO é o primeiro MAC do seed, para o simulador sem --mac achar uma máquina", () => {
    expect(MAC_PADRAO).toBe("A2:C9:9B:1D:F7");
  });

  test("parseArgs com valores padrão", () => {
    const args = parseArgs([]);
    expect(args.mac).toBe(MAC_PADRAO);
    expect(args.macs).toEqual([MAC_PADRAO]);
    expect(args.intervalo).toBe(INTERVALO_PADRAO);
    expect(args.evento).toBeUndefined();
  });

  test("parseArgs com múltiplos MACs repetidos e lista separada por vírgula (Achado 8)", () => {
    const args = parseArgs([
      "--mac",
      "00:11:22:33:44:55,AA:BB:CC:DD:EE:FF",
      "--mac",
      "11:22:33:44:55:66",
      "--intervalo",
      "10",
      "--evento",
      "colisao",
    ]);

    expect(args.macs).toEqual(["00:11:22:33:44:55", "AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"]);
    expect(args.mac).toBe("00:11:22:33:44:55");
    expect(args.intervalo).toBe(10);
    expect(args.evento).toBe("colisao");
  });

  test("parseArgs ignora tipo de evento inválido e intervalo negativo", () => {
    const args = parseArgs(["--intervalo", "-5", "--evento", "tipo_inexistente"]);

    expect(args.intervalo).toBe(INTERVALO_PADRAO);
    expect(args.evento).toBeUndefined();
  });

  test("calcularMensagensMes calcula corretamente para 1 e múltiplos MACs", () => {
    // 30 dias * 24 horas * 3600 segundos = 2.592.000 segundos no mês
    // 2.592.000 / 5 = 518.400 para 1 MAC
    expect(calcularMensagensMes(5)).toBe(518400);
    expect(calcularMensagensMes(5, 1)).toBe(518400);
    // 2.592.000 / 5 * 3 MACs = 1.555.200
    expect(calcularMensagensMes(5, 3)).toBe(1555200);
    // 2.592.000 / 10 = 259.200
    expect(calcularMensagensMes(10)).toBe(259200);
    expect(calcularMensagensMes(0)).toBe(0);
    expect(calcularMensagensMes(5, 0)).toBe(0);
  });

  test("obterRoutingKey formata chaves com prefixo e MAC em maiúsculas", () => {
    expect(obterRoutingKey("telemetria", "a1:b2:c3:d4:e5:f6")).toBe("telemetria.A1:B2:C3:D4:E5:F6");
    expect(obterRoutingKey("evento", "a1:b2:c3:d4:e5:f6", "dev_")).toBe("dev_evento.A1:B2:C3:D4:E5:F6");
  });

  test("gerarMovimentoSimulado retorna estrutura válida de movimento com números finitos", () => {
    const mov = gerarMovimentoSimulado(1);
    expect(typeof mov.aceleracaoX).toBe("number");
    expect(Number.isFinite(mov.aceleracaoX)).toBe(true);
    expect(Number.isFinite(mov.aceleracaoY)).toBe(true);
    expect(Number.isFinite(mov.aceleracaoZ)).toBe(true);
    expect(Number.isFinite(mov.inclinacaoX)).toBe(true);
    expect(Number.isFinite(mov.inclinacaoY)).toBe(true);
    expect(Number.isFinite(mov.magnitude)).toBe(true);
  });

  test("TECLAS_EVENTO mapeia c, f, a, u, i para os 5 tipos", () => {
    expect(TECLAS_EVENTO.c).toBe("colisao");
    expect(TECLAS_EVENTO.f).toBe("frenagem_brusca");
    expect(TECLAS_EVENTO.a).toBe("aceleracao_brusca");
    expect(TECLAS_EVENTO.u).toBe("curva_brusca");
    expect(TECLAS_EVENTO.i).toBe("inclinacao_excessiva");
  });

  test("sem RABBITMQ_URL: encerra com código 1 e mensagem de erro", async () => {
    const originalUrl = env.rabbit_url;
    (env as any).rabbit_url = undefined;

    const mockExit = vi.spyOn(process, "exit").mockImplementation((code?: any) => {
      throw new Error(`process.exit called with ${code}`);
    });
    const mockError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await expect(main([])).rejects.toThrow("process.exit called with 1");
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining("RABBITMQ_URL não configurada"));
    } finally {
      (env as any).rabbit_url = originalUrl;
      mockExit.mockRestore();
      mockError.mockRestore();
    }
  });

  test("eventoDaTecla mapeia as 5 teclas (maiúsculas ou minúsculas) e ignora as outras", () => {
    expect(eventoDaTecla("c")).toBe("colisao");
    expect(eventoDaTecla("F")).toBe("frenagem_brusca");
    expect(eventoDaTecla("a")).toBe("aceleracao_brusca");
    expect(eventoDaTecla("u")).toBe("curva_brusca");
    expect(eventoDaTecla("i")).toBe("inclinacao_excessiva");
    expect(eventoDaTecla("x")).toBeUndefined();
    expect(eventoDaTecla("\n")).toBeUndefined();
  });

  test("--demo sem --mac usa a máquina em uso e a disponível do seed", () => {
    const args = parseArgs(["--demo"]);
    expect(args.demo).toBe(true);
    expect(args.macs).toEqual([MAC_EVENTOS_DEMO, MAC_OFFLINE_DEMO]);
    expect(parseArgs([]).demo).toBe(false);
    expect(parseArgs(["--demo", "--mac", "AA:BB"]).macs).toEqual(["AA:BB"]);
  });

  test("sortearEvento cobre os 5 tipos e sortearIntervaloEvento fica entre 45 s e 90 s", () => {
    const tipos = [0, 0.21, 0.41, 0.61, 0.99].map((r) => sortearEvento(() => r));
    expect(new Set(tipos)).toEqual(new Set(TIPOS_EVENTO));
    expect(sortearIntervaloEvento(() => 0)).toBe(45);
    expect(sortearIntervaloEvento(() => 0.999)).toBe(90);
  });

  test("deveSilenciar fica em silêncio dos 60 s aos 105 s de cada ciclo de 120 s", () => {
    expect(deveSilenciar(0)).toBe(false);
    expect(deveSilenciar(59)).toBe(false);
    expect(deveSilenciar(60)).toBe(true);
    expect(deveSilenciar(104)).toBe(true);
    expect(deveSilenciar(105)).toBe(false);
    expect(deveSilenciar(180)).toBe(true);
    expect(deveSilenciar(225)).toBe(false);
  });
});
