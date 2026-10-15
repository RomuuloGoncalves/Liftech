import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const telemetrySchema = new Schema({
    dataDados: Date,
    forcaImpacto: Number,
    dispositivoId: { 
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
})

export const Telemetry = conn.mongoose.model('telemetry', telemetrySchema)