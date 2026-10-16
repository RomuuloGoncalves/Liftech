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
    COLABORADORES, DISPOSITIVOS, EMPILHADEIRAS, FICHAS, FILIAIS_DOS_COLABORADORES, FILIAIS_EXTRAS, OPERADORES, SENHA_PADRAO, SOLICITACOES,
    filialDaEmpilhadeira, filialDoDispositivo, filialDoOperador, gerarIncidentes, gerarTelemetria,
} from './seedDataset.js';
import { garantirEmpresa, upsert } from './seedEmpresa.js';
import { criarQuadroInicial, posicionarSemCategoria } from '../feature/category/categoryService.js';

export async function seedData() {
    const { empresaId, filialIds } = await garantirEmpresa(FILIAIS_EXTRAS);
    await seedAdmin(empresaId);

    const operadorIds = new Map<string, unknown>();
    for (const ficha of FICHAS) {
        operadorIds.set(ficha.nome, await upsert(Operator, { nome: ficha.nome }, { ...ficha, filialId: filialIds.get(filialDoOperador(ficha.nome)) }));
    }

    const dispositivoIds = new Map<string, unknown>();
    for (const d of DISPOSITIVOS) {
        dispositivoIds.set(d.enderecoMac, await upsert(Device, { enderecoMac: d.enderecoMac }, { ...d, filialId: filialIds.get(filialDoDispositivo(d.enderecoMac)) }));
    }

    const agora = Date.now();
    const empilhadeiraIds: unknown[] = [];
    for (const e of EMPILHADEIRAS) {
        empilhadeiraIds.push(await upsert(Forklift, { identificacao: e.identificacao }, {
            identificacao: e.identificacao,
            nome: e.nome,
            setor: e.setor,
            filialId: filialIds.get(filialDaEmpilhadeira(e)),
            dispositivoConectadoId: dispositivoIds.get(e.enderecoMac),
            status: e.status,
            ...(e.operador && { operadorConectadoId: operadorIds.get(e.operador) }),
            ...(e.status === 'em_uso' && e.tempoSessaoMinutos > 0 && { sessaoIniciadaEm: new Date(agora - e.tempoSessaoMinutos * 60_000) }),
        }));
    }

    // Só na criação do quadro as máquinas entram pela regra; depois a posição é de quem usa o kanban.
    const quadro = await criarQuadroInicial(empresaId);
    if (quadro) await posicionarSemCategoria([...filialIds.values()], quadro);

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
        for (const incidente of gerarIncidentes(String(empilhadeiraIds[i]), String(operadorId), i, e.status === 'alerta')) {
            const filialId = filialIds.get(filialDaEmpilhadeira(e));
            await upsert(Incident, { empilhadeiraId: incidente.empilhadeiraId, dataIncidente: incidente.dataIncidente }, { ...incidente, filialId });
            incidentes++;
        }
    }

    for (const c of COLABORADORES) {
        const filiaisIds = FILIAIS_DOS_COLABORADORES[c.usuario]!.map((nome) => filialIds.get(nome));
        // Liga ao operator de mesmo nome; sem par, fica sem operadorId.
        const operadorId = operadorIds.get(c.nome);
        await upsert(User, { usuario: c.usuario }, {
            nome: c.nome, usuario: c.usuario, acessoNegado: c.acessoNegado === true,
            role: 'colaborador', senhaHash: gerarHashSenha(SENHA_PADRAO), empresaId, escopo: 'filiais', filiaisIds,
            ...(operadorId !== undefined && { operadorId }),
        });
    }

    for (const s of SOLICITACOES) await upsert(AccessRequest, { email: s.email, status: s.status }, s);

    const contagem = {
        empresas: 1,
        filiais: filialIds.size,
        operadores: OPERADORES.length,
        dispositivos: DISPOSITIVOS.length,
        empilhadeiras: EMPILHADEIRAS.length,
        telemetria,
        incidentes,
        colaboradores: COLABORADORES.length,
        solicitacoes: SOLICITACOES.length,
    };
    logger.info(
        `Seed concluído: ${contagem.empresas} empresa, ${contagem.filiais} filiais, ${contagem.operadores} operadores, ${contagem.dispositivos} dispositivos, ` +
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
