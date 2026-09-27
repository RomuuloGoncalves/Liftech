import requestCheck from "request-check";
import * as isness from "@zarco/isness";
import { Types } from "mongoose";

// @ts-ignore
const regras: any = requestCheck();

regras.addRules("id", [{
  validator: (id: string) => isness.string(id) && id.trim().length > 0,
  message: "O campo 'id' (identificação) é obrigatório e deve ser texto válido.",
}]);

const isValidObjectId = (value: string | undefined): boolean => {
  if (!value) return true;
  return Types.ObjectId.isValid(value);
};

regras.addRules("dispositivoConectadoId", [{
  validator: isValidObjectId,
  message: "O campo 'dispositivoConectadoId' deve ser um ObjectId válido do MongoDB.",
}]);

regras.addRules("operadorConectadoId", [{
  validator: isValidObjectId,
  message: "O campo 'operadorConectadoId' deve ser um ObjectId válido do MongoDB.",
}]);

export default regras;
