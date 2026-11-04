import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { CompanyModel } from "../../models/companyModel.js";

// A empresa não tem rota própria: nasce na aprovação da solicitação de acesso e é lida no login.
export class CompanyRepository extends RepositoryBase<CompanyModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): CompanyModel {
    return new CompanyModel(String(documento.nome ?? ""), documento._id ? String(documento._id) : undefined);
  }
}
