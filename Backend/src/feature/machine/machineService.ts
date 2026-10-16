import { Forklift } from "../../schemas/forklift.js";
import { Incident } from "../../schemas/incident.js";
import { Category } from "../../schemas/category.js";
import { WorkSession } from "../../schemas/workSession.js";
import { Device } from "../../schemas/device.js";
import "../../schemas/operator.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { categoriaDoStatus } from "./statusService.js";
import { exigirSetorDaFilial, nomesDosSetores } from "../sector/sectorService.js";

const MINUTO_MS = 60_000;
const MAC_REPETIDO = "Já existe um dispositivo com este endereço MAC.";

export interface DadosMaquina {
  nome?: string;
  identificacao?: string;
  setorId?: string | null;
  nomeDispositivo?: string;
  enderecoMac?: string;
}

const normalizarMac = (mac: string) => mac.trim().toUpperCase();

// O índice único em device.enderecoMac recusa o MAC repetido numa corrida (11000).
function traduzirErro(error: any): never {
  throw error.code === 11000 ? new ErroHttp(StatusCode.CONFLICT, MAC_REPETIDO) : error;
}

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

  const setores = await nomesDosSetores(empilhadeiras.map((f) => f.setorId));
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
      setor: setores.get(String(f.setorId)) ?? "",
      setorId: f.setorId ? String(f.setorId) : null,
      filialId: String(f.filialId),
      status,
      categoriaId: f.categoriaId ? String(f.categoriaId) : null,
      categoriaTravada: f.categoriaTravada === true,
      alertaEm: status === "alerta" ? alertaEm.get(String(f._id)) ?? null : null,
      dispositivoConectado: { enderecoMac: dispositivo?.enderecoMac ?? "", nomeDispositivo: dispositivo?.nome },
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

// Mover à mão só muda a categoria; status e trava ficam como estão. Confere tudo antes de gravar qualquer uma.
export async function moverParaCategoria(escopo: Escopo, machineIds: string[], categoriaId: string | null) {
  const ids = [...new Set(machineIds)];
  const doEscopo = { _id: { $in: ids }, ...filtroPorFilial(escopo) };
  if ((await Forklift.countDocuments(doEscopo)) !== ids.length) {
    throw new ErroHttp(StatusCode.NOT_FOUND, "Máquina não encontrada.");
  }
  if (categoriaId !== null && !(await Category.exists({ _id: categoriaId, empresaId: escopo.empresaId }))) {
    throw new ErroHttp(StatusCode.NOT_FOUND, "Categoria não encontrada.");
  }
  await Forklift.updateMany({ _id: { $in: ids } }, { $set: { categoriaId } });
  return consultar(doEscopo);
}

// ponytail: device e forklift sem transação; se o forklift falhar, apaga o device (compensação). Transação quando houver replica set.
export async function criarMaquina(escopo: Escopo, dados: DadosMaquina & { filialId: string }) {
  const enderecoMac = normalizarMac(dados.enderecoMac ?? "");
  if (await Forklift.exists({ identificacao: dados.identificacao })) {
    throw new ErroHttp(StatusCode.CONFLICT, `Já existe uma empilhadeira com a identificação "${dados.identificacao}".`);
  }
  if (await Device.exists({ enderecoMac })) throw new ErroHttp(StatusCode.CONFLICT, MAC_REPETIDO);
  if (dados.setorId) await exigirSetorDaFilial(dados.setorId, dados.filialId);

  const dispositivo = await Device.create({ enderecoMac, nome: dados.nomeDispositivo, filialId: dados.filialId }).catch(traduzirErro);
  let empilhadeira;
  try {
    empilhadeira = await Forklift.create({
      identificacao: dados.identificacao,
      nome: dados.nome,
      setorId: dados.setorId ?? null,
      status: "disponivel",
      statusAlteradoEm: new Date(),
      categoriaId: await categoriaDoStatus(dados.filialId, "disponivel"),
      filialId: dados.filialId,
      dispositivoConectadoId: dispositivo._id,
    });
  } catch (error) {
    await Device.deleteOne({ _id: dispositivo._id });
    return traduzirErro(error);
  }
  return obterMaquina(escopo, String(empilhadeira._id));
}

export async function atualizarMaquina(escopo: Escopo, id: string, dados: DadosMaquina) {
  await obterMaquina(escopo, id);
  const empilhadeira: any = await Forklift.findById(id).lean();
  const dispositivoId = empilhadeira?.dispositivoConectadoId;

  const doForklift: Record<string, unknown> = {};
  for (const campo of ["nome", "identificacao", "setorId"] as const) {
    if (dados[campo] !== undefined) doForklift[campo] = dados[campo];
  }
  const doDevice: Record<string, unknown> = {};
  if (dados.nomeDispositivo !== undefined) doDevice.nome = dados.nomeDispositivo;
  if (dados.enderecoMac !== undefined) doDevice.enderecoMac = normalizarMac(dados.enderecoMac);

  if (doForklift.identificacao !== undefined && (await Forklift.exists({ identificacao: doForklift.identificacao, _id: { $ne: id } }))) {
    throw new ErroHttp(StatusCode.CONFLICT, `Já existe uma empilhadeira com a identificação "${doForklift.identificacao}".`);
  }
  if (doDevice.enderecoMac !== undefined && (await Device.exists({ enderecoMac: doDevice.enderecoMac, _id: { $ne: dispositivoId } }))) {
    throw new ErroHttp(StatusCode.CONFLICT, MAC_REPETIDO);
  }
  if (dados.setorId) await exigirSetorDaFilial(dados.setorId, empilhadeira?.filialId);

  if (Object.keys(doForklift).length > 0) await Forklift.updateOne({ _id: id }, { $set: doForklift });
  // ponytail: máquina sem device ligado (dado antigo) ignora os campos do device; criar o device aqui se aparecer o caso.
  if (Object.keys(doDevice).length > 0 && dispositivoId) await Device.updateOne({ _id: dispositivoId }, { $set: doDevice }).catch(traduzirErro);
  return obterMaquina(escopo, id);
}

// Sessões e incidentes antigos ficam: o histórico mostra a máquina apagada como null.
// ponytail: forklift e device apagados sem transação; uma falha no meio deixa o device órfão.
export async function excluirMaquina(escopo: Escopo, id: string) {
  await obterMaquina(escopo, id);
  if (await WorkSession.exists({ empilhadeiraId: id, fim: null })) {
    throw new ErroHttp(StatusCode.CONFLICT, "Máquina com sessão aberta.");
  }
  const empilhadeira: any = await Forklift.findById(id).lean();
  await Forklift.deleteOne({ _id: id });
  if (empilhadeira?.dispositivoConectadoId) await Device.deleteOne({ _id: empilhadeira.dispositivoConectadoId });
  return { _id: id, message: "Máquina excluída com sucesso." };
}
