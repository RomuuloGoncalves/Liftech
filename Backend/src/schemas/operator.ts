import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const operatorSchema = new Schema({
    nome: String
})

export const Operator = conn.mongoose.model('operator', operatorSchema)