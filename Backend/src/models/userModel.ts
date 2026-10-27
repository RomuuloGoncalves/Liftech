import { coreModel } from "../core/coreModel.js";

interface Acesso {
    telefone?: string;
    cargo?: string;
    empresaId?: string;
    escopo?: string;
    filiaisIds?: string[];
    // Credenciais e vínculos: lidos pelos services, nunca entram no obterDados.
    email?: string;
    usuario?: string;
    senhaHash?: string;
    operadorId?: string;
    acessoNegado?: boolean;
}

export class userModel extends coreModel {
    protected id: string | undefined;
    protected nome: string;
    protected role: string;
    protected telefone: string | undefined;
    protected cargo: string | undefined;
    protected empresaId: string | undefined;
    protected escopo: string | undefined;
    protected filiaisIds: string[];
    protected credenciais: Pick<Acesso, "email" | "usuario" | "senhaHash" | "operadorId" | "acessoNegado">;

    constructor(nome: string, role: string, id?: string, acesso: Acesso = {}) {
        super();
        this.id = id;
        this.nome = nome;
        this.role = role;
        this.telefone = acesso.telefone;
        this.cargo = acesso.cargo;
        this.empresaId = acesso.empresaId;
        this.escopo = acesso.escopo;
        this.filiaisIds = acesso.filiaisIds ?? [];
        this.credenciais = {
            email: acesso.email,
            usuario: acesso.usuario,
            senhaHash: acesso.senhaHash,
            operadorId: acesso.operadorId,
            acessoNegado: acesso.acessoNegado,
        };
    }

    obterDados(): Record<string, unknown> {
        return {
            ...(this.id ? { _id: this.id } : {}),
            nome: this.nome,
            role: this.role,
            ...(this.telefone !== undefined ? { telefone: this.telefone } : {}),
            ...(this.cargo !== undefined ? { cargo: this.cargo } : {}),
            empresaId: this.empresaId,
            escopo: this.escopo,
            filiaisIds: this.filiaisIds,
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

    public getTelefone(): string | undefined {
        return this.telefone;
    }

    public getCargo(): string | undefined {
        return this.cargo;
    }

    public getEmpresaId(): string | undefined {
        return this.empresaId;
    }

    public getEscopo(): string | undefined {
        return this.escopo;
    }

    public getFiliaisIds(): string[] {
        return this.filiaisIds;
    }

    public getEmail(): string | undefined {
        return this.credenciais.email;
    }

    public getUsuario(): string | undefined {
        return this.credenciais.usuario;
    }

    public getSenhaHash(): string | undefined {
        return this.credenciais.senhaHash;
    }

    public getOperadorId(): string | undefined {
        return this.credenciais.operadorId;
    }

    public getAcessoNegado(): boolean {
        return this.credenciais.acessoNegado === true;
    }
}
