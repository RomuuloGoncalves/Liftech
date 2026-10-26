import { telemetryModel } from "../../models/telemetryModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { TelemetryRepository } from "./telemetryRepository.js";

export class TelemetryService extends ServiceBase<telemetryModel, TelemetryRepository> {
  protected readonly nomeEntidade = "Telemetria";

  constructor(repositorio: TelemetryRepository) {
    super(repositorio);
  }

  async listarPorDispositivo(dispositivoId: string, dataInicial?: string, dataFinal?: string): Promise<telemetryModel[]> {
    return this.repositorio.obterPorDispositivo(dispositivoId, dataInicial, dataFinal);
  }
}