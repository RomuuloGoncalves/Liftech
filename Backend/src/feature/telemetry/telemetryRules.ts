import requestCheckPkg from "request-check";
import * as isness from "@zarco/isness";
import { Types } from "mongoose";

const requestCheck = (requestCheckPkg as unknown as { default: typeof requestCheckPkg }).default ?? requestCheckPkg;

// @ts-ignore
const regras: any = requestCheck();

const isValidObjectId = (value: string | undefined): boolean => {
  if (!value) return false; // dispositivoId deve ser obrigatório
  return Types.ObjectId.isValid(value);
};

regras.addRules("dispositivoId", [{
  validator: isValidObjectId,
  message: "O campo 'dispositivoId' é obrigatório e deve ser um ObjectId válido do MongoDB.",
}]);

regras.addRules("dataDados", [{
  validator: (data: any) => {
    if (!data) return false;
    const date = new Date(data);
    return !isNaN(date.getTime());
  },
  message: "O campo 'dataDados' é obrigatório e deve ser uma data válida.",
}]);

export default regras;