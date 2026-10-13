import { pathToFileURL } from 'node:url';
import { User } from '../schemas/user.js';
import { Forklift } from '../schemas/forklift.js';
import { Device } from '../schemas/device.js';
import { Operator } from '../schemas/operator.js';
import { Incident } from '../schemas/incident.js';
import { logger } from '../utils/logger.js';
import { MATRIZ_NOME } from './seedDataset.js';
import { garantirEmpresa } from './seedEmpresa.js';

const alterados = async (resultado: Promise<{ modifiedCount: number }>) => (await resultado).modifiedCount;

// Leva os dados de antes das filiais para a empresa padrão: usuários e recursos sem `empresaId`/`filialId`
// ficam na matriz. O filtro `campo: null` casa campo ausente ou nulo, então rodar de novo não altera nada.
export async function migrarParaFiliais() {
    const { empresaId, filialIds } = await garantirEmpresa();
    const matrizId = filialIds.get(MATRIZ_NOME);

    const admins = await alterados(User.updateMany({ empresaId: null, role: 'admin' }, { $set: { empresaId, escopo: 'empresa' } }));
    // Depois dos admins: os que restam sem empresa não são admin.
    const colaboradores = await alterados(
        User.updateMany({ empresaId: null }, { $set: { empresaId, escopo: 'filiais', filiaisIds: [matrizId] } })
    );

    const naMatriz = (modelo: any) => alterados(modelo.updateMany({ filialId: null }, { $set: { filialId: matrizId } }));
    const contagem = {
        admins,
        colaboradores,
        empilhadeiras: await naMatriz(Forklift),
        dispositivos: await naMatriz(Device),
        operadores: await naMatriz(Operator),
        incidentes: await naMatriz(Incident),
    };
    logger.info(
        `Migração concluída: ${contagem.admins} admins, ${contagem.colaboradores} colaboradores, ` +
        `${contagem.empilhadeiras} empilhadeiras, ${contagem.dispositivos} dispositivos, ` +
        `${contagem.operadores} operadores, ${contagem.incidentes} incidentes.`
    );
    return contagem;
}

// Fecha a conexão mesmo se a migração falhar, senão o processo fica preso.
export async function migrarEDesconectar(desconectar: () => Promise<unknown>) {
    try {
        return await migrarParaFiliais();
    } finally {
        await desconectar();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { conn } = await import('../config/conn.js');
    await migrarEDesconectar(() => conn.mongoose.disconnect());
}
