export class deviceModel {
    private enderecoMac: string;
    private status: string;

    constructor(enderecoMac: string, status: string) {
        this.enderecoMac = enderecoMac;
        this.status = status;
    }

    protected setEnderecoMac(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.enderecoMac = value;
    }

    protected getEnderecoMac(): string {
        return this.enderecoMac;
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
}