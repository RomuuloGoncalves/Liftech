export class incidentModel {
    private dataIncidente: Date;
    private forcaImpacto: number;
    private status: string;
    private empilhadeiraId: string;
    private operadorId: string;

    constructor(dataIncidente: Date, forcaImpacto: number, status: string, empilhadeiraId: string, operadorId: string) {
        this.dataIncidente = dataIncidente;
        this.forcaImpacto = forcaImpacto;
        this.status = status;
        this.empilhadeiraId = empilhadeiraId;
        this.operadorId = operadorId;
    }

    protected setDataIncidente(value: Date): number | void {
        if (!value) {
            return 0;
        }
        this.dataIncidente = value;
    }

    protected getDataIncidente(): Date {
        return this.dataIncidente;
    }

    protected setForcaImpacto(value: number): number | void {
        if (value === undefined || value === null) {
            return 0;
        }
        this.forcaImpacto = value;
    }

    protected getForcaImpacto(): number {
        return this.forcaImpacto;
    }

    protected setStatus(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.status = value;
    }

    protected getStatus(): string {
        return this.status;
    }

    protected setEmpilhadeiraId(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.empilhadeiraId = value;
    }

    protected getEmpilhadeiraId(): string {
        return this.empilhadeiraId;
    }

    protected setOperadorId(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.operadorId = value;
    }

    protected getOperadorId(): string {
        return this.operadorId;
    }
}
