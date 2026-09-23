import {type ICoreRepository } from "../interfaces/ICoreRepository.js"

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Versão "normal" — use quando o repository NÃO precisa herdar de outra
 * classe (ex.: features sem model com protected pra acessar).
 */
export abstract class CoreRepository<T> implements ICoreRepository<T> {
  abstract findById(id: number): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract create(data: T): Promise<T>;
  abstract update(id: number, data: Partial<T>): Promise<T>;
  abstract delete(id: number): Promise<void>;
}

/**
 * Versão mixin — use quando o repository precisa herdar de outra classe
 * (ex.: userModel, pra acessar os métodos protected) E ainda cumprir
 * o contrato do CoreRepository. TS não permite "extends A, B", então
 * essa função aplica o contrato em cima da classe base que você passar.
 *
 * Uso: const UserCoreRepository = CoreRepositoryMixin<typeof userModel, UserPersistence>(userModel);
 *      class userRepository extends UserCoreRepository { ... }
 */
export function CoreRepositoryMixin<TBase extends Constructor, T>(Base: TBase) {
  abstract class Mixed extends Base implements ICoreRepository<T> {
    abstract findById(id: number): Promise<T | null>;
    abstract findAll(): Promise<T[]>;
    abstract create(data: T): Promise<T>;
    abstract update(id: number, data: Partial<T>): Promise<T>;
    abstract delete(id: number): Promise<void>;
  }
  return Mixed;
}