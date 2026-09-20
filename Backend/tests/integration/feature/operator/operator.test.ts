import { describe, expect, test, afterAll } from 'vitest';
import { Operator } from '../../../../src/schemas/operator.js';
import { conn } from '../../../../src/config/conn.js';

describe('Integração: Mongoose Schema - Operator', () => {
    
    test('Criação de operator', async () => {
        const operator = new Operator({ 
            nome: 'Operador Teste' 
        });
        const operatorSalvo = await operator.save();

        expect(operatorSalvo._id).toBeDefined();
        expect(operatorSalvo.nome).toBe('Operador Teste');

        await Operator.findByIdAndDelete(operatorSalvo._id);
    });

    afterAll(async () => {
        await conn.mongoose.connection.close();
    });
});
