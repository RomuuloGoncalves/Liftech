import { Forklift } from "../../schemas/forklift.js";
import "../../schemas/device.js";
import "../../schemas/operator.js";

const MINUTO_MS = 60_000;

export async function listarMaquinas() {
  const empilhadeiras: any[] = await Forklift.find()
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
      dispositivoConectado: dispositivo
        ? { enderecoMac: dispositivo.enderecoMac, status: dispositivo.status }
        : { enderecoMac: "", status: "Offline" },
      ...(operador && { operadorConectado: { nome: operador.nome } }),
      tempoSessaoMinutos: Math.max(0, Math.floor((agora - inicio) / MINUTO_MS)),
    };
  });
}
