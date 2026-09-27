import { coreModel } from "./coreModel.js";
import { RepositoryBase } from "./coreRepository.js";

export abstract class ServiceBase<T extends coreModel, R extends RepositoryBase<T>> {
  protected readonly repositorio: R;
  protected abstract readonly nomeEntidade: string;

  constructor(repositorio: R) {
    this.repositorio = repositorio;
  }

  async listar(): Promise<T[]> {
    return this.repositorio.obterTodos();
  }

  async obterPorId(id: string): Promise<T> {
    const entidade = await this.repositorio.obterPorId(id);
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

  async atualizar(id: string, dados: Partial<Record<string, unknown>>): Promise<T> {
    const atualizado = await this.repositorio.atualizarPorId(id, dados);
    if (!atualizado) {
      throw new Error(`${this.nomeEntidade} não encontrado(a).`);
    }
    return atualizado;
  }

  async deletar(id: string): Promise<T> {
    const deletado = await this.repositorio.deletarPorId(id);
    if (!deletado) {
      throw new Error(`${this.nomeEntidade} não encontrado(a).`);
    }
    return deletado;
  }
}
