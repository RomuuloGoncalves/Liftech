import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { UserModel } from "../../models/userModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { UserRepository } from "./userRepository.js";

export class UserService extends ServiceBase<UserModel, UserRepository> {
  protected readonly nomeEntidade = "Usuário";

  constructor(repositorio: UserRepository) {
    super(repositorio);
  }

  async criar(user: UserModel): Promise<UserModel> {
    const existente = await this.repositorio.obterPorNome(user.getNome());
    if (existente) {
      throw new ErroHttp(StatusCode.CONFLICT, `Já existe um usuário com o nome "${user.getNome()}".`);
    }

    return super.criar(user);
  }
}
