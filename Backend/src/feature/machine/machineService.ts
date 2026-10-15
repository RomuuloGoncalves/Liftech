import { Forklift } from "../../schemas/forklift.js";
import { Incident } from "../../schemas/incident.js";
import "../../schemas/device.js";
import "../../schemas/operator.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";

const MINUTO_MS = 60_000;

// Monta as máquinas no formato do front. `alertaEm` vem do incidente pendente mais recente, numa consulta só.
async function consultar(filtro: Record<string, unknown>) {
  const empilhadeiras: any[] = await Forklift.find(filtro)
    .sort({ identificacao: 1 })
    .populate("dispositivoConectadoId")
    .populate("operadorConectadoId")
    .lean();

  const emAlerta = empilhadeiras.filter((f) => f.status === "alerta").map((f) => f._id);
  const alertaEm = new Map<string, string>();
  if (emAlerta.length > 0) {
    const pendentes: any[] = await Incident.find({ empilhadeiraId: { $in: emAlerta }, status: "pendente" })
      .sort({ dataIncidente: -1 })
      .lean();
    for (const incidente of pendentes) {
      const chave = String(incidente.empilhadeiraId);
      if (!alertaEm.has(chave)) alertaEm.set(chave, new Date(incidente.dataIncidente).toISOString());
    }
  }

  const agora = Date.now();

  return empilhadeiras.map((f) => {
    const dispositivo = f.dispositivoConectadoId;
    const operador = f.operadorConectadoId;
    const inicio = f.sessaoIniciadaEm ? new Date(f.sessaoIniciadaEm).getTime() : agora;
    const status = f.status ?? "disponivel";

    return {
      id: String(f._id),
      identificacao: f.identificacao,
      nome: f.nome,
      setor: f.setor,
      filialId: String(f.filialId),
      status,
      categoriaId: f.categoriaId ? String(f.categoriaId) : null,
      categoriaTravada: f.categoriaTravada === true,
      alertaEm: status === "alerta" ? alertaEm.get(String(f._id)) ?? null : null,
      dispositivoConectado: { enderecoMac: dispositivo?.enderecoMac ?? "" },
      ...(operador && { operadorConectado: { nome: operador.nome } }),
      tempoSessaoMinutos: Math.max(0, Math.floor((agora - inicio) / MINUTO_MS)),
    };
  });
}

// `filialId` (filtro da tela) só reduz o escopo: a interseção nunca amplia o que o chamador vê.
export async function listarMaquinas(escopo?: Escopo, filialId?: string) {
  const permitidas = filtroPorFilial(escopo).filialId.$in;
  return consultar({ filialId: { $in: filialId ? permitidas.filter((id) => id === filialId) : permitidas } });
}

export async function obterMaquina(escopo: Escopo, id: string) {
  const [maquina] = await consultar({ _id: id, ...filtroPorFilial(escopo) });
  if (!maquina) throw new ErroHttp(StatusCode.NOT_FOUND, "Máquina não encontrada.");
  return maquina;
}

// Trava só muda a trava: a máquina fica na categoria atual até a próxima mudança de status.
export async function definirTrava(escopo: Escopo, id: string, categoriaTravada: boolean) {
  await obterMaquina(escopo, id);
  await Forklift.updateOne({ _id: id }, { $set: { categoriaTravada } });
  return obterMaquina(escopo, id);
}
