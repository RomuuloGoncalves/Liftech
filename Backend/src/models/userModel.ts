import { coreModel } from "../core/coreModel.js";

export class userModel extends coreModel {
    protected id: string | undefined;
    protected nome: string;
    protected role: string;

    constructor(nome: string, role: string, id?: string) {
        super();
        this.id = id;
        this.nome = nome;
        this.role = role;
    }

    obterDados(): Record<string, unknown> {
        return {
            ...(this.id ? { _id: this.id } : {}),
            nome: this.nome,
            role: this.role,
        };
    }

    public getID(): string | undefined {
        return this.id;
    }

    public getNome(): string {
        return this.nome;
    }

    public setNome(value: string): void {
        this.nome = value;
    }

    public getRole(): string {
        return this.role;
    }

    public setRole(value: string): void {
        this.role = value;
    }
}
