import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const incidentSchema = new Schema ({
    data_incidente: Date,
    forca_impacto: Number,
    status: String,
    empilhadeira_id: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'forklift'
    },
    operador_id: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'operator'
    }
})

export const Incident = conn.mongoose.model('incident', incidentSchema)
