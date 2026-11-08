import { conflitoSeDuplicado } from "../../utils/mongo.js";
import { Forklift } from "../../schemas/forklift.js";
import { Incident } from "../../schemas/incident.js";
import { Category } from "../../schemas/category.js";
import { WorkSession } from "../../schemas/workSession.js";
import { Device } from "../../schemas/device.js";
import "../../schemas/operator.js";
import { ForkliftRepository } from "../forklift/forkliftRepository.js";
import { IncidentRepository } from "../incident/incidentRepository.js";
import { CategoryRepository } from "../category/categoryRepository.js";
import { WorkSessionRepository } from "../session/workSessionRepository.js";
import { DeviceRepository } from "../device/deviceRepository.js";
import { filtroPorFilial, type Escopo } from "../../core/escopo.js";
import { ErroHttp, StatusCode } from "../../utils/responseHandler.js";
import { categoriaDoStatus } from "./statusService.js";
import { exigirSetorDaFilial, nomesDosSetores } from "../sector/sectorService.js";
import { publicarMaquina } from "../stream/streamHub.js";

const MINUTO_MS = 60_000;
const HORA_MS = 60 * MINUTO_MS;
const MAC_REPETIDO = "Já existe um dispositivo com este endereço MAC.";

export interface DadosMaquina {
  nome?: string;
  identificacao?: string;
  setorId?: string | null;
  nomeDispositivo?: string;
  enderecoMac?: string;
}

const empilhadeiras = new ForkliftRepository(Forklift);
const incidentes = new IncidentRepository(Incident);
const categorias = new CategoryRepository(Category);
const sessoes = new WorkSessionRepository(WorkSession);
const dispositivos = new DeviceRepository(Device);

const normalizarMac = (mac: string) => mac.trim().toUpperCase();

// Horas com uma casa decimal.
const emHoras = (ms: number | undefined) => Math.round((ms ?? 0) / (HORA_MS / 10)) / 10;

// Segunda-feira 00:00 da semana de `agora`, no fuso do servidor (o mesmo critério de lerPeriodo).
function inicioDaSemana(agora: Date): Date {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return inicio;
}

interface UsoDaMaquina {
  totalMs: number;
  semanaMs: number;
  operador: { nome?: string }[];
}

// Tempo de uso (total e da semana) e o operador da sessão mais recente de cada máquina, numa agregação só.
// Sessão aberta conta até agora; de uma sessão que começou antes da segunda, só conta a parte da semana.
async function usoDasMaquinas(ids: unknown[], agora: Date): Promise<Map<string, UsoDaMaquina>> {
  if (ids.length === 0) return new Map();
  const fim = { $ifNull: ["$fim", agora] };
  const usos = await sessoes.agregar([
    { $match: { empilhadeiraId: { $in: ids } } },
    { $sort: { inicio: -1 } },
    {
      $group: {
        _id: "$empilhadeiraId",
        totalMs: { $sum: { $subtract: [fim, "$inicio"] } },
        semanaMs: { $sum: { $max: [0, { $subtract: [fim, { $max: ["$inicio", inicioDaSemana(agora)] }] }] } },
        ultimoOperadorId: { $first: "$operadorId" },
      },
    },
    { $lookup: { from: "operators", localField: "ultimoOperadorId", foreignField: "_id", as: "operador" } },
  ]);
  return new Map(usos.map((uso) => [String(uso._id), uso as UsoDaMaquina]));
}

// O índice único em device.enderecoMac recusa o MAC repetido numa corrida (11000).
const traduzirErro = conflitoSeDuplicado(MAC_REPETIDO);

