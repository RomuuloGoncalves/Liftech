import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const forkliftSchema = new Schema({
    identificacao: String,
    dispositivo_conectado_id: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
    operador_conectado_id: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'operator'
    }
})

export const Forklift = conn.mongoose.model('forklift', forkliftSchema)
