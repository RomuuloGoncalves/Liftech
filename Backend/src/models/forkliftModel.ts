import { coreModel } from "../core/coreModel.js";

export class forkliftModel extends coreModel {
    protected id: string | undefined;
    protected identificacao: string;
    protected dispositivoConectadoId: string | undefined;
    protected operadorConectadoId: string | undefined;
    protected filialId: string | undefined;
    // Documento como veio do banco (status, setor, categoria, sessão, ids originais): lido pelos services de máquina.
    // Não entra no obterDados, que é o formato de /api/forklifts.
    protected documento: Record<string, any>;

    constructor(
        identificacao: string,
        dispositivoConectadoId?: string,
        operadorConectadoId?: string,
        id?: string,
        filialId?: string,
        documento: Record<string, any> = {}
    ) {
        super();
        this.documento = documento;
        this.id = id;
        this.identificacao = identificacao;
        this.dispositivoConectadoId = dispositivoConectadoId;
        this.operadorConectadoId = operadorConectadoId;
        this.filialId = filialId;
    }

    obterDados(): Record<string, unknown> {
        return {
            ...(this.id ? { _id: this.id } : {}),
            id: this.identificacao,
            dispositivoConectadoId: this.dispositivoConectadoId,
            operadorConectadoId: this.operadorConectadoId,
            filialId: this.filialId
        };
    }

    public getID(): string | undefined {
        return this.id;
    }

    public getIdOriginal(): unknown {
        return this.documento._id;
    }

    public getDocumento(): Record<string, any> {
        return this.documento;
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
