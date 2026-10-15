import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const companySchema = new Schema({
    nome: { type: String, trim: true, required: true, unique: true }
})

export const Company = conn.mongoose.model('company', companySchema)
