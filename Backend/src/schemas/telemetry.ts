import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const telemetrySchema = new Schema({
    data_dado: Date,
    deviceId: { 
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
})

export const Telemetry = conn.mongoose.model('telemtry', telemetrySchema)