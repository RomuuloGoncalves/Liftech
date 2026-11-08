import { CoreModel } from "../core/coreModel.js";

// Campos do documento da empilhadeira que os services de máquina leem; as referências vêm como ObjectId ou, quando populadas, como o documento.
export interface DocumentoEmpilhadeira {
  _id: unknown;
  identificacao: string;
  nome?: string;
  setorId?: unknown;
  status?: string;
  statusAlteradoEm?: Date;
  categoriaId?: unknown;
  categoriaTravada?: boolean;
  filialId?: unknown;
  dispositivoConectadoId?: any;
  operadorConectadoId?: any;
  sessaoIniciadaEm?: Date | null;
  ultimaLeituraEm?: Date;
  offlineDesde?: Date | null;
  manutencaoPorOffline?: boolean;
}

export class ForkliftModel extends CoreModel {
  protected id: string | undefined;
  protected identificacao: string;
  protected dispositivoConectadoId: string | undefined;
  protected operadorConectadoId: string | undefined;
  protected filialId: string | undefined;
  // Documento como veio do banco (status, setor, categoria, sessão, ids originais): lido pelos services de máquina.
  // Não entra no obterDados, que é o formato de /api/forklifts.
  protected documento: DocumentoEmpilhadeira;

  constructor(
    identificacao: string,
    dispositivoConectadoId?: string,
    operadorConectadoId?: string,
    id?: string,
    filialId?: string,
    documento = {} as DocumentoEmpilhadeira
  ) {
    super();
    this.documento = documento;
    this.id = id;
    this.identificacao = identificacao;
    this.dispositivoConectadoId = dispositivoConectadoId;
    this.operadorConectadoId = operadorConectadoId;
    this.filialId = filialId;
  }

  obterDados(): Record<string, unknown> {
    return {
      ...(this.id ? { _id: this.id } : {}),
      id: this.identificacao,
      dispositivoConectadoId: this.dispositivoConectadoId,
      operadorConectadoId: this.operadorConectadoId,
      filialId: this.filialId,
    };
  }

  public getID(): string | undefined {
    return this.id;
  }

  public getIdOriginal(): unknown {
    return this.documento._id;
  }

  public getDocumento(): DocumentoEmpilhadeira {
    return this.documento;
  }

  public getIdentificacao(): string {
    return this.identificacao;
  }

  public getDispositivoConectadoId(): string | undefined {
    return this.dispositivoConectadoId;
  }

  public getOperadorConectadoId(): string | undefined {
    return this.operadorConectadoId;
  }

  public setIdentificacao(value: string): void {
    this.identificacao = value;
  }

  public setDispositivoConectadoId(value: string): void {
    this.dispositivoConectadoId = value;
  }

  public setOperadorConectadoId(value: string): void {
    this.operadorConectadoId = value;
  }
}
