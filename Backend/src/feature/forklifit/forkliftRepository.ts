import { forkliftModel } from "../../models/forkliftModel.js";
import { CoreRepositoryMixin } from "../../core/coreRepository.js";
import { type IForkliftPersiscense } from "../../interfaces/forklift/IForkliftPersistence.js";

const ForkliftCoreRepository = CoreRepositoryMixin<typeof forkliftModel, IForkliftPersiscense>(forkliftModel);

export class forkliftRepository extends ForkliftCoreRepository{
    constructor(identificacao: string, dispositivoConectadoId: string, operadorConectadoId: string, db: any){
        super(identificacao, dispositivoConectadoId, operadorConectadoId);
    }

    async findById(id: number): Promise<IForkliftPersiscense | null> {
        throw new Error('Não encontrado');
    }

    async findAll(): Promise<IForkliftPersiscense[]> {
        throw new Error('Não encontrado');
    }

    async create(data: IForkliftPersiscense): Promise<IForkliftPersiscense> {
        const identificacaoVazio = this.setIdentificacao(data.identificacao) === 0;
        if (identificacaoVazio) {
            throw new Error('Dados inválidos');
        }

        throw new Error('Não implementado');
    }

    async update(id: number, data: Partial<IForkliftPersiscense>): Promise<IForkliftPersiscense> {
        throw new Error('Não implementado')
    }

    async delete(id: number): Promise<void> {
        throw new Error('Não foi possível realizar a ação');
    }
}