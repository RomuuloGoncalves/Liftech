import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { DeviceModel } from "../../models/deviceModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { DeviceRepository } from "./deviceRepository.js";

export class DeviceService extends ServiceBase<DeviceModel, DeviceRepository> {
  protected readonly nomeEntidade = "Dispositivo";

  constructor(repositorio: DeviceRepository) {
    super(repositorio);
  }

  async criarDispositivo(dados: Record<string, unknown>): Promise<DeviceModel> {
    const dispositivoExistente = await this.repositorio.obterPorMac(String(dados.enderecoMac));
    if (dispositivoExistente) {
      throw new ErroHttp(StatusCode.CONFLICT, "Já existe um dispositivo cadastrado com este Endereço MAC.");
    }

    const novoDispositivo = await this.repositorio.criarDados(dados);

    if (!novoDispositivo) {
      throw new Error("Falha ao criar o dispositivo no banco de dados.");
    }

    return novoDispositivo;
  }

  async associar(id: string, empilhadeiraId: string | null, filtro: Record<string, unknown> = {}): Promise<DeviceModel> {
    const dispositivo = await this.repositorio.associar(id, empilhadeiraId, filtro);
    if (!dispositivo) {
      throw new ErroHttp(StatusCode.NOT_FOUND, `${this.nomeEntidade} não encontrado(a).`);
    }
    return dispositivo;
  }
}
