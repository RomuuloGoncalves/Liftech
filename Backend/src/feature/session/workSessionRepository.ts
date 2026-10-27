import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { workSessionModel } from "../../models/workSessionModel.js";

const CAMPOS = ["operadorId", "empilhadeiraId", "filialId", "inicio", "fim"] as const;

export class WorkSessionRepository extends RepositoryBase<workSessionModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  // Só os campos presentes no documento entram no modelo.
  protected converterParaModelo(documento: Record<string, any>): workSessionModel {
    const dados = Object.fromEntries(CAMPOS.filter((campo) => documento[campo] !== undefined).map((campo) => [campo, documento[campo]]));
    return new workSessionModel(dados, documento._id);
  }
}
