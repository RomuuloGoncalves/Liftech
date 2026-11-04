import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { IncidentModel } from "../../models/incidentModel.js";

const CAMPOS = ["dataIncidente", "forcaImpacto", "status", "origem", "descricao", "filialId", "empilhadeiraId", "operadorId"] as const;

export class IncidentRepository extends RepositoryBase<IncidentModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  // Só os campos presentes no documento entram no modelo.
  protected converterParaModelo(documento: Record<string, unknown>): IncidentModel {
    const dados = Object.fromEntries(CAMPOS.filter((campo) => documento[campo] !== undefined).map((campo) => [campo, documento[campo]]));
    return new IncidentModel(dados, documento._id);
  }
}
