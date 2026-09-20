export class operatorModel {
    private nome: string;

    constructor(nome: string) {
        this.nome = nome;
    }

    protected setNome(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.nome = value;
    }

    protected getNome(): string {
        return this.nome;
    }
}
