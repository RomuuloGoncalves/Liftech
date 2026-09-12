import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const deviceSchema = new Schema({
    enderecoMac: String,
    status: String
})

export const Device = conn.mongoose.model('device', deviceSchema)
