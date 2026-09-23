import { forkliftRepository } from "./forkliftRepository.js";
import { type IForkliftPersiscense } from "../../interfaces/forklift/IForkliftPersistence.js";

export class forkliftService extends forkliftRepository {
    constructor(identificacao: string, dispositivoConectadoId: string, operadorConectadoId: string, db: any){
        super(identificacao, dispositivoConectadoId, operadorConectadoId, db);
}

    async criarEmpilhadeira(data: IForkliftPersiscense) {
        return this.create(data);
    }

    async buscarEmpilhadeira(id: number) {
        return this.findById(id);
    }

    async atualizarEmpilhadeira(id: number, identificacao: string) {
        return this.update(id, {identificacao});
    }
}