import { Branch } from "../schemas/branch.js";

export interface FilialEscopo {
  _id: string;
  nome: string;
  matriz: boolean;
}

// Onde o usuário atua: `filiais` são as filiais que ele enxerga (todas as da empresa quando `tipo` é 'empresa').
export interface Escopo {
  empresaId?: string;
  tipo: "empresa" | "filiais";
  filiais: FilialEscopo[];
}

declare global {
  namespace Express {
    interface Request {
      escopo: Escopo;
    }
  }
}

interface UsuarioComEscopo {
  empresaId?: unknown;
  escopo?: string;
  filiaisIds?: unknown[];
}

export async function carregarEscopo(usuario: UsuarioComEscopo): Promise<Escopo> {
  // Sem empresa (dado antigo, antes da migração): não vê nada.
  if (!usuario.empresaId) return { tipo: "filiais", filiais: [] };

  const tipo = usuario.escopo === "empresa" ? "empresa" : "filiais";
  const doUsuario = tipo === "empresa" ? {} : { _id: { $in: usuario.filiaisIds ?? [] } };
  // O filtro por empresaId descarta filial apagada ou de outra empresa.
  const filiais = await Branch.find({ empresaId: usuario.empresaId, ...doUsuario }).sort({ matriz: -1, nome: 1 }).lean();

  return {
    empresaId: String(usuario.empresaId),
    tipo,
    filiais: filiais.map((f) => ({ _id: String(f._id), nome: f.nome, matriz: f.matriz })),
  };
}

// Filtros de escopo para o RepositoryBase. Sem escopo ou sem filiais o `$in` fica vazio e nada casa (falha fechada).
export const filtroPorFilial = (escopo?: Escopo) => ({
  filialId: { $in: escopo?.filiais.map((f) => f._id) ?? [] },
});

export const filtroPorEmpresa = (escopo?: Escopo) => ({
  empresaId: { $in: escopo?.empresaId ? [escopo.empresaId] : [] },
});
