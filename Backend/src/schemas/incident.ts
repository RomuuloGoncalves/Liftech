import { conn } from "../config/conn.js"
import { STATUS_VALIDOS } from "../models/incidentModel.js"
const { Schema } = conn.mongoose

const incidentSchema = new Schema ({
    dataIncidente: Date,
    forcaImpacto: Number,
    status: {
        type: String,
        enum: STATUS_VALIDOS
    },
    empilhadeiraId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'forklift'
    },
    operadorId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'operator'
    }
})

incidentSchema.index({ status: 1 })
incidentSchema.index({ empilhadeiraId: 1, dataIncidente: -1 })

export const Incident = conn.mongoose.model('incident', incidentSchema)