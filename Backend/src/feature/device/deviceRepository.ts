import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { DeviceModel } from "../../models/deviceModel.js";

export class DeviceRepository extends RepositoryBase<DeviceModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): DeviceModel {
    return new DeviceModel(
      String(documento._id ?? ""),
      String(documento.enderecoMac ?? ""),
      String(documento.status ?? ""),
      documento.empilhadeiraId ? String(documento.empilhadeiraId) : null,
      documento
    );
  }

  async obterPorMac(enderecoMac: string): Promise<DeviceModel | null> {
    const documento = await this.bd.findOne({ enderecoMac }).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, unknown>);
  }

  async associar(id: string, empilhadeiraId: string | null, filtro: Record<string, unknown> = {}): Promise<DeviceModel | null> {
    const documento = await this.bd.findOneAndUpdate({ ...filtro, _id: id }, { empilhadeiraId }, { new: true }).lean();

    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, unknown>);
  }
}
