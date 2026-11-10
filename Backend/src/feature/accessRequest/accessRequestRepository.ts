import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { AccessRequestModel } from "../../models/accessRequestModel.js";

export class AccessRequestRepository extends RepositoryBase<AccessRequestModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): AccessRequestModel {
    return new AccessRequestModel({ ...documento });
  }
}
