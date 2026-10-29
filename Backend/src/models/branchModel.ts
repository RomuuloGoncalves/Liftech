import { coreModel } from "../core/coreModel.js";

export class branchModel extends coreModel {
    private _id?: string;
    private nome: string;
    private empresaId?: unknown;
    private matriz?: boolean;

    constructor(nome: string, empresaId?: unknown, matriz?: boolean, id?: string) {
        super();
        this.nome = nome;
        this.empresaId = empresaId;
        this.matriz = matriz;
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

    public getEmpresaId(): unknown {
        return this.empresaId;
    }

    public getMatriz(): boolean | undefined {
        return this.matriz;
    }

    // `matriz` só vai quando definida; na criação fica com o default do schema.
    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id && { _id: this._id }),
            nome: this.nome,
            empresaId: this.empresaId,
            ...(this.matriz !== undefined && { matriz: this.matriz })
        };
    }
}
