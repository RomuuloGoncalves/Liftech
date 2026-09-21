import { userRepository } from './userRepository.js';
import { IUserPersistence } from './userRepository.js';

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