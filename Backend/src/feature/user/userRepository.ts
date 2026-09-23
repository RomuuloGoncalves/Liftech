import { userModel } from '../../models/userModel.js';
import { CoreRepositoryMixin } from '../../core/coreRepository.js';
import { type IUserPersistence } from '../../interfaces/user/IUserPersistence.js';
// Aplica o contrato do CoreRepository em cima do userModel
const UserCoreRepository = CoreRepositoryMixin<typeof userModel, IUserPersistence>(userModel);

// userRepository herda de userModel (acessa protected) e cumpre o contrato do CoreRepository
export class userRepository extends UserCoreRepository {
  constructor(nome: string, role: string, private readonly db: any /* seu client de banco */) {
    super(nome, role);
  }

  async findById(id: number): Promise<IUserPersistence | null> {
    throw new Error('Não implementado');
  }

  async findAll(): Promise<IUserPersistence[]> {
    throw new Error('Não implementado');
  }

  async create(data: IUserPersistence): Promise<IUserPersistence> {
    const nomeInvalido = this.setNome(data.nome) === 0;
    const roleInvalida = this.setRole(data.role) === 0;
    if (nomeInvalido || roleInvalida) {
      throw new Error('Dados inválidos');
    }
    // this.getNome() / this.getRole() prontos pra persistir
    throw new Error('Não implementado');
  }

  async update(id: number, data: Partial<IUserPersistence>): Promise<IUserPersistence> {
    if (data.nome !== undefined && this.setNome(data.nome) === 0) {
      throw new Error('Nome inválido');
    }
    if (data.role !== undefined && this.setRole(data.role) === 0) {
      throw new Error('Role inválida');
    }
    throw new Error('Não implementado');
  }

  async delete(id: number): Promise<void> {
    throw new Error('Não implementado');
  }

  async findByNome(nome: string): Promise<IUserPersistence | null> {
    throw new Error('Não implementado');
  }
}