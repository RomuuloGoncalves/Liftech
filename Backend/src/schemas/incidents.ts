import { conn } from "../config/conn.js"
const { Schema } = conn.mongoose

    const incidentSchema = new Schema ({
        data_incidente: Date,
        forcao_impacto: Number,
        status: String,

        
    })

export const Incident = conn.mongoose.model('incident', incidentSchema)