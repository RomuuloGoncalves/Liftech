import mongoose from "mongoose";
import { coreModel } from "./coreModel.js";

export abstract class RepositoryBase<T extends coreModel> {
  protected bd: mongoose.Model<any>;

  constructor(bd: mongoose.Model<any>) {
    this.bd = bd;
  }

  protected abstract converterParaModelo(documento: Record<string, unknown>): T;

  async obterTodos(): Promise<T[]> {
    const documentos = await this.bd.find().lean();
    return documentos.map((doc) =>
      this.converterParaModelo(doc as Record<string, unknown>)
    );
  }

  async obterPorId(id: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const documento = await this.bd.findById(id).lean();
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(documento as Record<string, unknown>);
  }

  async criar(modelo: T, options?: mongoose.SaveOptions): Promise<T | null> {
    const documentos = await this.bd.create([modelo.obterDados()], options);
    if (!documentos || documentos.length === 0) {
      return null;
    }

    return this.converterParaModelo(
      documentos[0].toObject() as Record<string, unknown>
    );
  }

  async atualizarPorId(id: string, dados: Partial<Record<string, unknown>>, options?: mongoose.QueryOptions): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const documento = await this.bd.findByIdAndUpdate(id, dados, { new: true, ...options }).lean();
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(documento as Record<string, unknown>);
  }

  async deletarPorId(id: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const documento = await this.bd.findByIdAndDelete(id).lean();
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(documento as Record<string, unknown>);
  }
}
