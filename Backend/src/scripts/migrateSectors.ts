import { pathToFileURL } from 'node:url';
import { Forklift } from '../schemas/forklift.js';
import { Sector } from '../schemas/sector.js';
import { logger } from '../utils/logger.js';

const NOME_MAXIMO = 60;
// A mesma do índice único de sector: compara sem diferenciar maiúscula de minúscula.
const COLLATION = { locale: 'pt', strength: 2 };

// Leva o texto `forklift.setor` para um setor da filial e grava `setorId`.
// Só toca empilhadeiras com `setorId` vazio e acha o setor antes de criar, então rodar de novo não altera nada.
export async function migrarSetores() {
    const pendentes: any[] = await Forklift.find({ setorId: null, setor: { $type: 'string' } }).lean();
    const daFilial = new Map<string, unknown>();
    const contagem = { setores: 0, empilhadeiras: 0, ignoradas: 0 };

    for (const f of pendentes) {
        const nome = f.setor.trim();
        if (nome.length === 0 || nome.length > NOME_MAXIMO) {
            contagem.ignoradas++;
            continue;
        }
        const chave = `${f.filialId}|${nome.toLocaleLowerCase('pt')}`;
        let setorId = daFilial.get(chave);
        if (!setorId) {
            const existente: any = await Sector.findOne({ filialId: f.filialId, nome }).collation(COLLATION).lean();
            if (existente) {
                setorId = existente._id;
            } else {
                setorId = (await Sector.create({ filialId: f.filialId, nome }))._id;
                contagem.setores++;
            }
            daFilial.set(chave, setorId);
        }
        await Forklift.updateOne({ _id: f._id, setorId: null }, { $set: { setorId } });
        contagem.empilhadeiras++;
    }

    logger.info(`Migração de setores concluída: ${contagem.setores} setores criados, ${contagem.empilhadeiras} empilhadeiras ligadas, ${contagem.ignoradas} ignoradas.`);
    return contagem;
}

// Fecha a conexão mesmo se a migração falhar, senão o processo fica preso.
export async function migrarSetoresEDesconectar(desconectar: () => Promise<unknown>) {
    try {
        return await migrarSetores();
    } finally {
        await desconectar();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { conn } = await import('../config/conn.js');
    await migrarSetoresEDesconectar(() => conn.mongoose.disconnect());
}
