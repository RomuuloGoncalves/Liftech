import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const operatorSchema = new Schema({
    nome: String,
    matricula: { type: String, trim: true },
    telefone: { type: String, trim: true },
    cargo: { type: String, trim: true },
    horarioEntrada: { type: String, trim: true },
    horarioSaida: { type: String, trim: true },
    filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch', required: true, index: true }
})

export const Operator = conn.mongoose.model('operator', operatorSchema)