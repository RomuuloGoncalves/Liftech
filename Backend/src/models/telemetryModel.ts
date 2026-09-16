export class telemetryModel {
    private dataDados: Date;
    private dispositivoId: string;

    constructor(dataDados: Date, dispositivoId: string) {
        this.dataDados = dataDados;
        this.dispositivoId = dispositivoId;
    }

    protected setDataDados(value: Date): number | void {
        if (!value) {
            return 0;
        }
        this.dataDados = value;
    }

    protected getDataDados(): Date {
        return this.dataDados;
    }

    protected setDispositivoId(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.dispositivoId = value;
    }

    protected getDispositivoId(): string {
        return this.dispositivoId;
    }
}
