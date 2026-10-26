import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { telemetryModel } from "../../models/telemetryModel.js";
import { LIMITE_HISTORICO } from "../session/sessionService.js";

export class TelemetryRepository extends RepositoryBase<telemetryModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): telemetryModel {
    const data = documento.dataDados instanceof Date 
      ? documento.dataDados 
      : new Date(documento.dataDados);
      
    return new telemetryModel(
      data,
      String(documento.dispositivoId ?? ""),
      String(documento._id ?? ""),
      typeof documento.forcaImpacto === "number" ? documento.forcaImpacto : undefined
    );
  }

  override async obterTodos(filtro: Record<string, unknown> = {}): Promise<telemetryModel[]> {
    const documentos = await this.bd
      .find(filtro)
      .sort({ dataDados: -1 })
      .limit(LIMITE_HISTORICO)
      .lean();

    return documentos.map((doc) => this.converterParaModelo(doc as Record<string, any>));
  }

  async obterPorDispositivo(dispositivoId: string, dataInicial?: string, dataFinal?: string): Promise<telemetryModel[]> {
    const query: any = { dispositivoId };

    if (dataInicial || dataFinal) {
      query.dataDados = {};
      if (dataInicial) query.dataDados.$gte = new Date(dataInicial);
      if (dataFinal) query.dataDados.$lte = new Date(dataFinal);
    }

    const documentos = await this.bd
      .find(query)
      .sort({ dataDados: -1 }) 
      .limit(LIMITE_HISTORICO)
      .lean();
      
    return documentos.map(doc => this.converterParaModelo(doc as Record<string, any>));
  }
}