import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const sectorSchema = new Schema({
    nome: { type: String, trim: true, required: true, maxlength: 60 },
    filialId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'branch',
        required: true,
        index: true
    }
})

// Nome único por filial, sem diferenciar maiúscula de minúscula (mesma collation de category).
sectorSchema.index({ filialId: 1, nome: 1 }, { unique: true, collation: { locale: 'pt', strength: 2 } })

export const Sector = conn.mongoose.model('sector', sectorSchema)
