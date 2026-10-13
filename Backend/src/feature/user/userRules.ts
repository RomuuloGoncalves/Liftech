import requestCheckPkg from "request-check";
import * as isness from "@zarco/isness";
import { Types } from "mongoose";

const requestCheck = (requestCheckPkg as unknown as { default: typeof requestCheckPkg }).default ?? requestCheckPkg;

// @ts-ignore
const regras: any = requestCheck();

regras.addRules("nome", [{
  validator: (nome: string) => isness.string(nome) && nome.trim().length > 0,
  message: "O campo 'nome' é obrigatório e deve ser texto válido.",
}]);

regras.addRules("role", [{
  validator: (role: string) => role === "admin" || role === "colaborador",
  message: "O campo 'role' deve ser 'admin' ou 'colaborador'.",
}]);

const objectIdTexto = (valor: unknown) => isness.string(valor) && Types.ObjectId.isValid(valor as string);

regras.addRules("escopo", [{
  validator: (escopo: string) => escopo === "empresa" || escopo === "filiais",
  message: "O campo 'escopo' deve ser 'empresa' ou 'filiais'.",
}]);

regras.addRules("filiaisIds", [{
  validator: (ids: unknown) => Array.isArray(ids) && ids.every(objectIdTexto),
  message: "O campo 'filiaisIds' deve ser uma lista de ObjectId válidos do MongoDB.",
}]);

export default regras;
