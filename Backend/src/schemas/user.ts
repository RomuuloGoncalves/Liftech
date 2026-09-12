import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose

const userSchema = new Schema({
    nome: String,
    role: String
})

export const User = conn.mongoose.model("user", userSchema)