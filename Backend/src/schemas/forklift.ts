import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const forkliftSchema = new Schema({
    identificacao: String,
    nome: String,
    setor: String,
    sessaoIniciadaEm: Date,
    // null = dado de antes do status gravado; a API lê como 'disponivel'.
    status: { type: String, enum: ['disponivel', 'em_uso', 'manutencao', 'alerta', 'offline', null], default: null },
    statusAlteradoEm: Date,
    categoriaId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'category', default: null, index: true },
    categoriaTravada: { type: Boolean, default: false },
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
