import { Forklift } from "../../schemas/forklift.js";
import "../../schemas/device.js";
import "../../schemas/operator.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";

const MINUTO_MS = 60_000;

// `filialId` (filtro da tela) só reduz o escopo: a interseção nunca amplia o que o chamador vê.
export async function listarMaquinas(escopo?: Escopo, filialId?: string) {
  const permitidas = filtroPorFilial(escopo).filialId.$in;
  const empilhadeiras: any[] = await Forklift.find({ filialId: { $in: filialId ? permitidas.filter((id) => id === filialId) : permitidas } })
    .sort({ identificacao: 1 })
    .populate("dispositivoConectadoId")
    .populate("operadorConectadoId")
    .lean();

  const agora = Date.now();

  return empilhadeiras.map((f) => {
    const dispositivo = f.dispositivoConectadoId;
    const operador = f.operadorConectadoId;
    const inicio = f.sessaoIniciadaEm ? new Date(f.sessaoIniciadaEm).getTime() : agora;

    return {
      id: String(f._id),
      identificacao: f.identificacao,
      nome: f.nome,
      setor: f.setor,
      filialId: String(f.filialId),
      dispositivoConectado: dispositivo
        ? { enderecoMac: dispositivo.enderecoMac, status: dispositivo.status }
        : { enderecoMac: "", status: "Offline" },
      ...(operador && { operadorConectado: { nome: operador.nome } }),
      tempoSessaoMinutos: Math.max(0, Math.floor((agora - inicio) / MINUTO_MS)),
    };
  });
}
