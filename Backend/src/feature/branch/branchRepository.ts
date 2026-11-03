import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { BranchModel } from "../../models/branchModel.js";

export class BranchRepository extends RepositoryBase<BranchModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): BranchModel {
    return new BranchModel(
      String(documento.nome ?? ""),
      documento.empresaId,
      documento.matriz as boolean | undefined,
      documento._id ? String(documento._id) : undefined
    );
  }
}
