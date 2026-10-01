import mongoose from 'mongoose';
import { RepositoryBase } from '../../core/coreRepository.js';
import { operatorModel } from '../../models/operatorModel.js';

export class UserRepository extends RepositoryBase<operatorModel> {
 constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
 }

 protected converterParaModelo(documento: Record<string, unknown>): operatorModel {
     return new operatorModel(
        String(documento.nome ?? ""),
     );
 }

 async obterPorNome(nome: string): Promise<operatorModel | null> {
    const documento = await this.bd.findOne({nome}).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, unknown>);
 }
}