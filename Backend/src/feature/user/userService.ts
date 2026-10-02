import { userModel } from "../../models/userModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { UserRepository } from "./userRepository.js";

export class UserService extends ServiceBase<userModel, UserRepository> {
  protected readonly nomeEntidade = "Usuário";

  constructor(repositorio: UserRepository) {
    super(repositorio);
  }

  async criar(user: userModel): Promise<userModel> {
    const existente = await this.repositorio.obterPorNome(user.getNome());
    if (existente) {
      throw new Error(`Já existe um usuário com o nome "${user.getNome()}".`);
    }

    return super.criar(user);
  }
}
