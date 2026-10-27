import { coreModel } from "../core/coreModel.js";

// A solicitação vai para a API como foi gravada (status, decisão, timestamps), então o modelo guarda o documento inteiro.
export class accessRequestModel extends coreModel {
    private dados: Record<string, unknown>;

    constructor(dados: Record<string, unknown>) {
        super();
        this.dados = dados;
    }

    public getID(): string | undefined {
        return this.dados._id ? String(this.dados._id) : undefined;
    }

    public getEmail(): string {
        return String(this.dados.email ?? "");
    }

    public getNomeEmpresa(): string {
        return String(this.dados.nomeEmpresa ?? "");
    }

    public getNomeAdministrador(): string {
        return String(this.dados.nomeAdministrador ?? "");
    }

    public obterDados(): Record<string, unknown> {
        return { ...this.dados };
    }
}
