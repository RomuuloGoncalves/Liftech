import { Forklift } from "../../schemas/forklift.js";
import { Incident } from "../../schemas/incident.js";
import { Category } from "../../schemas/category.js";
import { Branch } from "../../schemas/branch.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";

export const STATUS = ["disponivel", "em_uso", "manutencao", "alerta", "offline"] as const;
export type Status = (typeof STATUS)[number];

export const ehStatus = (valor: unknown): valor is Status => STATUS.includes(valor as Status);

const LIMITE_PADRAO = 5;

// Força mínima de impacto que vira alerta; ajustável no .env porque o sensor precisa de calibração em campo.
export function limiteImpacto(): number {
  const bruto = process.env.LIMITE_IMPACTO?.trim();
  const valor = Number(bruto);
  return bruto && Number.isFinite(valor) ? valor : LIMITE_PADRAO;
}

// Único caminho de mudança de status (manual ou leitura do dispositivo).
// ponytail: grava o status e depois resolve os incidentes, sem transação; uma falha no meio deixa incidentes pendentes.
export async function aplicarStatus(forkliftId: string, novo: Status): Promise<void> {
  const empilhadeira: any = await Forklift.findById(forkliftId).lean();
  if (!empilhadeira) throw new ErroHttp(StatusCode.NOT_FOUND, "Empilhadeira não encontrada.");

  const atual: Status = empilhadeira.status ?? "disponivel";
  // Status repetido não mexe em nada: uma leitura repetida não desfaz um ajuste manual.
  if (atual === novo) return;

  const alteracoes: Record<string, unknown> = { status: novo, statusAlteradoEm: new Date() };
  if (!empilhadeira.categoriaTravada) {
    const filial: any = await Branch.findById(empilhadeira.filialId).lean();
    const destino: any = filial && (await Category.findOne({ empresaId: filial.empresaId, statusVinculados: novo }).lean());
    if (destino) alteracoes.categoriaId = destino._id;
  }

  await Forklift.updateOne({ _id: forkliftId }, { $set: alteracoes });

  if (atual === "alerta") {
    await Incident.updateMany({ empilhadeiraId: forkliftId, status: "pendente" }, { $set: { status: "resolvido" } });
  }
}

// Leitura de impacto acima do limite: registra o incidente e põe a máquina em alerta.
// Um segundo impacto só cria outro incidente, porque `alerta` → `alerta` não muda nada.
export async function registrarImpacto(dispositivoId: string, forcaImpacto: number, data: Date): Promise<void> {
  const empilhadeira: any = await Forklift.findOne({ dispositivoConectadoId: dispositivoId }).lean();
  if (!empilhadeira) return;

  await Incident.create({
    empilhadeiraId: empilhadeira._id,
    operadorId: empilhadeira.operadorConectadoId,
    filialId: empilhadeira.filialId,
    forcaImpacto,
    dataIncidente: data,
    status: "pendente",
  });
  await aplicarStatus(String(empilhadeira._id), "alerta");
}
