import { pathToFileURL } from 'node:url';
import { User } from '../schemas/user.js';
import { gerarHashSenha } from '../utils/senha.js';
import { logger } from '../utils/logger.js';

export async function seedAdmin(): Promise<void> {
    const { SEED_ADMIN_EMAIL, SEED_ADMIN_SENHA: senha, SEED_ADMIN_NOME: nome } = process.env;
    if (!SEED_ADMIN_EMAIL || !senha || !nome) {
        logger.warn('Seed do admin ignorado: defina SEED_ADMIN_EMAIL, SEED_ADMIN_SENHA e SEED_ADMIN_NOME.');
        return;
    }

    const email = SEED_ADMIN_EMAIL.trim().toLowerCase();
    if (await User.findOne({ email }).lean()) {
        logger.info(`Admin ${email} já existe, seed ignorado.`);
        return;
    }

    await User.create({ nome, email, role: 'admin', senhaHash: gerarHashSenha(senha) });
    logger.info(`Admin ${email} criado.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { conn } = await import('../config/conn.js');
    await seedAdmin();
    await conn.mongoose.disconnect();
}
