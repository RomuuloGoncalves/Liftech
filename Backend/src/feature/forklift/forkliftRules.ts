import requestCheck from "request-check";
import * as isness from "@zarco/isness";

const regras = requestCheck.default();

regras.addRules("id", [{
  validator: (id: string) => isness.string(id) && id.trim().length > 0,
  message: "O campo 'id' (identificação) é obrigatório e deve ser texto válido.",
}]);

export default regras;
