import { coreModel } from "./coreModel.js";
import { RepositoryBase } from "./coreRepository.js";

export abstract class ServiceBase<T extends coreModel, R extends RepositoryBase<T>> {
  protected readonly repositorio: R;
  protected abstract readonly nomeEntidade: string;

  constructor(repositorio: R) {
    this.repositorio = repositorio;
  }

  // `filtro` é o filtro de escopo da rota; fora dele o registro é "não encontrado".
  async listar(filtro?: Record<string, unknown>): Promise<T[]> {
    return this.repositorio.obterTodos(filtro);
  }

  async obterPorId(id: string, filtro?: Record<string, unknown>): Promise<T> {
    const entidade = await this.repositorio.obterPorId(id, filtro);
    if (!entidade) {
      throw new Error(`${this.nomeEntidade} não encontrado(a).`);
    }
    return entidade;
  }

  async criar(entidade: T): Promise<T> {
    const criado = await this.repositorio.criar(entidade);
    if (!criado) {
      throw new Error(`Falha ao criar ${this.nomeEntidade.toLowerCase()}.`);
    }
    return criado;
  }

  async atualizar(id: string, dados: Partial<Record<string, unknown>>, filtro?: Record<string, unknown>): Promise<T> {
    const atualizado = await this.repositorio.atualizarPorId(id, dados, undefined, filtro);
    if (!atualizado) {
      throw new Error(`${this.nomeEntidade} não encontrado(a).`);
    }
    return atualizado;
  }

  async deletar(id: string, filtro?: Record<string, unknown>): Promise<T> {
    const deletado = await this.repositorio.deletarPorId(id, filtro);
    if (!deletado) {
      throw new Error(`${this.nomeEntidade} não encontrado(a).`);
    }
    return deletado;
  }
}
