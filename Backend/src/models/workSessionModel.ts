import { coreModel } from "../core/coreModel.js";

export interface DadosSessao {
    // Referências guardadas como vieram (ObjectId ou texto), para a gravação não mudar o tipo.
    operadorId?: unknown;
    empilhadeiraId?: unknown;
    filialId?: unknown;
    inicio?: Date;
    fim?: Date | null;
}

export class workSessionModel extends coreModel {
    // _id como veio do banco (ObjectId): as consultas seguintes usam o mesmo valor.
    private _id?: unknown;
    private dados: DadosSessao;

    constructor(dados: DadosSessao, id?: unknown) {
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

    public getDados(): DadosSessao {
        return this.dados;
    }

    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id !== undefined && { _id: this._id }),
            ...this.dados
        };
    }
}
