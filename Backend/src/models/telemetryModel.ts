export class telemetryModel {
    private dataDados: Date;
    private dispositivoId: string;
    private _id?: string;

    constructor(dataDados: Date, dispositivoId: string, id?: string) {
        this.dataDados = dataDados;
        this.dispositivoId = dispositivoId;
        if (id) {
            this._id = id;
        }
    }

    public getID(): string | undefined {
        return this._id;
    }

    public setID(value: string): void {
        this._id = value;
    }

    public setDataDados(value: Date): void {
        if (!value) return;
        this.dataDados = value;
    }

    public getDataDados(): Date {
        return this.dataDados;
    }

    public setDispositivoId(value: string): void {
        if (!value) return;
        this.dispositivoId = value;
    }

    public getDispositivoId(): string {
        return this.dispositivoId;
    }

    // Método essencial para padronizar o retorno no Controller sem vazar atributos privados
    public obterDados(): Record<string, unknown> {
        return {
            id: this._id,
            dataDados: this.dataDados,
            dispositivoId: this.dispositivoId
        };
    }
}