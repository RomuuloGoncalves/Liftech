import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { Usuario } from './schemas/user.js';

const app = express();

// @ts-ignore
app.use(pinoHttp({ 
  logger,
  customSuccessMessage: function (req: any, res: any) {
    return `${req.method} ${req.url} - Status: ${res.statusCode}`;
  },
  customErrorMessage: function (req: any, res: any, err: any) {
    return `${req.method} ${req.url} - Status: ${res.statusCode} - Erro: ${err.message}`;
  }
}));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  logger.info('Servidor rodando! Acesse http://localhost:3000');
  console.log(Usuario)
}); 
