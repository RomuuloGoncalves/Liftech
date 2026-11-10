import { conn } from "../config/conn.js";
const { Schema } = conn.mongoose;

const movimentoSchema = new Schema(
  {
    aceleracaoX: Number,
    aceleracaoY: Number,
    aceleracaoZ: Number,
    inclinacaoX: Number,
    inclinacaoY: Number,
    magnitude: Number,
  },
  { _id: false }
);

const incidentSchema = new Schema({
  dataIncidente: Date,
  forcaImpacto: Number,
  status: String,
  origem: { type: String, enum: ["sensor", "funcionario"], default: "sensor" },
  descricao: { type: String, maxlength: 500 },
  tipo: {
    type: String,
    enum: ["colisao", "frenagem_brusca", "aceleracao_brusca", "curva_brusca", "inclinacao_excessiva"],
  },
  movimento: movimentoSchema,
  filialId: { type: conn.mongoose.Schema.Types.ObjectId, ref: "branch", required: true },
  empilhadeiraId: {
    type: conn.mongoose.Schema.Types.ObjectId,
    ref: "forklift",
  },
  operadorId: {
    type: conn.mongoose.Schema.Types.ObjectId,
    ref: "operator",
  },
});

incidentSchema.index({ filialId: 1, dataIncidente: -1 });
incidentSchema.index({ empilhadeiraId: 1, status: 1 });

export const Incident = conn.mongoose.model("incident", incidentSchema);
