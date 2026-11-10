import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { WorkSessionModel } from "../../models/workSessionModel.js";

const CAMPOS = ["operadorId", "empilhadeiraId", "filialId", "inicio", "fim"] as const;

export class WorkSessionRepository extends RepositoryBase<WorkSessionModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  // Só os campos presentes no documento entram no modelo.
  protected converterParaModelo(documento: Record<string, unknown>): WorkSessionModel {
    const dados = Object.fromEntries(CAMPOS.filter((campo) => documento[campo] !== undefined).map((campo) => [campo, documento[campo]]));
    return new WorkSessionModel(dados, documento._id);
  }
}
