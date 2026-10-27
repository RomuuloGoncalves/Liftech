import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { operatorModel } from "../../models/operatorModel.js";

const CAMPOS = ["nome", "matricula", "telefone", "cargo", "horarioEntrada", "horarioSaida", "empresaId", "filialId"] as const;

export class OperatorRepository extends RepositoryBase<operatorModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  // Só os campos presentes no documento entram no modelo.
  protected converterParaModelo(documento: Record<string, any>): operatorModel {
    const dados = Object.fromEntries(CAMPOS.filter((campo) => documento[campo] !== undefined).map((campo) => [campo, documento[campo]]));
    return new operatorModel(dados, documento._id);
  }
}
