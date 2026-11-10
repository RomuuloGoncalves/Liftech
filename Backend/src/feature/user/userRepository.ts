import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { UserModel } from "../../models/userModel.js";

export class UserRepository extends RepositoryBase<UserModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): UserModel {
    return new UserModel(String(documento.nome ?? ""), String(documento.role ?? ""), documento._id ? String(documento._id) : undefined, {
      telefone: documento.telefone as string | undefined,
      cargo: documento.cargo as string | undefined,
      empresaId: documento.empresaId ? String(documento.empresaId) : undefined,
      escopo: documento.escopo ? String(documento.escopo) : undefined,
      filiaisIds: ((documento.filiaisIds as unknown[] | undefined) ?? []).map(String),
      email: documento.email as string | undefined,
      usuario: documento.usuario as string | undefined,
      senhaHash: documento.senhaHash as string | undefined,
      operadorId: documento.operadorId ? String(documento.operadorId) : undefined,
      acessoNegado: documento.acessoNegado as boolean | undefined,
    });
  }

  async obterPorNome(nome: string): Promise<UserModel | null> {
    const documento = await this.bd.findOne({ nome }).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, unknown>);
  }
}
