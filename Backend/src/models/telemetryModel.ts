import { CoreModel } from "../core/coreModel.js";

export class TelemetryModel extends CoreModel {
  private dataDados: Date;
  private dispositivoId: string;
  private _id?: string;
  private forcaImpacto?: number;

  constructor(dataDados: Date, dispositivoId: string, id?: string, forcaImpacto?: number) {
    super();
    this.dataDados = dataDados;
    this.dispositivoId = dispositivoId;
    if (id) {
      this._id = id;
    }
    if (forcaImpacto !== undefined) {
      this.forcaImpacto = forcaImpacto;
    }
  }

  public getID(): string | undefined {
    return this._id;
  }

  // Padroniza o retorno no Controller sem vazar atributos privados.
  public obterDados(): Record<string, unknown> {
    return {
      id: this._id,
      dataDados: this.dataDados,
      dispositivoId: this.dispositivoId,
      ...(this.forcaImpacto !== undefined && { forcaImpacto: this.forcaImpacto }),
    };
  }
}
