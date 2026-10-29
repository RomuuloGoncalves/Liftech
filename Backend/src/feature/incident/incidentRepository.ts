import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { incidentModel } from "../../models/incidentModel.js";

const CAMPOS = ["dataIncidente", "forcaImpacto", "status", "origem", "descricao", "filialId", "empilhadeiraId", "operadorId"] as const;

export class IncidentRepository extends RepositoryBase<incidentModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  // Só os campos presentes no documento entram no modelo.
  protected converterParaModelo(documento: Record<string, any>): incidentModel {
    const dados = Object.fromEntries(CAMPOS.filter((campo) => documento[campo] !== undefined).map((campo) => [campo, documento[campo]]));
    return new incidentModel(dados, documento._id);
  }
}
