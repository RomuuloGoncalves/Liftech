import { coreModel } from "../core/coreModel.js";

export class userModel extends coreModel {
    protected id: string | undefined;
    protected nome: string;
    protected role: string;
    protected telefone: string | undefined;
    protected cargo: string | undefined;

    constructor(nome: string, role: string, id?: string, telefone?: string, cargo?: string) {
        super();
        this.id = id;
        this.nome = nome;
        this.role = role;
        this.telefone = telefone;
        this.cargo = cargo;
    }

    obterDados(): Record<string, unknown> {
        return {
            ...(this.id ? { _id: this.id } : {}),
            nome: this.nome,
            role: this.role,
            ...(this.telefone !== undefined ? { telefone: this.telefone } : {}),
            ...(this.cargo !== undefined ? { cargo: this.cargo } : {}),
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
