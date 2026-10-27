import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { accessRequestModel } from "../../models/accessRequestModel.js";

export class AccessRequestRepository extends RepositoryBase<accessRequestModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): accessRequestModel {
    return new accessRequestModel({ ...documento });
  }
}
