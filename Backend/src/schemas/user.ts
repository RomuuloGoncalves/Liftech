import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose

const userSchema = new Schema({
    nome: String,
    role: String,
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    usuario: { type: String, trim: true, unique: true, sparse: true },
    senhaHash: { type: String, select: false },
    empresaId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'company', required: true },
    escopo: { type: String, enum: ['empresa', 'filiais'], default: 'filiais' },
    filiaisIds: [{ type: conn.mongoose.Schema.Types.ObjectId, ref: 'branch' }]
})

export const User = conn.mongoose.model("user", userSchema)
