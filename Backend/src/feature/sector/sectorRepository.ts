import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { SectorModel } from "../../models/sectorModel.js";

export class SectorRepository extends RepositoryBase<SectorModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): SectorModel {
    return new SectorModel(
      String(documento.nome ?? ""),
      String(documento.filialId ?? ""),
      documento._id ? String(documento._id) : undefined
    );
  }
}
