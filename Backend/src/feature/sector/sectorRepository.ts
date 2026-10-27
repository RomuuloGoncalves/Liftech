import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { sectorModel } from "../../models/sectorModel.js";

export class SectorRepository extends RepositoryBase<sectorModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): sectorModel {
    return new sectorModel(
      String(documento.nome ?? ""),
      String(documento.filialId ?? ""),
      documento._id ? String(documento._id) : undefined
    );
  }
}