// Monta as máquinas no formato do front. `alertaEm` vem do incidente pendente mais recente, numa consulta só.
async function consultar(filtro: Record<string, unknown>) {
  const maquinas = (
    await empilhadeiras.obterTodos(filtro, {
      ordenacao: { identificacao: 1 },
      popular: [{ caminho: "dispositivoConectadoId" }, { caminho: "operadorConectadoId" }],
    })
  ).map((m) => m.getDocumento());

  const emAlerta = maquinas.filter((f) => f.status === "alerta").map((f) => f._id);
  const alertaEm = new Map<string, string>();
  const alertaTiposMap = new Map<string, string[]>();
  if (emAlerta.length > 0) {
    const pendentes: any[] = (
      await incidentes.obterTodos({ empilhadeiraId: { $in: emAlerta }, status: "pendente" }, { ordenacao: { dataIncidente: -1 } })
    ).map((i) => i.obterDados());
    for (const incidente of pendentes) {
      const chave = String(incidente.empilhadeiraId);
      if (!alertaEm.has(chave) && incidente.dataIncidente) {
        alertaEm.set(chave, new Date(incidente.dataIncidente).toISOString());
      }
      if (incidente.tipo && typeof incidente.tipo === "string") {
        const tipos = alertaTiposMap.get(chave) ?? [];
        if (!tipos.includes(incidente.tipo)) {
          tipos.push(incidente.tipo);
          alertaTiposMap.set(chave, tipos);
        }
      }
    }
  }

  const setores = await nomesDosSetores(maquinas.map((f) => f.setorId));
  const agora = Date.now();
  const usos = await usoDasMaquinas(
    maquinas.map((f) => f._id),
    new Date(agora)
  );

  return maquinas.map((f) => {
    const dispositivo = f.dispositivoConectadoId;
    const operador = f.operadorConectadoId;
    const inicio = f.sessaoIniciadaEm ? new Date(f.sessaoIniciadaEm).getTime() : agora;
    const status = f.status ?? "disponivel";
    const uso = usos.get(String(f._id));
    const ultimoOperador = uso?.operador[0];

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
      alertaEm: status === "alerta" ? (alertaEm.get(String(f._id)) ?? null) : null,
      alertaTipos: alertaTiposMap.get(String(f._id)) ?? [],
      dispositivoOffline: f.offlineDesde != null,
      dispositivoConectado: { enderecoMac: dispositivo?.enderecoMac ?? "", nomeDispositivo: dispositivo?.nome },
      ...(operador && { operadorConectado: { nome: operador.nome } }),
      tempoSessaoMinutos: Math.max(0, Math.floor((agora - inicio) / MINUTO_MS)),
      tempoUsoTotalHoras: emHoras(uso?.totalMs),
      tempoUsoSemanaHoras: emHoras(uso?.semanaMs),
      ultimoOperador: ultimoOperador ? { nome: ultimoOperador.nome } : null,
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
  await empilhadeiras.atualizarUm({ _id: id }, { $set: { categoriaTravada } });
  try {
    await publicarMaquina(id);
  } catch {
    // Falha na publicação não muda a resposta da operação
  }
  return obterMaquina(escopo, id);
}

// Mover à mão só muda a categoria; status e trava ficam como estão. Confere tudo antes de gravar qualquer uma.
export async function moverParaCategoria(escopo: Escopo, machineIds: string[], categoriaId: string | null) {
  const ids = [...new Set(machineIds)];
  const doEscopo = { _id: { $in: ids }, ...filtroPorFilial(escopo) };
  if ((await empilhadeiras.contar(doEscopo)) !== ids.length) {
    throw new ErroHttp(StatusCode.NOT_FOUND, "Máquina não encontrada.");
  }
  if (categoriaId !== null && !(await categorias.existe({ _id: categoriaId, empresaId: escopo.empresaId }))) {
    throw new ErroHttp(StatusCode.NOT_FOUND, "Categoria não encontrada.");
  }
  await empilhadeiras.atualizarVarios({ _id: { $in: ids } }, { $set: { categoriaId } });
  for (const id of ids) {
    try {
      await publicarMaquina(id);
    } catch {
      // Falha na publicação não muda a resposta da operação
    }
  }
  return consultar(doEscopo);
}

// ponytail: device e forklift sem transação; se o forklift falhar, apaga o device (compensação). Transação quando houver replica set.
export async function criarMaquina(escopo: Escopo, dados: DadosMaquina & { filialId: string }) {
  const enderecoMac = normalizarMac(dados.enderecoMac ?? "");
  if (await empilhadeiras.existe({ identificacao: dados.identificacao })) {
    throw new ErroHttp(StatusCode.CONFLICT, `Já existe uma empilhadeira com a identificação "${dados.identificacao}".`);
  }
  if (await dispositivos.existe({ enderecoMac })) throw new ErroHttp(StatusCode.CONFLICT, MAC_REPETIDO);
  if (dados.setorId) await exigirSetorDaFilial(dados.setorId, dados.filialId);

  const dispositivo = await dispositivos
    .criarDados({ enderecoMac, nome: dados.nomeDispositivo, filialId: dados.filialId })
    .catch(traduzirErro);
  let empilhadeira;
  try {
    empilhadeira = await empilhadeiras.criarDados({
      identificacao: dados.identificacao,
      nome: dados.nome,
      setorId: dados.setorId ?? null,
      status: "disponivel",
      statusAlteradoEm: new Date(),
      categoriaId: await categoriaDoStatus(dados.filialId, "disponivel"),
      filialId: dados.filialId,
      dispositivoConectadoId: dispositivo.getIdOriginal(),
    });
  } catch (error) {
    await dispositivos.deletarUm({ _id: dispositivo.getIdOriginal() });
    return traduzirErro(error);
  }
  return obterMaquina(escopo, String(empilhadeira.getIdOriginal()));
}

export async function atualizarMaquina(escopo: Escopo, id: string, dados: DadosMaquina) {
  await obterMaquina(escopo, id);
  const empilhadeira = (await empilhadeiras.buscarPorId(id))?.getDocumento();
  const dispositivoId = empilhadeira?.dispositivoConectadoId;

  const doForklift: Record<string, unknown> = {};
  for (const campo of ["nome", "identificacao", "setorId"] as const) {
    if (dados[campo] !== undefined) doForklift[campo] = dados[campo];
  }
  const doDevice: Record<string, unknown> = {};
  if (dados.nomeDispositivo !== undefined) doDevice.nome = dados.nomeDispositivo;
  if (dados.enderecoMac !== undefined) doDevice.enderecoMac = normalizarMac(dados.enderecoMac);

  if (
    doForklift.identificacao !== undefined &&
    (await empilhadeiras.existe({ identificacao: doForklift.identificacao, _id: { $ne: id } }))
  ) {
    throw new ErroHttp(StatusCode.CONFLICT, `Já existe uma empilhadeira com a identificação "${doForklift.identificacao}".`);
  }
  if (
    doDevice.enderecoMac !== undefined &&
    (await dispositivos.existe({ enderecoMac: doDevice.enderecoMac, _id: { $ne: dispositivoId } }))
  ) {
    throw new ErroHttp(StatusCode.CONFLICT, MAC_REPETIDO);
  }
  if (dados.setorId) await exigirSetorDaFilial(dados.setorId, empilhadeira?.filialId);

  if (Object.keys(doForklift).length > 0) await empilhadeiras.atualizarUm({ _id: id }, { $set: doForklift });
  // ponytail: máquina sem device ligado (dado antigo) ignora os campos do device; criar o device aqui se aparecer o caso.
  if (Object.keys(doDevice).length > 0 && dispositivoId)
    await dispositivos.atualizarUm({ _id: dispositivoId }, { $set: doDevice }).catch(traduzirErro);
  return obterMaquina(escopo, id);
}

// Sessões e incidentes antigos ficam: o histórico mostra a máquina apagada como null.
// ponytail: forklift e device apagados sem transação; uma falha no meio deixa o device órfão.
export async function excluirMaquina(escopo: Escopo, id: string) {
  await obterMaquina(escopo, id);
  if (await sessoes.existe({ empilhadeiraId: id, fim: null })) {
    throw new ErroHttp(StatusCode.CONFLICT, "Máquina com sessão aberta.");
  }
  const empilhadeira = (await empilhadeiras.buscarPorId(id))?.getDocumento();
  await empilhadeiras.deletarUm({ _id: id });
  if (empilhadeira?.dispositivoConectadoId) await dispositivos.deletarUm({ _id: empilhadeira.dispositivoConectadoId });
  return { _id: id, message: "Máquina excluída com sucesso." };
}
