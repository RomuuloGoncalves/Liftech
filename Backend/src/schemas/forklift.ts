import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const forkliftSchema = new Schema({
    identificacao: String,
    nome: String,
    setor: String,
    sessaoIniciadaEm: Date,
    filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch', required: true, index: true },
    dispositivoConectadoId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
    operadorConectadoId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'operator'
    }
})

export const Forklift = conn.mongoose.model('forklift', forkliftSchema)
