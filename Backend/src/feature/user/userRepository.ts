import mongoose from "mongoose";
import { RepositoryBase } from "../../core/coreRepository.js";
import { userModel } from "../../models/userModel.js";

export class UserRepository extends RepositoryBase<userModel> {
 constructor(mongoDB: mongoose.Model<any>) {
    super(mongoDB);
 }

 protected converterParaModelo(documento: Record<string, unknown>): userModel {
     return new userModel(
        String(documento.nome ?? ""),
        String(documento.role ?? ""),
        documento._id ? String(documento._id) : undefined,
        {
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
        },
     );
 }

 // Conta com login: as credenciais (email/usuario e senhaHash) não passam pelo obterDados do modelo, que vai para a API.
 async criarComCredenciais(dados: Record<string, unknown>): Promise<userModel> {
    return this.criarDados(dados);
 }

 async obterPorNome(nome: string): Promise<userModel | null> {
    const documento = await this.bd.findOne({nome}).lean();
    if (!documento) return null;
    return this.converterParaModelo(documento as Record<string, unknown>);
 }
}