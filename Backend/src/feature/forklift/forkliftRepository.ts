import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { forkliftModel } from "../../models/forkliftModel.js";

export class ForkliftRepository extends RepositoryBase<forkliftModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, unknown>): forkliftModel {
    return new forkliftModel(
      String(documento.identificacao ?? ""),
      documento.dispositivoConectadoId ? String(documento.dispositivoConectadoId) : undefined,
      documento.operadorConectadoId ? String(documento.operadorConectadoId) : undefined,
      String(documento._id ?? "")
    );
  }

  async obterPorIdentificacao(identificacao: string): Promise<forkliftModel | null> {
    const documento = await this.bd.findOne({ identificacao }).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, unknown>);
  }
}
