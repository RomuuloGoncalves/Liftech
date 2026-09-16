export class forkliftModel {
    private identificacao: string;
    private dispositivoConectadoId: string;
    private operadorConectadoId: string;

    constructor(identificacao: string, dispositivoConectadoId: string, operadorConectadoId: string) {
        this.identificacao = identificacao;
        this.dispositivoConectadoId = dispositivoConectadoId;
        this.operadorConectadoId = operadorConectadoId;
    }

    protected setIdentificacao(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.identificacao = value;
    }

    protected getIdentificacao(): string {
        return this.identificacao;
    }

    protected setDispositivoConectadoId(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.dispositivoConectadoId = value;
    }

    protected getDispositivoConectadoId(): string {
        return this.dispositivoConectadoId;
    }

    protected setOperadorConectadoId(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.operadorConectadoId = value;
    }

    protected getOperadorConectadoId(): string {
        return this.operadorConectadoId;
    }
}
