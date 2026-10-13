import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const operatorSchema = new Schema({
    nome: String,
    filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch', required: true, index: true }
})

export const Operator = conn.mongoose.model('operator', operatorSchema)