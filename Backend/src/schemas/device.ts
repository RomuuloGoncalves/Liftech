import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const deviceSchema = new Schema({
    endereco_mac: String,
    status: String
})

export const Device = conn.mongoose.model('device', deviceSchema)
