import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

export const CHAVES_CATEGORIA = ['acidentes', 'ativas', 'manutencao', 'disponiveis'] as const

const categorySchema = new Schema({
    empresaId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'company',
        required: true,
        index: true
    },
    nome: { type: String, trim: true, required: true, maxlength: 40 },
    cor: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    // Categoria inicial: o front traduz o nome por esta chave até alguém renomear.
    chave: { type: String, enum: [...CHAVES_CATEGORIA, null], default: null },
    statusVinculados: { type: [String], default: [] }
})

// Nome único por empresa, sem diferenciar maiúscula de minúscula.
categorySchema.index({ empresaId: 1, nome: 1 }, { unique: true, collation: { locale: 'pt', strength: 2 } })

export const Category = conn.mongoose.model('category', categorySchema)
