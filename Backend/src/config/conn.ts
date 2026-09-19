import mongoose from "mongoose"
import { env } from "./env.js"
import pino from "pino"

const logger = pino()
const MONGOURI = env.mongo_uri
const DBNAME = env.db_name

mongoose.connection.on('connected', () => logger.info('Mongoose conectado ao MongoDB!'))
mongoose.connection.on('error', (err) => logger.error(`Erro no MongoDB: ${err.message}`))
mongoose.connection.on('disconnected', () => logger.warn('Mongoose desconectado.'))

if (MONGOURI && DBNAME) {
    try {
        await mongoose.connect(MONGOURI, {
            dbName: DBNAME,
            authSource: "admin",
            serverSelectionTimeoutMS: 5000,
        } as mongoose.ConnectOptions)
    } catch (error) {
        logger.fatal(`Falha ao conectar no banco: ${error}`)
        process.exit(1)
    }
} else {
    logger.warn('Variavies de acesso não encontradas ou com erros')
}

export const conn = {
    mongoose: mongoose
}