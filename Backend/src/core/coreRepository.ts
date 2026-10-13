import mongoose from "mongoose";
import { coreModel } from "./coreModel.js";

export abstract class RepositoryBase<T extends coreModel> {
  protected bd: mongoose.Model<any>;

  constructor(bd: mongoose.Model<any>) {
    this.bd = bd;
  }

  protected abstract converterParaModelo(documento: Record<string, unknown>): T;

  // `filtro` é o filtro de escopo das rotas; o `_id` pedido sempre vence um `_id` do filtro.
  async obterTodos(filtro: Record<string, unknown> = {}): Promise<T[]> {
    const documentos = await this.bd.find(filtro).lean();
    return documentos.map((doc) =>
      this.converterParaModelo(doc as Record<string, unknown>)
    );
  }

  async obterPorId(id: string, filtro: Record<string, unknown> = {}): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const documento = await this.bd.findOne({ ...filtro, _id: id }).lean();
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

  async atualizarPorId(id: string, dados: Partial<Record<string, unknown>>, options?: mongoose.QueryOptions, filtro: Record<string, unknown> = {}): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const documento = await this.bd.findOneAndUpdate({ ...filtro, _id: id }, dados, { new: true, ...options }).lean();
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(documento as Record<string, unknown>);
  }

  async deletarPorId(id: string, filtro: Record<string, unknown> = {}): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const documento = await this.bd.findOneAndDelete({ ...filtro, _id: id }).lean();
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(documento as Record<string, unknown>);
  }
}
