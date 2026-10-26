import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const operatorSchema = new Schema({
    nome: String,
    matricula: { type: String, trim: true },
    telefone: { type: String, trim: true },
    cargo: { type: String, trim: true },
    horarioEntrada: { type: String, trim: true },
    horarioSaida: { type: String, trim: true },
    // Só os cadastros novos trazem empresaId; os antigos ficam fora do índice único da matrícula.
    empresaId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'company' },
    filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch', required: true, index: true }
})

operatorSchema.index({ empresaId: 1, matricula: 1 }, { unique: true, partialFilterExpression: { empresaId: { $exists: true }, matricula: { $type: 'string' } } })

export const Operator = conn.mongoose.model('operator', operatorSchema)