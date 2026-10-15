import { pathToFileURL } from 'node:url';
import { Forklift } from '../schemas/forklift.js';
import { Company } from '../schemas/company.js';
import { Branch } from '../schemas/branch.js';
import '../schemas/device.js';
import { logger } from '../utils/logger.js';
import { criarQuadroInicial, posicionarSemCategoria } from '../feature/category/categoryService.js';

// Texto antigo de `device.status` para o status gravado na empilhadeira. Valor desconhecido vira 'disponivel'.
const STATUS_ANTIGO: Record<string, string> = {
    'Disponível': 'disponivel',
    'Em uso': 'em_uso',
    'Manutenção': 'manutencao',
    'Offline': 'offline',
};

// Leva o status do dispositivo para a empilhadeira e dá o quadro inicial às empresas sem categorias.
// Só toca empilhadeiras com `status: null` e empresas sem categoria, então rodar de novo não altera nada.
export async function migrarStatus() {
    const semStatus: any[] = await Forklift.find({ status: null }).populate('dispositivoConectadoId').lean();
    for (const f of semStatus) {
        const dispositivo = f.dispositivoConectadoId;
        const status = dispositivo ? STATUS_ANTIGO[dispositivo.status] ?? 'disponivel' : 'offline';
        await Forklift.updateOne({ _id: f._id, status: null }, { $set: { status } });
    }

    let quadros = 0;
    const empresas: any[] = await Company.find().lean();
    for (const empresa of empresas) {
        const quadro = await criarQuadroInicial(empresa._id);
        if (!quadro) continue;
        const filiais = await Branch.find({ empresaId: empresa._id }).distinct('_id');
        await posicionarSemCategoria(filiais, quadro);
        quadros++;
    }

    const contagem = { empilhadeiras: semStatus.length, quadros };
    logger.info(`Migração de status concluída: ${contagem.empilhadeiras} empilhadeiras com status, ${contagem.quadros} quadros criados.`);
    return contagem;
}

// Fecha a conexão mesmo se a migração falhar, senão o processo fica preso.
export async function migrarStatusEDesconectar(desconectar: () => Promise<unknown>) {
    try {
        return await migrarStatus();
    } finally {
        await desconectar();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { conn } = await import('../config/conn.js');
    await migrarStatusEDesconectar(() => conn.mongoose.disconnect());
}
