import requestCheckPkg from "request-check";
import * as isness from "@zarco/isness";

const requestCheck = (requestCheckPkg as unknown as { default: typeof requestCheckPkg }).default ?? requestCheckPkg;

// @ts-ignore
const regras: any = requestCheck();

const textoPreenchido = (valor: unknown) => isness.string(valor) && (valor as string).trim().length > 0;

regras.addRules("role", [{
  validator: (role: string) => role === "admin" || role === "colaborador",
  message: "O campo 'role' deve ser 'admin' ou 'colaborador'.",
}]);

regras.addRules("login", [{
  validator: textoPreenchido,
  message: "O campo 'login' é obrigatório e deve ser texto válido.",
}]);

regras.addRules("senha", [{
  validator: textoPreenchido,
  message: "O campo 'senha' é obrigatório e deve ser texto válido.",
}]);

export default regras;
