import { describe, expect, test, afterAll } from 'vitest';
import { User } from '../../../../src/schemas/user.js';
import { conn } from '../../../../src/config/conn.js';

describe('Integração: Mongoose Schema', () => {
    
    test('Criação de usuario', async () => {
        const usuario = new User({ nome: 'Nome Teste', role: 'admin' });
        const usuarioSalvo = await usuario.save();

        expect(usuarioSalvo._id).toBeDefined();
        expect(usuarioSalvo.nome).toBe('Nome Teste');

        await User.findByIdAndDelete(usuarioSalvo._id);
    });

    afterAll(async () => {
        await conn.mongoose.connection.close();
    });
});