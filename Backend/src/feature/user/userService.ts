import { userRepository } from './userRepository.js';
import { type IUserPersistence } from '../../interfaces/user/IUserPersistence.js';

export class userService extends userRepository {
  constructor(nome: string, role: string, db: any) {
    super(nome, role, db);
  }

  async criarUsuario(data: IUserPersistence) {
    return this.create(data);
  }

  async buscarPorId(id: number) {
    return this.findById(id);
  }

  async atualizarNome(id: number, nome: string) {
    return this.update(id, { nome });
  }
}