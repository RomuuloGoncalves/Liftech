import { coreModel } from "../core/coreModel.js";

export class feedbackModel extends coreModel {
    private _id?: string;
    private mensagem: string;
    private usuarioId: string;
    private empresaId: string | null;
    private role: string;
    private criadoEm?: Date;

    constructor(mensagem: string, usuarioId: string, empresaId: string | null, role: string, id?: string, criadoEm?: Date) {
        super();
        this.mensagem = mensagem;
        this.usuarioId = usuarioId;
        this.empresaId = empresaId;
        this.role = role;
        if (id) {
            this._id = id;
        }
        if (criadoEm) {
            this.criadoEm = criadoEm;
        }
    }

    public getID(): string | undefined {
        return this._id;
    }

    public getCriadoEm(): Date | undefined {
        return this.criadoEm;
    }

    // Campos gravados; `criadoEm` fica com o default do schema na criação.
    public obterDados(): Record<string, unknown> {
        return {
            ...(this._id && { _id: this._id }),
            mensagem: this.mensagem,
            usuarioId: this.usuarioId,
            empresaId: this.empresaId,
            role: this.role,
            ...(this.criadoEm && { criadoEm: this.criadoEm })
        };
    }
}
