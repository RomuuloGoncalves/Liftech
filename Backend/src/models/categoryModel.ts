import { coreModel } from "../core/coreModel.js";

export class categoryModel extends coreModel {
    // _id como veio do banco (ObjectId): a máquina grava esse mesmo valor em categoriaId.
    private _id?: unknown;
    private empresaId?: unknown;
    private nome: string;
    private cor: string;
    // Só as categorias do quadro inicial têm chave; renomear zera para null.
    private chave?: string | null;
    private statusVinculados: string[];

    constructor(empresaId: unknown, nome: string, cor: string, statusVinculados: string[] = [], chave?: string | null, id?: unknown) {
        super();
        this.empresaId = empresaId;
        this.nome = nome;
        this.cor = cor;
        this.statusVinculados = statusVinculados;
        if (chave !== undefined) {
            this.chave = chave;
        }
        if (id !== undefined && id !== null) {
            this._id = id;
        }
    }

    public getID(): string | undefined {
        return this._id === undefined ? undefined : String(this._id);
    }

    public getIdOriginal(): unknown {
        return this._id;
    }

    public getNome(): string {
        return this.nome;
    }

    public getCor(): string {
        return this.cor;
    }

    public getChave(): string | null {
        return this.chave ?? null;
    }

    public getStatusVinculados(): string[] {
        return this.statusVinculados;
    }

    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id !== undefined && { _id: this._id }),
            empresaId: this.empresaId,
            ...(this.chave !== undefined && { chave: this.chave }),
            nome: this.nome,
            cor: this.cor,
            statusVinculados: this.statusVinculados
        };
    }
}
