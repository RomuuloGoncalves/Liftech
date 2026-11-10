import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { TelemetryModel } from "../../models/telemetryModel.js";
import { LIMITE_HISTORICO } from "../session/sessionService.js";

export class TelemetryRepository extends RepositoryBase<TelemetryModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): TelemetryModel {
    const data = documento.dataDados instanceof Date ? documento.dataDados : new Date(documento.dataDados as string | number);

    return new TelemetryModel(
      data,
      String(documento.dispositivoId ?? ""),
      String(documento._id ?? ""),
      typeof documento.forcaImpacto === "number" ? documento.forcaImpacto : undefined
    );
  }

  override async obterTodos(filtro: Record<string, unknown> = {}): Promise<TelemetryModel[]> {
    const documentos = await this.bd.find(filtro).sort({ dataDados: -1 }).limit(LIMITE_HISTORICO).lean();

    return documentos.map((doc) => this.converterParaModelo(doc as Record<string, unknown>));
  }

  async obterPorDispositivo(dispositivoId: string, dataInicial?: string, dataFinal?: string): Promise<TelemetryModel[]> {
    const query: Record<string, unknown> = { dispositivoId };

    if (dataInicial || dataFinal) {
      query.dataDados = {
        ...(dataInicial && { $gte: new Date(dataInicial) }),
        ...(dataFinal && { $lte: new Date(dataFinal) }),
      };
    }

    const documentos = await this.bd.find(query).sort({ dataDados: -1 }).limit(LIMITE_HISTORICO).lean();

    return documentos.map((doc) => this.converterParaModelo(doc as Record<string, unknown>));
  }
}
