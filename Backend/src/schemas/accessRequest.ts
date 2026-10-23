import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose

const accessRequestSchema = new Schema({
    email: { type: String, lowercase: true, trim: true, required: true },
    nomeEmpresa: { type: String, trim: true, required: true },
    nomeAdministrador: { type: String, trim: true, required: true },
    status: {
        type: String,
        enum: ['pendente', 'aprovando', 'aprovada', 'recusada'],
        default: "pendente"
    },
    empresaId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'company'
    },
    decididaEm: { type: Date },
    motivoRecusa: { type: String, trim: true, maxlength: 200 }
}, { timestamps: true })

accessRequestSchema.index({ status: 1, createdAt: 1 })

export const AccessRequest = conn.mongoose.model("accessRequest", accessRequestSchema)
