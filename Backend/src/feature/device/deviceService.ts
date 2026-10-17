import { deviceModel } from "../../models/deviceModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { DeviceRepository } from "./deviceRepository.js";

export class DeviceService extends ServiceBase<deviceModel, DeviceRepository> {
  protected readonly nomeEntidade = "Dispositivo";

  constructor(repositorio: DeviceRepository) {
    super(repositorio);
  }

  async criar(dados: any): Promise<deviceModel> {
    const dispositivoExistente = await this.repositorio.obterPorMac(dados.enderecoMac);
    if (dispositivoExistente) {
      throw new Error("Já existe um dispositivo cadastrado com este Endereço MAC.");
    }

    const novoDispositivo = await this.repositorio.criar(dados);

    if (!novoDispositivo) {
        throw new Error("Falha ao criar o dispositivo no banco de dados.");
    }

    return novoDispositivo;
  }

  async associar(id: string, empilhadeiraId: string | null, filtro: Record<string, unknown> = {}): Promise<deviceModel> {
    const dispositivo = await this.repositorio.associar(id, empilhadeiraId, filtro);
    if (!dispositivo) {
      throw new Error(`${this.nomeEntidade} não encontrado(a).`);
    }
    return dispositivo;
  }
}
