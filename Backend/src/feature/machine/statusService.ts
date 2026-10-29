import { Forklift } from "../../schemas/forklift.js";
import { Incident } from "../../schemas/incident.js";
import { Category } from "../../schemas/category.js";
import { Branch } from "../../schemas/branch.js";
import { incidentModel } from "../../models/incidentModel.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { IncidentRepository } from "../incident/incidentRepository.js";
import { CategoryRepository } from "../category/categoryRepository.js";
import { BranchRepository } from "../branch/branchRepository.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";

const STATUS = ["disponivel", "em_uso", "manutencao", "alerta", "offline"] as const;
export type Status = (typeof STATUS)[number];

export const ehStatus = (valor: unknown): valor is Status => STATUS.includes(valor as Status);

const LIMITE_PADRAO = 5;

const empilhadeiras = new ForkliftRepository(Forklift);
const incidentes = new IncidentRepository(Incident);
const categorias = new CategoryRepository(Category);
const filiais = new BranchRepository(Branch);

// Força mínima de impacto que vira alerta; ajustável no .env porque o sensor precisa de calibração em campo.
export function limiteImpacto(): number {
  const bruto = process.env.LIMITE_IMPACTO?.trim();
  const valor = Number(bruto);
  return bruto && Number.isFinite(valor) ? valor : LIMITE_PADRAO;
}

// Categoria da empresa da filial ligada ao status, ou null.
export async function categoriaDoStatus(filialId: unknown, status: Status) {
  const filial = await filiais.buscarPorId(filialId);
  const categoria = filial && (await categorias.obterUm({ empresaId: filial.getEmpresaId(), statusVinculados: status }));
  return categoria?.getIdOriginal() ?? null;
}

// Único caminho de mudança de status (manual ou leitura do dispositivo).
// ponytail: grava o status e depois resolve os incidentes, sem transação; uma falha no meio deixa incidentes pendentes.
export async function aplicarStatus(forkliftId: string, novo: Status): Promise<void> {
  const empilhadeira = (await empilhadeiras.buscarPorId(forkliftId))?.getDocumento();
  if (!empilhadeira) throw new ErroHttp(StatusCode.NOT_FOUND, "Empilhadeira não encontrada.");

  const atual: Status = empilhadeira.status ?? "disponivel";
  // Status repetido não mexe em nada: uma leitura repetida não desfaz um ajuste manual.
  if (atual === novo) return;

  const alteracoes: Record<string, unknown> = { status: novo, statusAlteradoEm: new Date() };
  if (!empilhadeira.categoriaTravada) {
    const destino = await categoriaDoStatus(empilhadeira.filialId, novo);
    if (destino) alteracoes.categoriaId = destino;
  }

  await empilhadeiras.atualizarUm({ _id: forkliftId }, { $set: alteracoes });

  if (atual === "alerta") {
    await incidentes.atualizarVarios({ empilhadeiraId: forkliftId, status: "pendente" }, { $set: { status: "resolvido" } });
  }
}

// Leitura de impacto acima do limite: registra o incidente e põe a máquina em alerta.
// Um segundo impacto só cria outro incidente, porque `alerta` → `alerta` não muda nada.
export async function registrarImpacto(dispositivoId: string, forcaImpacto: number, data: Date): Promise<void> {
  const empilhadeira = (await empilhadeiras.obterUm({ dispositivoConectadoId: dispositivoId }))?.getDocumento();
  if (!empilhadeira) return;

  await incidentes.criar(new incidentModel({
    empilhadeiraId: empilhadeira._id,
    operadorId: empilhadeira.operadorConectadoId,
    filialId: empilhadeira.filialId,
    forcaImpacto,
    dataIncidente: data,
    status: "pendente",
    origem: "sensor",
  }));
  await aplicarStatus(String(empilhadeira._id), "alerta");
}
