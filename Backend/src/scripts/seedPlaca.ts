import { pathToFileURL } from "node:url";
import { Device } from "../schemas/device.js";
import { Forklift } from "../schemas/forklift.js";
import { Sector } from "../schemas/sector.js";
import { logger } from "../utils/logger.js";
import { MATRIZ_NOME, PLACA, macDaPlaca } from "./seedDataset.js";
import { garantirEmpresa, upsert } from "./seedEmpresa.js";

export async function seedPlaca(filialId?: unknown) {
  const filial = filialId ?? (await garantirEmpresa()).filialIds.get(MATRIZ_NOME);
  const enderecoMac = macDaPlaca();
  const setorId = await upsert(Sector, { filialId: filial, nome: PLACA.setor }, { filialId: filial, nome: PLACA.setor });
  const dispositivoId = await upsert(
    Device,
    { enderecoMac },
    { enderecoMac, nome: PLACA.dispositivoNome, status: "online", filialId: filial }
  );
  // Só um dono por device: quem mais apontava para ele perde o vínculo.
  await Forklift.updateMany(
    { dispositivoConectadoId: dispositivoId, identificacao: { $ne: PLACA.identificacao } },
    { $unset: { dispositivoConectadoId: 1 } }
  );
  const empilhadeiraId = await upsert(
    Forklift,
    { identificacao: PLACA.identificacao },
    {
      identificacao: PLACA.identificacao,
      nome: PLACA.nome,
      setorId,
      filialId: filial,
      dispositivoConectadoId: dispositivoId,
      status: "disponivel",
    }
  );
  await Device.updateOne({ _id: dispositivoId }, { $set: { empilhadeiraId } });
  logger.info(
    `Placa ${enderecoMac} -> ${PLACA.identificacao} (${PLACA.nome}). secrets.h:\n` +
      `#define EMPILHADEIRA_ID "${PLACA.identificacao}"\n#define EMPILHADEIRA_NOME "${PLACA.nome}"\n#define DISPOSITIVO_NOME "${PLACA.dispositivoNome}"`
  );
  return { dispositivoId, empilhadeiraId };
}

// Fecha a conexão mesmo se o seed falhar, senão o processo fica preso.
export async function seedPlacaEDesconectar(desconectar: () => Promise<unknown>) {
  try {
    return await seedPlaca();
  } finally {
    await desconectar();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { conn } = await import("../config/conn.js");
  await seedPlacaEDesconectar(() => conn.mongoose.disconnect());
}
