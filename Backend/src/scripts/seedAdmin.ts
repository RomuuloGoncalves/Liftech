import { pathToFileURL } from 'node:url';
import { User } from '../schemas/user.js';
import { gerarHashSenha } from '../utils/senha.js';
import { logger } from '../utils/logger.js';
import { garantirEmpresa } from './seedEmpresa.js';

// Sem `empresaId` (yarn seed, --seed), garante a empresa padrão e a matriz antes de criar o admin.
export async function seedAdmin(empresaId?: unknown): Promise<void> {
    const { SEED_ADMIN_EMAIL, SEED_ADMIN_SENHA: senha, SEED_ADMIN_NOME: nome } = process.env;
    if (!SEED_ADMIN_EMAIL || !senha || !nome) {
        logger.warn('Seed do admin ignorado: defina SEED_ADMIN_EMAIL, SEED_ADMIN_SENHA e SEED_ADMIN_NOME.');
        return;
    }

    const email = SEED_ADMIN_EMAIL.trim().toLowerCase();
    const acesso = { empresaId: empresaId ?? (await garantirEmpresa()).empresaId, escopo: 'empresa' as const };
    if (await User.findOne({ email }).lean()) {
        await User.updateOne({ email }, { $set: acesso });
        logger.info(`Admin ${email} já existe, escopo de empresa atualizado.`);
        return;
    }

    await User.create({ nome, email, role: 'admin', ...acesso, senhaHash: gerarHashSenha(senha) });
    logger.info(`Admin ${email} criado.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { conn } = await import('../config/conn.js');
    await seedAdmin();
    await conn.mongoose.disconnect();
}
