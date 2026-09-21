import { userModel } from "../../models/userModel.js";
import { CoreRepository } from "../../core/coreRepository.js";

export class UserRepository extends CoreRepository <userModel>{

    async findAll(){
        return await super.findAll();
    }

    async create(nome: string, ) {
        return await super.create();
    }
}