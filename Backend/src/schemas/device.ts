import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const deviceSchema = new Schema({
    nome: String,
    enderecoMac: { type: String, required: true, unique: true },
    status: String,
    filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch', required: true, index: true },
    empilhadeiraId: {
        type: conn.mongoose.Schema.Types.ObjectId,
        ref: 'empilhadeira',
        default: null
    }
})

export const Device = conn.mongoose.model('device', deviceSchema)