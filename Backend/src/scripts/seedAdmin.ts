import { pathToFileURL } from 'node:url';
import { User } from '../schemas/user.js';
import { gerarHashSenha } from '../utils/senha.js';
import { logger } from '../utils/logger.js';
import { garantirEmpresa } from './seedEmpresa.js';
import { ADMIN, SENHA_PADRAO } from './seedDataset.js';

// Admin fixo de desenvolvimento (ADMIN + SENHA_PADRAO). Sem `empresaId` (yarn seed, --seed), garante a empresa padrão e a matriz antes.
export async function seedAdmin(empresaId?: unknown): Promise<void> {
    const { nome, email } = ADMIN;
    const acesso = { empresaId: empresaId ?? (await garantirEmpresa()).empresaId, escopo: 'empresa' as const };
    // Um admin que já existe volta para a senha fixa: as credenciais de teste nunca mudam.
    const dados = { ...acesso, senhaHash: gerarHashSenha(SENHA_PADRAO) };
    if (await User.findOne({ email }).lean()) {
        await User.updateOne({ email }, { $set: dados });
        logger.info(`Admin ${email} já existe, escopo e senha atualizados.`);
        return;
    }

    await User.create({ nome, email, role: 'admin', ...dados });
    logger.info(`Admin ${email} criado.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { conn } = await import('../config/conn.js');
    await seedAdmin();
    await conn.mongoose.disconnect();
}
