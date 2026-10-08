import requestCheckPkg from "request-check";
import { Types } from "mongoose";
import { STATUS_VALIDOS } from "../../models/incidentModel.js";

const requestCheck = (requestCheckPkg as unknown as { default: typeof requestCheckPkg }).default ?? requestCheckPkg;

// @ts-ignore
const regras: any = requestCheck();

regras.addRules("dataIncidente", [{
  validator: (v: unknown) =>
    (typeof v === "string" || v instanceof Date) && !isNaN(new Date(v).getTime()),
  message: "O campo 'dataIncidente' deve ser uma data válida.",
}]);

regras.addRules("forcaImpacto", [{
  validator: (v: unknown) => v !== "" && v !== null && Number.isFinite(Number(v)) && Number(v) >= 0,
  message: "O campo 'forcaImpacto' deve ser um número maior ou igual a 0.",
}]);

regras.addRules("status", [{
  validator: (v: string) => (STATUS_VALIDOS as readonly string[]).includes(v),
  message: `O campo 'status' deve ser um de: ${STATUS_VALIDOS.join(", ")}.`,
}]);

const isValidObjectId = (value: string | undefined): boolean => {
  if (!value) return true;
  return Types.ObjectId.isValid(value);
};

regras.addRules("empilhadeiraId", [{
  validator: isValidObjectId,
  message: "O campo 'empilhadeiraId' deve ser um ObjectId válido do MongoDB.",
}]);

regras.addRules("operadorId", [{
  validator: isValidObjectId,
  message: "O campo 'operadorId' deve ser um ObjectId válido do MongoDB.",
}]);

export default regras;