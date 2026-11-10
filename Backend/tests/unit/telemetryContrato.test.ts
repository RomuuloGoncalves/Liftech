import { describe, test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  lerMensagem,
  montarTelemetria,
  montarEvento,
  TIPOS_EVENTO,
  type Movimento,
} from "../../src/feature/telemetry/telemetryContrato.js";

describe("telemetryContrato", () => {
  const mac = "AA:BB:CC:DD:EE:FF";

  test("o módulo não importa conn (verificação estática do código fonte)", () => {
    const filePath = path.resolve(__dirname, "../../src/feature/telemetry/telemetryContrato.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/from\s+["'].*conn(\.js)?["']/);
    expect(content).not.toMatch(/import\s+.*conn/);
  });

  test("lerMensagem aceita mensagem telemetria do firmware e normaliza movimento para camelCase", () => {
    const rawFirmware = {
      tipo: "telemetria",
      dispositivo: mac,
      tempo: 123456,
      movimento: {
        aceleracao_x: 0.12,
        aceleracao_y: -0.34,
        aceleracao_z: 9.81,
        inclinacao_x: 2.5,
        inclinacao_y: -1.2,
        magnitude: 0.36,
      },
    };

    const buffer = Buffer.from(JSON.stringify(rawFirmware));
    const resultado = lerMensagem(buffer);

    expect(resultado).not.toBeNull();
    expect(resultado).toEqual({
      tipo: "telemetria",
      dispositivo: mac,
      tempo: 123456,
      movimento: {
        aceleracaoX: 0.12,
        aceleracaoY: -0.34,
        aceleracaoZ: 9.81,
        inclinacaoX: 2.5,
        inclinacaoY: -1.2,
        magnitude: 0.36,
      },
    });
  });

  test("lerMensagem aceita mensagem evento de cada um dos 5 tipos e normaliza movimento", () => {
    for (const tipo of TIPOS_EVENTO) {
      const rawEvento = {
        tipo: "evento",
        dispositivo: mac,
        id_evento: 42,
        tempo: 654321,
        evento: {
          tipo,
          gravidade: "alta",
        },
        movimento: {
          aceleracao_x: 1.5,
          aceleracao_y: 0.0,
          aceleracao_z: 9.8,
          inclinacao_x: 0.0,
          inclinacao_y: 0.0,
          magnitude: 1.5,
        },
      };

      const resultado = lerMensagem(Buffer.from(JSON.stringify(rawEvento)));
      expect(resultado).not.toBeNull();
      expect(resultado).toEqual({
        tipo: "evento",
        dispositivo: mac,
        id_evento: 42,
        tempo: 654321,
        evento: {
          tipo,
          gravidade: "alta",
        },
        movimento: {
          aceleracaoX: 1.5,
          aceleracaoY: 0.0,
          aceleracaoZ: 9.8,
          inclinacaoX: 0.0,
          inclinacaoY: 0.0,
          magnitude: 1.5,
        },
      });
    }
  });

  test("lerMensagem devolve null para não-JSON", () => {
    expect(lerMensagem(Buffer.from("invalid-json{"))).toBeNull();
    expect(lerMensagem("")).toBeNull();
  });

  test("lerMensagem devolve null para tipo desconhecido", () => {
    const msg = {
      tipo: "outro",
      dispositivo: mac,
      movimento: { aceleracao_x: 0, aceleracao_y: 0, aceleracao_z: 0, inclinacao_x: 0, inclinacao_y: 0, magnitude: 0 },
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(msg)))).toBeNull();
  });

  test("lerMensagem devolve null para ausência de dispositivo ou dispositivo vazio", () => {
    const semDisp = {
      tipo: "telemetria",
      movimento: { aceleracao_x: 0, aceleracao_y: 0, aceleracao_z: 0, inclinacao_x: 0, inclinacao_y: 0, magnitude: 0 },
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(semDisp)))).toBeNull();

    const dispVazio = {
      tipo: "telemetria",
      dispositivo: "   ",
      movimento: { aceleracao_x: 0, aceleracao_y: 0, aceleracao_z: 0, inclinacao_x: 0, inclinacao_y: 0, magnitude: 0 },
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(dispVazio)))).toBeNull();
  });

  test("lerMensagem devolve null para ausência de movimento", () => {
    const semMov = {
      tipo: "telemetria",
      dispositivo: mac,
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(semMov)))).toBeNull();
  });

  test("lerMensagem devolve null para número de movimento não finito, ausente ou NaN", () => {
    const movIncompleto = {
      tipo: "telemetria",
      dispositivo: mac,
      movimento: {
        aceleracao_x: 0,
        aceleracao_y: 0,
        // aceleracao_z faltando
        inclinacao_x: 0,
        inclinacao_y: 0,
        magnitude: 0,
      },
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(movIncompleto)))).toBeNull();

    const movNaoFinito = {
      tipo: "telemetria",
      dispositivo: mac,
      movimento: {
        aceleracao_x: "1.2" as any,
        aceleracao_y: 0,
        aceleracao_z: 9.8,
        inclinacao_x: 0,
        inclinacao_y: 0,
        magnitude: 0,
      },
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(movNaoFinito)))).toBeNull();

    const movNull = {
      tipo: "telemetria",
      dispositivo: mac,
      movimento: null,
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(movNull)))).toBeNull();
  });

  test("lerMensagem devolve null quando evento.tipo está fora dos 5 tipos", () => {
    const eventoInvalido = {
      tipo: "evento",
      dispositivo: mac,
      evento: {
        tipo: "tombamento", // Tipo legado, fora dos 5 canônicos
      },
      movimento: {
        aceleracao_x: 0,
        aceleracao_y: 0,
        aceleracao_z: 9.8,
        inclinacao_x: 0,
        inclinacao_y: 0,
        magnitude: 0,
      },
    };
    expect(lerMensagem(Buffer.from(JSON.stringify(eventoInvalido)))).toBeNull();
  });

  test("montarTelemetria gera mensagem que lerMensagem aceita", () => {
    const customMov: Movimento = {
      aceleracaoX: 0.5,
      aceleracaoY: -0.2,
      aceleracaoZ: 9.7,
      inclinacaoX: 1.1,
      inclinacaoY: -0.8,
      magnitude: 0.54,
    };

    const json = montarTelemetria(mac, customMov);
    const parsed = lerMensagem(json);

    expect(parsed).not.toBeNull();
    expect(parsed!.tipo).toBe("telemetria");
    expect(parsed!.dispositivo).toBe(mac);
    expect(parsed!.movimento).toEqual(customMov);
  });

  test("montarEvento gera mensagem que lerMensagem aceita para todos os 5 tipos", () => {
    for (const tipo of TIPOS_EVENTO) {
      const json = montarEvento(mac, tipo, undefined, "alta");
      const parsed = lerMensagem(json);

      expect(parsed).not.toBeNull();
      expect(parsed!.tipo).toBe("evento");
      expect(parsed!.dispositivo).toBe(mac);
      if (parsed!.tipo === "evento") {
        expect(parsed!.evento.tipo).toBe(tipo);
        expect(parsed!.evento.gravidade).toBe("alta");
      }
    }
  });
});
