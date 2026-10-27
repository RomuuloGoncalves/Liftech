import { coreModel } from "../core/coreModel.js";

export class sectorModel extends coreModel {
    private _id?: string;
    private nome: string;
    private filialId: string;

    constructor(nome: string, filialId: string, id?: string) {
        super();
        this.nome = nome;
        this.filialId = filialId;
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

    public getFilialId(): string {
        return this.filialId;
    }

    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id && { _id: this._id }),
            nome: this.nome,
            filialId: this.filialId
        };
    }
}
