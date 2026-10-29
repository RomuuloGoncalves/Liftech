import { coreModel } from "../core/coreModel.js";

export interface DadosIncidente {
    dataIncidente?: Date;
    forcaImpacto?: number | null;
    status?: string;
    origem?: string;
    descricao?: string | null;
    // Referências guardadas como vieram (ObjectId ou texto), para a gravação não mudar o tipo.
    filialId?: unknown;
    empilhadeiraId?: unknown;
    operadorId?: unknown;
}

export class incidentModel extends coreModel {
    // _id como veio do banco (ObjectId): as consultas seguintes usam o mesmo valor.
    private _id?: unknown;
    private dados: DadosIncidente;

    constructor(dados: DadosIncidente, id?: unknown) {
        super();
        this.dados = dados;
        if (id !== undefined && id !== null) {
            this._id = id;
        }
    }

    public getID(): string | undefined {
        return this._id === undefined ? undefined : String(this._id);
    }

    public getIdOriginal(): unknown {
        return this._id;
    }

    public getDados(): DadosIncidente {
        return this.dados;
    }

    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id !== undefined && { _id: this._id }),
            ...this.dados
        };
    }
}
