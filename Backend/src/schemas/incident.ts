import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const incidentSchema = new Schema ({
    dataIncidente: Date,
    forcaImpacto: Number,
    status: String,
    origem: { type: String, enum: ['sensor', 'funcionario'], default: 'sensor' },
    descricao: { type: String, maxlength: 500 },
    filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch', required: true },
    empilhadeiraId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'forklift'
    },
    operadorId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'operator'
    }
})

incidentSchema.index({ filialId: 1, dataIncidente: -1 })
incidentSchema.index({ empilhadeiraId: 1, status: 1 })

export const Incident = conn.mongoose.model('incident', incidentSchema)
