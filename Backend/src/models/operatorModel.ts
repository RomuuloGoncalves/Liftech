import { coreModel } from "../core/coreModel.js";

export interface DadosOperador {
    nome?: string;
    matricula?: string;
    telefone?: string;
    cargo?: string;
    horarioEntrada?: string;
    horarioSaida?: string;
    // Referências guardadas como vieram (ObjectId ou texto), para a gravação não mudar o tipo.
    empresaId?: unknown;
    filialId?: unknown;
}

export class operatorModel extends coreModel {
    // _id como veio do banco (ObjectId): as consultas seguintes usam o mesmo valor.
    private _id?: unknown;
    private dados: DadosOperador;

    constructor(dados: DadosOperador, id?: unknown) {
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

    public getNome(): string | undefined {
        return this.dados.nome;
    }

    public getMatricula(): string | undefined {
        return this.dados.matricula;
    }

    public getDados(): DadosOperador {
        return this.dados;
    }

    public getFilialId(): unknown {
        return this.dados.filialId;
    }

    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id !== undefined && { _id: this._id }),
            ...this.dados
        };
    }
}
