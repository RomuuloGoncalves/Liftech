import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { ForkliftModel, type DocumentoEmpilhadeira } from "../../models/forkliftModel.js";

export class ForkliftRepository extends RepositoryBase<ForkliftModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): ForkliftModel {
    return new ForkliftModel(
      String(documento.identificacao ?? ""),
      documento.dispositivoConectadoId ? String(documento.dispositivoConectadoId) : undefined,
      documento.operadorConectadoId ? String(documento.operadorConectadoId) : undefined,
      String(documento._id ?? ""),
      documento.filialId ? String(documento.filialId) : undefined,
      documento as unknown as DocumentoEmpilhadeira
    );
  }

  async obterPorIdentificacao(identificacao: string): Promise<ForkliftModel | null> {
    const documento = await this.bd.findOne({ identificacao }).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, unknown>);
  }
}
