import mongoose from "mongoose";
import { coreModel } from "./coreModel.js";

export interface OpcoesConsulta {
  ordenacao?: Record<string, 1 | -1>;
  limite?: number;
  // Troca o id da referência pelo documento; `campos` escolhe o que vem dele. Uma lista popula várias referências, na ordem.
  popular?: Popular | Popular[];
}

interface Popular {
  caminho: string;
  campos?: string;
}

export abstract class RepositoryBase<T extends coreModel> {
  protected bd: mongoose.Model<any>;

  constructor(bd: mongoose.Model<any>) {
    this.bd = bd;
  }

  protected abstract converterParaModelo(documento: Record<string, unknown>): T;

  // `filtro` é o filtro de escopo das rotas; o `_id` pedido sempre vence um `_id` do filtro.
  async obterTodos(filtro: Record<string, unknown> = {}, opcoes: OpcoesConsulta = {}): Promise<T[]> {
    let consulta = this.bd.find(filtro);
    if (opcoes.ordenacao) consulta = consulta.sort(opcoes.ordenacao);
    if (opcoes.limite !== undefined) consulta = consulta.limit(opcoes.limite);
    for (const { caminho, campos } of [opcoes.popular ?? []].flat()) {
      consulta = campos ? consulta.populate(caminho, campos) : consulta.populate(caminho);
    }

    const documentos = await consulta.lean();
    return documentos.map((doc) =>
      this.converterParaModelo(doc as Record<string, unknown>)
    );
  }

  // Grava os dados como vieram: para entidades cujo obterDados é o formato da API, e não o do banco.
  async criarDados(dados: Record<string, unknown>): Promise<T> {
    const documento = await this.bd.create(dados);
    return this.converterParaModelo((documento?.toObject ? documento.toObject() : documento) as Record<string, unknown>);
  }

  // Grava vários de uma vez; devolve os _id como o banco gerou, na ordem dos modelos.
  async criarVarios(modelos: T[]): Promise<unknown[]> {
    const documentos = await this.bd.insertMany(modelos.map((modelo) => modelo.obterDados()));
    return documentos.map((documento: Record<string, unknown>) => documento._id);
  }

  async atualizarVarios(filtro: Record<string, unknown>, dados: Record<string, unknown>): Promise<void> {
    await this.bd.updateMany(filtro, dados);
  }

  // Atualiza o primeiro documento que casa com o filtro; devolve se algum casou.
  async atualizarUm(filtro: Record<string, unknown>, dados: Record<string, unknown>): Promise<boolean> {
    const resultado = await this.bd.updateOne(filtro, dados);
    return (resultado?.matchedCount ?? 0) > 0;
  }

  async existe(filtro: Record<string, unknown>): Promise<boolean> {
    return Boolean(await this.bd.exists(filtro));
  }

  async contar(filtro: Record<string, unknown>): Promise<number> {
    return this.bd.countDocuments(filtro);
  }

  // Apaga o primeiro documento que casa com o filtro, sem devolvê-lo; devolve se apagou algum.
  async deletarUm(filtro: Record<string, unknown>): Promise<boolean> {
    const resultado = await this.bd.deleteOne(filtro);
    return (resultado?.deletedCount ?? 0) > 0;
  }

  async deletarVarios(filtro: Record<string, unknown>): Promise<void> {
    await this.bd.deleteMany(filtro);
  }

  // _id dos documentos que casam com o filtro.
  async obterIds(filtro: Record<string, unknown>): Promise<unknown[]> {
    return this.bd.find(filtro).distinct("_id");
  }

  // Valores distintos de um campo entre os documentos do filtro.
  async distinto(campo: string, filtro: Record<string, unknown>): Promise<unknown[]> {
    return this.bd.distinct(campo, filtro);
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

  // Com `options` (ex.: session) o Mongoose exige a forma em lista; sem, grava o objeto direto.
  // `id` em texto ou ObjectId; `campos` traz o que o schema esconde (ex.: "+senhaHash").
  async buscarPorId(id: unknown, campos?: string): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return null;
    }

    const consulta = this.bd.findById(id);
    const documento = await (campos ? consulta.select(campos) : consulta).lean();
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(documento as Record<string, unknown>);
  }

  // Primeiro documento que casa com o filtro; `campos` como em buscarPorId.
  async obterUm(filtro: Record<string, unknown>, campos?: string): Promise<T | null> {
    const consulta = this.bd.findOne(filtro);
    const documento = await (campos ? consulta.select(campos) : consulta).lean();
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(documento as Record<string, unknown>);
  }

  async criar(modelo: T, options?: mongoose.SaveOptions): Promise<T | null> {
    const dados = modelo.obterDados();
    const documento = options ? (await this.bd.create([dados], options))?.[0] : await this.bd.create(dados);
    if (!documento) {
      return null;
    }

    return this.converterParaModelo(
      (documento.toObject ? documento.toObject() : documento) as Record<string, unknown>
    );
  }

  async atualizarPorId(id: string, dados: Partial<Record<string, unknown>>, options?: mongoose.QueryOptions, filtro: Record<string, unknown> = {}): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    // Quem passa `returnDocument` já diz o que quer de volta; sem ele, devolve o documento atualizado.
    const opcoes = options?.returnDocument ? options : { new: true, ...options };
    const documento = await this.bd.findOneAndUpdate({ ...filtro, _id: id }, dados, opcoes).lean();
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
