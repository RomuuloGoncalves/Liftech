import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { FeedbackModel } from "../../models/feedbackModel.js";

export class FeedbackRepository extends RepositoryBase<FeedbackModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): FeedbackModel {
    return new FeedbackModel(
      String(documento.mensagem ?? ""),
      String(documento.usuarioId ?? ""),
      documento.empresaId ? String(documento.empresaId) : null,
      String(documento.role ?? ""),
      documento._id ? String(documento._id) : undefined,
      documento.criadoEm !== undefined ? new Date(documento.criadoEm as string | number | Date) : undefined
    );
  }
}
