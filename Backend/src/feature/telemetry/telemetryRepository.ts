import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { telemetryModel } from "../../models/telemetryModel.js";

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
      String(documento._id ?? "")
    );
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
      .lean();
      
    return documentos.map(doc => this.converterParaModelo(doc as Record<string, any>));
  }
}