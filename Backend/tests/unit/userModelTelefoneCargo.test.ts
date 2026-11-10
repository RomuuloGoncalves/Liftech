import { describe, test, expect } from "vitest";
import { UserModel } from "../../src/models/userModel.js";

describe("UserModel", () => {
  test("chamada posicional antiga (nome, role, id) continua válida e não traz telefone nem cargo", () => {
    const dados = new UserModel("Bruno", "colaborador", "abc").obterDados();

    expect(dados).toEqual({ _id: "abc", nome: "Bruno", role: "colaborador", filiaisIds: [] });
    expect(dados).not.toHaveProperty("telefone");
    expect(dados).not.toHaveProperty("cargo");
  });

  test("telefone e cargo informados aparecem em obterDados", () => {
    const dados = new UserModel("Bruno", "colaborador", "abc", { telefone: "+55 99 99999999", cargo: "Operador" }).obterDados();

    expect(dados).toEqual({
      _id: "abc",
      nome: "Bruno",
      role: "colaborador",
      telefone: "+55 99 99999999",
      cargo: "Operador",
      filiaisIds: [],
    });
  });

  test("só um dos dois campos: o outro fica fora de obterDados", () => {
    const dados = new UserModel("Bruno", "colaborador", undefined, { cargo: "Operador" }).obterDados();

    expect(dados).toEqual({ nome: "Bruno", role: "colaborador", cargo: "Operador", filiaisIds: [] });
    expect(dados).not.toHaveProperty("telefone");
  });
});
