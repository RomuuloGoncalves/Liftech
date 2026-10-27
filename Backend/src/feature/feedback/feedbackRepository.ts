import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { feedbackModel } from "../../models/feedbackModel.js";

export class FeedbackRepository extends RepositoryBase<feedbackModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): feedbackModel {
    return new feedbackModel(
      String(documento.mensagem ?? ""),
      String(documento.usuarioId ?? ""),
      documento.empresaId ? String(documento.empresaId) : null,
      String(documento.role ?? ""),
      documento._id ? String(documento._id) : undefined,
      documento.criadoEm !== undefined ? new Date(documento.criadoEm) : undefined
    );
  }
}
