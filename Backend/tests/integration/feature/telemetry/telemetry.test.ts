import { describe, expect, test, afterAll } from 'vitest';
import { Telemetry } from '../../../../src/schemas/telemetry.js';
import { conn } from '../../../../src/config/conn.js';

describe('Integração: Mongoose Schema - Telemetry', () => {
    
    test('Criação de telemetry', async () => {
        const dataTeste = new Date();
        const dispositivoId = new conn.mongoose.Types.ObjectId();

        const telemetry = new Telemetry({ 
            dataDados: dataTeste,
            dispositivoId: dispositivoId
        });
        const telemetrySalvo = await telemetry.save();

        expect(telemetrySalvo._id).toBeDefined();
        expect(telemetrySalvo.dataDados).toEqual(dataTeste);
        expect(telemetrySalvo.dispositivoId).toEqual(dispositivoId);

        await Telemetry.findByIdAndDelete(telemetrySalvo._id);
    });

    afterAll(async () => {
        await conn.mongoose.connection.close();
    });
});
