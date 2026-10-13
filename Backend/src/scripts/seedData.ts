import { pathToFileURL } from 'node:url';
import { Operator } from '../schemas/operator.js';
import { Device } from '../schemas/device.js';
import { Forklift } from '../schemas/forklift.js';
import { Telemetry } from '../schemas/telemetry.js';
import { Incident } from '../schemas/incident.js';
import { User } from '../schemas/user.js';
import { AccessRequest } from '../schemas/accessRequest.js';
import { gerarHashSenha } from '../utils/senha.js';
import { logger } from '../utils/logger.js';
import { seedAdmin } from './seedAdmin.js';
import {
    COLABORADORES, DISPOSITIVOS, EMPILHADEIRAS, OPERADORES, SOLICITACOES, gerarIncidentes, gerarTelemetria,
} from './seedDataset.js';

// Upsert pela chave natural: rodar de novo atualiza em vez de duplicar. Devolve o _id.
async function upsert(modelo: any, filtro: object, dados: object) {
    const doc = await modelo.findOneAndUpdate(filtro, { $set: dados }, { upsert: true, returnDocument: 'after' }).lean();
    return doc._id;
}

export async function seedData() {
    await seedAdmin();

    const operadorIds = new Map<string, unknown>();
    for (const nome of OPERADORES) operadorIds.set(nome, await upsert(Operator, { nome }, { nome }));

    const dispositivoIds = new Map<string, unknown>();
    for (const d of DISPOSITIVOS) dispositivoIds.set(d.enderecoMac, await upsert(Device, { enderecoMac: d.enderecoMac }, d));

    const agora = Date.now();
    const empilhadeiraIds: unknown[] = [];
    for (const e of EMPILHADEIRAS) {
        empilhadeiraIds.push(await upsert(Forklift, { identificacao: e.identificacao }, {
            identificacao: e.identificacao,
            nome: e.nome,
            setor: e.setor,
            dispositivoConectadoId: dispositivoIds.get(e.enderecoMac),
            ...(e.operador && { operadorConectadoId: operadorIds.get(e.operador) }),
            ...(e.tempoSessaoMinutos > 0 && { sessaoIniciadaEm: new Date(agora - e.tempoSessaoMinutos * 60_000) }),
        }));
    }

    let telemetria = 0;
    for (const dispositivoId of dispositivoIds.values()) {
        for (const leitura of gerarTelemetria(String(dispositivoId))) {
            await upsert(Telemetry, { dispositivoId: leitura.dispositivoId, dataDados: leitura.dataDados }, leitura);
            telemetria++;
        }
    }

    let incidentes = 0;
    for (const [i, e] of EMPILHADEIRAS.entries()) {
        const operadorId = operadorIds.get(e.operador ?? OPERADORES[i % OPERADORES.length]!);
        for (const incidente of gerarIncidentes(String(empilhadeiraIds[i]), String(operadorId), i)) {
            await upsert(Incident, { empilhadeiraId: incidente.empilhadeiraId, dataIncidente: incidente.dataIncidente }, incidente);
            incidentes++;
        }
    }

    let colaboradores = 0;
    const senha = process.env.SEED_COLABORADOR_SENHA;
    if (senha) {
        for (const c of COLABORADORES) {
            await upsert(User, { usuario: c.usuario }, { ...c, role: 'colaborador', senhaHash: gerarHashSenha(senha) });
            colaboradores++;
        }
    } else {
        logger.warn('Colaboradores ignorados: defina SEED_COLABORADOR_SENHA.');
    }

    for (const s of SOLICITACOES) await upsert(AccessRequest, { email: s.email, status: s.status }, s);

    const contagem = {
        operadores: OPERADORES.length,
        dispositivos: DISPOSITIVOS.length,
        empilhadeiras: EMPILHADEIRAS.length,
        telemetria,
        incidentes,
        colaboradores,
        solicitacoes: SOLICITACOES.length,
    };
    logger.info(
        `Seed concluído: ${contagem.operadores} operadores, ${contagem.dispositivos} dispositivos, ` +
        `${contagem.empilhadeiras} empilhadeiras, ${contagem.telemetria} leituras, ${contagem.incidentes} incidentes, ` +
        `${contagem.colaboradores} colaboradores, ${contagem.solicitacoes} solicitações.`
    );
    return contagem;
}

// Fecha a conexão mesmo se o seed falhar, senão o processo fica preso.
export async function seedEDesconectar(desconectar: () => Promise<unknown>) {
    try {
        return await seedData();
    } finally {
        await desconectar();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { conn } = await import('../config/conn.js');
    await seedEDesconectar(() => conn.mongoose.disconnect());
}
