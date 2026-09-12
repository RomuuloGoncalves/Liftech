import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const telemetrySchema = new Schema({
    data_dados: Date,
    dispositivo_id: { 
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
})

export const Telemetry = conn.mongoose.model('telemetry', telemetrySchema)