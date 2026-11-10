import { describe, test, expect, vi } from "vitest";
import mongoose from "mongoose";
import { ForkliftModel } from "../../src/models/forkliftModel.js";
import { ForkliftRepository } from "../../src/feature/forklift/forkliftRepository.js";
import { Forklift } from "../../src/schemas/forklift.js";

vi.mock("../../src/config/conn.js", async () => ({ conn: { mongoose: (await import("mongoose")).default } }));

describe("ForkliftModel", () => {
  test("obterDados inclui filialId", () => {
    const empilhadeira = new ForkliftModel("EMP-001", undefined, undefined, "f1", "filial1");

    expect(empilhadeira.obterDados()).toMatchObject({ _id: "f1", id: "EMP-001", filialId: "filial1" });
  });

  test("manutencaoPorOffline vem false e offlineDesde aceita null no schema Forklift", () => {
    const filialId = new mongoose.Types.ObjectId();
    const doc = new Forklift({ filialId });

    expect(doc.manutencaoPorOffline).toBe(false);
    expect(doc.offlineDesde).toBeNull();
    expect(doc.ultimaLeituraEm).toBeUndefined();

    const data = new Date();
    const docComData = new Forklift({ filialId, offlineDesde: null, ultimaLeituraEm: data, manutencaoPorOffline: true });
    expect(docComData.offlineDesde).toBeNull();
    expect(docComData.ultimaLeituraEm).toEqual(data);
    expect(docComData.manutencaoPorOffline).toBe(true);
  });
});

describe("ForkliftRepository: filialId", () => {
  test("converte o filialId do documento em texto", async () => {
    const filialId = new mongoose.Types.ObjectId();
    const bd = { findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "f1", identificacao: "EMP-001", filialId }) }) };
    const repositorio = new ForkliftRepository(bd as unknown as mongoose.Model<any>);

    const empilhadeira = await repositorio.obterPorIdentificacao("EMP-001");

    expect(empilhadeira!.obterDados()).toMatchObject({ id: "EMP-001", filialId: filialId.toHexString() });
  });
});
