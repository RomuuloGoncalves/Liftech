import requestCheckPkg from "request-check";
import { Types } from "mongoose";

const requestCheck = (requestCheckPkg as unknown as { default: typeof requestCheckPkg }).default ?? requestCheckPkg;

// @ts-ignore
const regras: any = requestCheck();

regras.addRules("enderecoMac", [{
  validator: (value: any) => typeof value === "string" && value.trim().length > 0,
  message: "O campo 'enderecoMac' é obrigatório e deve ser um texto válido.",
}]);

regras.addRules("status", [{
  validator: (value: any) => typeof value === "string" && value.trim().length > 0,
  message: "O campo 'status' é obrigatório e deve ser um texto válido.",
}]);

// @ts-ignore
const regrasAssign: any = requestCheck();
regrasAssign.addRules("empilhadeiraId", [{
  validator: (value: any) => {
    if (!value) return true; 
    return Types.ObjectId.isValid(value);
  },
  message: "O campo 'empilhadeiraId' deve ser um ObjectId válido do MongoDB.",
}]);

export default regras;