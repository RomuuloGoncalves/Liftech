import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { categoryModel } from "../../models/categoryModel.js";

export class CategoryRepository extends RepositoryBase<categoryModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): categoryModel {
    return new categoryModel(
      documento.empresaId ? String(documento.empresaId) : undefined,
      String(documento.nome ?? ""),
      String(documento.cor ?? ""),
      documento.statusVinculados ?? [],
      documento.chave ?? null,
      documento._id
    );
  }
}
