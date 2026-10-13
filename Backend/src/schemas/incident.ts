import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const incidentSchema = new Schema ({
    dataIncidente: Date,
    forcaImpacto: Number,
    status: String,
    filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch', required: true, index: true },
    empilhadeiraId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'forklift'
    },
    operadorId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'operator'
    }
})

export const Incident = conn.mongoose.model('incident', incidentSchema)
