import { coreModel } from "../core/coreModel.js";

export class forkliftModel extends coreModel {
    protected id: string | undefined;
    protected identificacao: string;
    protected dispositivoConectadoId: string | undefined;
    protected operadorConectadoId: string | undefined;

    constructor(
        identificacao: string, 
        dispositivoConectadoId?: string, 
        operadorConectadoId?: string,
        id?: string
    ) {
        super();
        this.id = id;
        this.identificacao = identificacao;
        this.dispositivoConectadoId = dispositivoConectadoId;
        this.operadorConectadoId = operadorConectadoId;
    }

    obterDados(): Record<string, unknown> {
        return {
            ...(this.id ? { _id: this.id } : {}),
            identificacao: this.identificacao,
            dispositivoConectadoId: this.dispositivoConectadoId,
            operadorConectadoId: this.operadorConectadoId
        };
    }

    public getID(): string | undefined {
        return this.id;
    }

    public getIdentificacao(): string {
        return this.identificacao;
    }

    public getDispositivoConectadoId(): string | undefined {
        return this.dispositivoConectadoId;
    }

    public getOperadorConectadoId(): string | undefined {
        return this.operadorConectadoId;
    }

    public setIdentificacao(value: string): void {
        this.identificacao = value;
    }

    public setDispositivoConectadoId(value: string): void {
        this.dispositivoConectadoId = value;
    }

    public setOperadorConectadoId(value: string): void {
        this.operadorConectadoId = value;
    }
}
