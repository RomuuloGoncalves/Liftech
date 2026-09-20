export class userModel {
    private nome: string;
    private role: string;

    constructor(nome: string, role: string) {
        this.nome = nome;
        this.role = role;
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

    protected setRole(value: string): number | void {
        if (!value) {
            return 0;
        }
        this.role = value;
    }

    protected getRole(): string {
        return this.role;
    }
}