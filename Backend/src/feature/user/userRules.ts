import requestCheckPkg from "request-check";
import * as isness from "@zarco/isness";

const requestCheck = (requestCheckPkg as unknown as { default: typeof requestCheckPkg }).default ?? requestCheckPkg;

// @ts-ignore
const regras: any = requestCheck();

regras.addRules("nome", [{
  validator: (nome: string) => isness.string(nome) && nome.trim().length > 0,
  message: "O campo 'nome' é obrigatório e deve ser texto válido.",
}]);

regras.addRules("role", [{
  validator: (role: string) => isness.string(role) && role.trim().length > 0,
  message: "O campo 'role' é obrigatório e deve ser texto válido.",
}]);

export default regras;
