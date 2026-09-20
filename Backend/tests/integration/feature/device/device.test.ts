import { describe, expect, test, afterAll } from 'vitest';
import { Device } from '../../../../src/schemas/device.js';
import { conn } from '../../../../src/config/conn.js';

describe('Integração: Mongoose Schema - Device', () => {
    
    test('Criação de device', async () => {
        const device = new Device({ 
            enderecoMac: '00:1B:44:11:3A:B7', 
            status: 'ativo' 
        });
        const deviceSalvo = await device.save();

        expect(deviceSalvo._id).toBeDefined();
        expect(deviceSalvo.enderecoMac).toBe('00:1B:44:11:3A:B7');
        expect(deviceSalvo.status).toBe('ativo');

        await Device.findByIdAndDelete(deviceSalvo._id);
    });

    afterAll(async () => {
        await conn.mongoose.connection.close();
    });
});
