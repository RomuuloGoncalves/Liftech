import { coreModel } from "../core/coreModel.js";

export const STATUS_VALIDOS = ["aberto", "em_analise", "resolvido"] as const;
export type StatusIncidente = (typeof STATUS_VALIDOS)[number];

export class incidentModel extends coreModel {
    protected id: string | undefined;
    protected dataIncidente: Date;
    protected forcaImpacto: number;
    protected status: StatusIncidente;
    protected empilhadeiraId: string | undefined;
    protected operadorId: string | undefined;

    constructor(
        dataIncidente: Date,
        forcaImpacto: number,
        status: StatusIncidente,
        empilhadeiraId?: string,
        operadorId?: string,
        id?: string
    ) {
        super();
        this.id = id;
        this.dataIncidente = dataIncidente;
        this.forcaImpacto = forcaImpacto;
        this.status = status;
        this.empilhadeiraId = empilhadeiraId;
        this.operadorId = operadorId;
    }

    obterDados(): Record<string, unknown> {
        return {
            ...(this.id ? { _id: this.id } : {}),
            dataIncidente: this.dataIncidente,
            forcaImpacto: this.forcaImpacto,
            status: this.status,
            empilhadeiraId: this.empilhadeiraId,
            operadorId: this.operadorId
        };
    }

    public getID(): string | undefined {
        return this.id;
    }

    public getDataIncidente(): Date {
        return this.dataIncidente;
    }

    public getForcaImpacto(): number {
        return this.forcaImpacto;
    }

    public getStatus(): StatusIncidente {
        return this.status;
    }

    public getEmpilhadeiraId(): string | undefined {
        return this.empilhadeiraId;
    }

    public getOperadorId(): string | undefined {
        return this.operadorId;
    }

    public setDataIncidente(value: Date): void {
        this.dataIncidente = value;
    }

    public setForcaImpacto(value: number): void {
        this.forcaImpacto = value;
    }

    public setStatus(value: StatusIncidente): void {
        this.status = value;
    }

    public setEmpilhadeiraId(value: string): void {
        this.empilhadeiraId = value;
    }

    public setOperadorId(value: string): void {
        this.operadorId = value;
    }
}