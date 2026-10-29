import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { branchModel } from "../../models/branchModel.js";

export class BranchRepository extends RepositoryBase<branchModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): branchModel {
    return new branchModel(
      String(documento.nome ?? ""),
      documento.empresaId,
      documento.matriz,
      documento._id ? String(documento._id) : undefined
    );
  }
}
