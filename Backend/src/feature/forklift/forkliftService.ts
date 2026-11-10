import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { ForkliftModel } from "../../models/forkliftModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { ForkliftRepository } from "./forkliftRepository.js";

export class ForkliftService extends ServiceBase<ForkliftModel, ForkliftRepository> {
  protected readonly nomeEntidade = "Empilhadeira";

  constructor(repositorio: ForkliftRepository) {
    super(repositorio);
  }

  async criar(forklift: ForkliftModel): Promise<ForkliftModel> {
    const existente = await this.repositorio.obterPorIdentificacao(forklift.getIdentificacao());
    if (existente) {
      throw new ErroHttp(StatusCode.CONFLICT, `Já existe uma empilhadeira com a identificação "${forklift.getIdentificacao()}".`);
    }

    return super.criar(forklift);
  }
}
