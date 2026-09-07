import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose

const usuarioSchema = new Schema({
    nome: String,
})

export const Usuario = conn.mongoose.model("usuario", usuarioSchema)