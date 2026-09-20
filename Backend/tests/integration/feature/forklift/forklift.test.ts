import { describe, expect, test, afterAll } from 'vitest';
import { Forklift } from '../../../../src/schemas/forklift.js';
import { conn } from '../../../../src/config/conn.js';

describe('Integração: Mongoose Schema - Forklift', () => {
    
    test('Criação de forklift', async () => {
        const dispositivoId = new conn.mongoose.Types.ObjectId();
        const operadorId = new conn.mongoose.Types.ObjectId();

        const forklift = new Forklift({ 
            identificacao: 'EMP-001',
            dispositivoConectadoId: dispositivoId,
            operadorConectadoId: operadorId
        });
        const forkliftSalvo = await forklift.save();

        expect(forkliftSalvo._id).toBeDefined();
        expect(forkliftSalvo.identificacao).toBe('EMP-001');
        expect(forkliftSalvo.dispositivoConectadoId).toEqual(dispositivoId);
        expect(forkliftSalvo.operadorConectadoId).toEqual(operadorId);

        await Forklift.findByIdAndDelete(forkliftSalvo._id);
    });

    afterAll(async () => {
        await conn.mongoose.connection.close();
    });
});
