import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const feedbackSchema = new Schema({
    mensagem: { type: String, required: true, trim: true, maxlength: 1000 },
    usuarioId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    empresaId: { type: conn.mongoose.Schema.Types.ObjectId, ref: 'company' },
    role: { type: String, required: true },
    criadoEm: { type: Date, default: Date.now },
})

export const Feedback = conn.mongoose.model('feedback', feedbackSchema)
