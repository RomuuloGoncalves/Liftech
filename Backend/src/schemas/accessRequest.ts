import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose

const accessRequestSchema = new Schema({
    email: { type: String, lowercase: true, trim: true, required: true },
    nomeEmpresa: { type: String, trim: true, required: true },
    nomeAdministrador: { type: String, trim: true, required: true },
    status: { type: String, default: "pendente" }
}, { timestamps: true })

export const AccessRequest = conn.mongoose.model("accessRequest", accessRequestSchema)
