import requestCheckPkg from "request-check";
import * as isness from "@zarco/isness";

const requestCheck = (requestCheckPkg as unknown as { default: typeof requestCheckPkg }).default ?? requestCheckPkg;

// @ts-ignore
const regras: any = requestCheck();

// request-check: check() lê só a 1ª chave de cada objeto e reprova undefined/null/'' com esta mensagem.
regras.setRequiredMessage("O campo ':field' é obrigatório.");

const textoPreenchido = (valor: unknown) => isness.string(valor) && (valor as string).trim().length > 0;

regras.addRules("email", [{
  validator: (email: unknown) => isness.string(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email as string).trim()),
  message: "O campo 'email' deve ser um email válido.",
}]);

regras.addRules("nomeEmpresa", [{
  validator: textoPreenchido,
  message: "O campo 'nomeEmpresa' é obrigatório e deve ser texto válido.",
}]);

regras.addRules("nomeAdministrador", [{
  validator: textoPreenchido,
  message: "O campo 'nomeAdministrador' é obrigatório e deve ser texto válido.",
}]);

export default regras;
