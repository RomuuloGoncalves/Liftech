import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { incidentModel, type StatusIncidente } from "../../models/incidentModel.js";

export class IncidentRepository extends RepositoryBase<incidentModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, unknown>): incidentModel {
    return new incidentModel(
      new Date(documento.dataIncidente as string | Date),
      Number(documento.forcaImpacto),
      documento.status as StatusIncidente,
      documento.empilhadeiraId ? String(documento.empilhadeiraId) : undefined,
      documento.operadorId ? String(documento.operadorId) : undefined,
      documento._id ? String(documento._id) : undefined
    );
  }

  async obterPorStatus(status: string): Promise<incidentModel[]> {
    const documentos = await this.bd.find({ status }).sort({ dataIncidente: -1 }).lean();
    return documentos.map((documento) =>
      this.converterParaModelo(documento as Record<string, unknown>)
    );
  }

  async obterPorEmpilhadeira(empilhadeiraId: string): Promise<incidentModel[]> {
    const documentos = await this.bd.find({ empilhadeiraId }).sort({ dataIncidente: -1 }).lean();
    return documentos.map((documento) =>
      this.converterParaModelo(documento as Record<string, unknown>)
    );
  }
}