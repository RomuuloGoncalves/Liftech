import { describe, expect, test, afterAll } from 'vitest';
import { Incident } from '../../../../src/schemas/incident.js';
import { conn } from '../../../../src/config/conn.js';

describe('Integração: Mongoose Schema - Incident', () => {
    
    test('Criação de incident', async () => {
        const dataTeste = new Date();
        const empilhadeiraId = new conn.mongoose.Types.ObjectId();
        const operadorId = new conn.mongoose.Types.ObjectId();

        const incident = new Incident({ 
            dataIncidente: dataTeste,
            forcaImpacto: 8.5,
            status: 'em analise',
            empilhadeiraId: empilhadeiraId,
            operadorId: operadorId
        });
        const incidentSalvo = await incident.save();

        expect(incidentSalvo._id).toBeDefined();
        expect(incidentSalvo.dataIncidente).toEqual(dataTeste);
        expect(incidentSalvo.forcaImpacto).toBe(8.5);
        expect(incidentSalvo.status).toBe('em analise');
        expect(incidentSalvo.empilhadeiraId).toEqual(empilhadeiraId);
        expect(incidentSalvo.operadorId).toEqual(operadorId);

        await Incident.findByIdAndDelete(incidentSalvo._id);
    });

    afterAll(async () => {
        await conn.mongoose.connection.close();
    });
});
