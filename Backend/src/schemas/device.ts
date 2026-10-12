import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const deviceSchema = new Schema({
    enderecoMac: { type: String, required: true, unique: true },
    status: String,
    empilhadeiraId: { 
        type: conn.mongoose.Schema.Types.ObjectId, 
        ref: 'empilhadeira',
        default: null 
    }
})

export const Device = conn.mongoose.model('device', deviceSchema)