import { forkliftModel } from "../../models/forkliftModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { ForkliftRepository } from "./forkliftRepository.js";

export class ForkliftService extends ServiceBase<forkliftModel, ForkliftRepository> {
  protected readonly nomeEntidade = "Empilhadeira";

  constructor(repositorio: ForkliftRepository) {
    super(repositorio);
  }

  async criar(forklift: forkliftModel): Promise<forkliftModel> {
    const existente = await this.repositorio.obterPorIdentificacao(forklift.getIdentificacao());
    if (existente) {
      throw new Error(`Já existe uma empilhadeira com a identificação "${forklift.getIdentificacao()}".`);
    }

    return super.criar(forklift);
  }
}
