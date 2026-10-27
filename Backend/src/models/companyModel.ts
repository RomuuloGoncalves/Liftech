import { coreModel } from "../core/coreModel.js";

export class companyModel extends coreModel {
    private _id?: string;
    private nome: string;

    constructor(nome: string, id?: string) {
        super();
        this.nome = nome;
        if (id) {
            this._id = id;
        }
    }

    public getID(): string | undefined {
        return this._id;
    }

    public getNome(): string {
        return this.nome;
    }

    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id && { _id: this._id }),
            nome: this.nome
        };
    }
}
