export class deviceModel {
    private id?: string;
    private enderecoMac: string;
    private status: string;
    private empilhadeiraId?: string | null;

    constructor(id: string | undefined, enderecoMac: string, status: string, empilhadeiraId?: string | null) {
        this.id = id;
        this.enderecoMac = enderecoMac;
        this.status = status;
        this.empilhadeiraId = empilhadeiraId;
    }

    protected setEnderecoMac(value: string): number | void {
        if (!value) return 0;
        this.enderecoMac = value;
    }

    protected getEnderecoMac(): string {
        return this.enderecoMac;
    }

    protected setStatus(value: string): number | void {
        if (!value) return 0;
        this.status = value;
    }

    protected getStatus(): string {
        return this.status;
    }

    public obterDados() {
        return {
            id: this.id,
            enderecoMac: this.enderecoMac,
            status: this.status,
            empilhadeiraId: this.empilhadeiraId
        };
    }
}