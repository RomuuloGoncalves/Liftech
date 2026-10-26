import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

const { ObjectId } = conn.mongoose.Schema.Types

// Sessão de uso: aberta enquanto `fim` é null.
const workSessionSchema = new Schema({
    operadorId: { type: ObjectId, ref: 'operator', required: true },
    empilhadeiraId: { type: ObjectId, ref: 'forklift', required: true },
    filialId: { type: ObjectId, ref: 'branch', required: true, index: true },
    inicio: { type: Date, required: true },
    fim: { type: Date, default: null }
})

// No máximo uma sessão aberta por operador e por máquina; o Mongo recusa a segunda (11000).
workSessionSchema.index({ operadorId: 1 }, { unique: true, partialFilterExpression: { fim: null } })
workSessionSchema.index({ empilhadeiraId: 1 }, { unique: true, partialFilterExpression: { fim: null } })
workSessionSchema.index({ operadorId: 1, inicio: -1 })
workSessionSchema.index({ empilhadeiraId: 1, inicio: -1 })

export const WorkSession = conn.mongoose.model('workSession', workSessionSchema)
