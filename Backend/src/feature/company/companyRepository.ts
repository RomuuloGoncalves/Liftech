import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { companyModel } from "../../models/companyModel.js";

// A empresa não tem rota própria: nasce na aprovação da solicitação de acesso e é lida no login.
export class CompanyRepository extends RepositoryBase<companyModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): companyModel {
    return new companyModel(String(documento.nome ?? ""), documento._id ? String(documento._id) : undefined);
  }
}
