import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose

const userSchema = new Schema({
    nome: String,
    role: String,
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    usuario: { type: String, trim: true, unique: true, sparse: true },
    senhaHash: { type: String, select: false }
})

export const User = conn.mongoose.model("user", userSchema)
