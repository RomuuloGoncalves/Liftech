import { RepositoryBase, type ModeloMongoose } from "../../core/coreRepository.js";
import { CategoryModel } from "../../models/categoryModel.js";

export class CategoryRepository extends RepositoryBase<CategoryModel> {
  constructor(bd: ModeloMongoose) {
    super(bd);
  }

  protected converterParaModelo(documento: Record<string, unknown>): CategoryModel {
    return new CategoryModel(
      documento.empresaId ? String(documento.empresaId) : undefined,
      String(documento.nome ?? ""),
      String(documento.cor ?? ""),
      (documento.statusVinculados as string[] | undefined) ?? [],
      (documento.chave as string | null | undefined) ?? null,
      documento._id
    );
  }
}
