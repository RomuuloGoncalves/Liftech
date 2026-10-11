import mongoose from 'mongoose';
import { RepositoryBase } from '../../core/coreRepository.js';
import { incidentModel } from '../../models/incidentModel.js';

export class IncidentRepository extends RepositoryBase<incidentModel> {
    constructor(mongoDB: mongoose.Model<any>) {
        super(mongoDB);
    }

    protected converterParaModelo(documento: Record<string, unknown>): incidentModel {
        return new incidentModel(
            new Date(documento.dataIncidente as string),
            Number(documento.forcaImpacto ?? 0),
            String(documento.status ?? ""),
            String(documento.empilhadeiraId ?? ""),
            String(documento.operadorId ?? "")
        );
    }
}
