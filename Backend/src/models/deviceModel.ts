import { CoreModel } from "../core/coreModel.js";

export class DeviceModel extends CoreModel {
  private id?: string;
  private enderecoMac: string;
  private status: string;
  private empilhadeiraId?: string | null;
  // Documento como veio do banco (ids originais, nome): lido pelos services de máquina. Não entra no obterDados.
  private documento: Record<string, unknown>;

  constructor(
    id: string | undefined,
    enderecoMac: string,
    status: string,
    empilhadeiraId?: string | null,
    documento: Record<string, unknown> = {}
  ) {
    super();
    this.documento = documento;
    this.id = id;
    this.enderecoMac = enderecoMac;
    this.status = status;
    this.empilhadeiraId = empilhadeiraId;
  }

  public getIdOriginal(): unknown {
    return this.documento._id;
  }

  public obterDados(): Record<string, unknown> {
    return {
      id: this.id,
      enderecoMac: this.enderecoMac,
      status: this.status,
      empilhadeiraId: this.empilhadeiraId,
    };
  }
}
