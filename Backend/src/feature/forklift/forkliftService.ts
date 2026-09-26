import { forkliftModel } from "../../models/forkliftModel.js";
import { ForkliftRepository } from "./forkliftRepository.js";

export class ForkliftService {
  private readonly repositorio: ForkliftRepository;

  constructor(repositorio: ForkliftRepository) {
    this.repositorio = repositorio;
  }

  async listar(): Promise<forkliftModel[]> {
    return this.repositorio.obterTodos();
  }

  async obterPorId(id: string): Promise<forkliftModel> {
    const forklift = await this.repositorio.obterPorId(id);
    if (!forklift) {
      throw new Error("Empilhadeira não encontrada.");
    }
    return forklift;
  }

  async criar(forklift: forkliftModel): Promise<forkliftModel> {
    // Verifica se identificação já existe
    const existente = await this.repositorio.obterPorIdentificacao(forklift.getIdentificacao());
    if (existente) {
      throw new Error(`Já existe uma empilhadeira com a identificação "${forklift.getIdentificacao()}".`);
    }

    const criado = await this.repositorio.criar(forklift);
    if (!criado) {
      throw new Error("Falha ao criar empilhadeira.");
    }
    return criado;
  }

  async atualizar(id: string, dados: Partial<Record<string, unknown>>): Promise<forkliftModel> {
    const atualizado = await this.repositorio.atualizarPorId(id, dados);
    if (!atualizado) {
      throw new Error("Empilhadeira não encontrada.");
    }
    return atualizado;
  }

  async deletar(id: string): Promise<forkliftModel> {
    const deletado = await this.repositorio.deletarPorId(id);
    if (!deletado) {
      throw new Error("Empilhadeira não encontrada.");
    }
    return deletado;
  }
}
