import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const branchSchema = new Schema({
    nome: { type: String, trim: true, required: true },
    empresaId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'company',
        required: true
    },
    matriz: { type: Boolean, default: false }
})

// Nome único por empresa e, no máximo, uma matriz por empresa.
branchSchema.index({ empresaId: 1, nome: 1 }, { unique: true })
branchSchema.index({ empresaId: 1 }, { unique: true, partialFilterExpression: { matriz: true } })

export const Branch = conn.mongoose.model('branch', branchSchema)
