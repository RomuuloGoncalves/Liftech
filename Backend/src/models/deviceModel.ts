export class deviceModel {
    private id?: string;
    private enderecoMac: string;
    private status: string;
    private empilhadeiraId?: string | null;
    // Documento como veio do banco (ids originais, nome): lido pelos services de máquina. Não entra no obterDados.
    private documento: Record<string, any>;

    constructor(id: string | undefined, enderecoMac: string, status: string, empilhadeiraId?: string | null, documento: Record<string, any> = {}) {
        this.documento = documento;
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

    public getIdOriginal(): unknown {
        return this.documento._id;
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