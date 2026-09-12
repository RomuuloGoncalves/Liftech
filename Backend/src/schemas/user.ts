import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose

const userSchema = new Schema({
    nome: String,
})

export const Usuario = conn.mongoose.model("user", userSchema)