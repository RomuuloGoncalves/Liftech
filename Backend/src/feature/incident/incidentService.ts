import { incidentModel, STATUS_VALIDOS } from "../../models/incidentModel.js";
import { ServiceBase } from "../../core/coreService.js";
import { IncidentRepository } from "./incidentRepository.js";

export class IncidentService extends ServiceBase<incidentModel, IncidentRepository> {
  protected readonly nomeEntidade = "Incidente";

  constructor(repositorio: IncidentRepository) {
    super(repositorio);
  }

  async listarPorStatus(status: string): Promise<incidentModel[]> {
    if (!(STATUS_VALIDOS as readonly string[]).includes(status)) {
      throw new Error(`Status inválido: "${status}".`);
    }
    return this.repositorio.obterPorStatus(status);
  }

  async listarPorEmpilhadeira(empilhadeiraId: string): Promise<incidentModel[]> {
    return this.repositorio.obterPorEmpilhadeira(empilhadeiraId);
  }
}