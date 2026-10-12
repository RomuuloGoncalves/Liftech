import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { deviceModel } from "../../models/deviceModel.js";

export class DeviceRepository extends RepositoryBase<deviceModel> {
  constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
  }

  protected converterParaModelo(documento: Record<string, any>): deviceModel {
    return new deviceModel(
      String(documento._id ?? ""),
      String(documento.enderecoMac ?? ""),
      String(documento.status ?? ""),
      documento.empilhadeiraId ? String(documento.empilhadeiraId) : null
    );
  }


  async criar(dados: any): Promise<deviceModel> {
    const documento = await this.bd.create(dados);
    return this.converterParaModelo(documento.toObject ? documento.toObject() : documento);
  }

  async listar(): Promise<deviceModel[]> {
    const documentos = await this.bd.find().lean();
    return documentos.map(doc => this.converterParaModelo(doc as Record<string, any>));
  }

  async obterPorId(id: string): Promise<deviceModel | null> {
    const documento = await this.bd.findById(id).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, any>);
  }

  async atualizar(id: string, dados: any): Promise<deviceModel | null> {
    const documento = await this.bd.findByIdAndUpdate(id, dados, { new: true }).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, any>);
  }


  async obterPorMac(enderecoMac: string): Promise<deviceModel | null> {
    const documento = await this.bd.findOne({ enderecoMac }).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, any>);
  }

  async associar(id: string, empilhadeiraId: string | null): Promise<deviceModel | null> {
    const documento = await this.bd.findByIdAndUpdate(
      id,
      { empilhadeiraId },
      { new: true }
    ).lean();
    
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, any>);
  }
}