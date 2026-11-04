import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { OperatorModel } from "../../models/operatorModel.js";

const CAMPOS = ["nome", "matricula", "telefone", "cargo", "horarioEntrada", "horarioSaida", "empresaId", "filialId"] as const;

export class OperatorRepository extends RepositoryBase<OperatorModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  // Só os campos presentes no documento entram no modelo.
  protected converterParaModelo(documento: Record<string, unknown>): OperatorModel {
    const dados = Object.fromEntries(CAMPOS.filter((campo) => documento[campo] !== undefined).map((campo) => [campo, documento[campo]]));
    return new OperatorModel(dados, documento._id);
  }
}
