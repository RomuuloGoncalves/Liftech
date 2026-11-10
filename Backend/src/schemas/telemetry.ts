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

const telemetrySchema = new Schema({
  dataDados: Date,
  forcaImpacto: Number,
  movimento: movimentoSchema,
  dispositivoId: {
    type: conn.mongoose.Schema.Types.ObjectId,
    ref: "device",
  },
});

telemetrySchema.index({ dispositivoId: 1, dataDados: -1 });
telemetrySchema.index({ dataDados: 1 }, { expireAfterSeconds: 604800 });

export const Telemetry = conn.mongoose.model("telemetry", telemetrySchema);
