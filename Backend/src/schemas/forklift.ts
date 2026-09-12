import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const forkliftSchema = new Schema({
    identificacao: String,
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
