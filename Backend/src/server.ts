import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { Usuario } from './schemas/user.js';
import { Devices } from './schemas/devices.js';
import { Telemetry } from './schemas/telemetry.js';
import { Operator } from './schemas/operator.js';
import { Forklift } from './schemas/forklifts.js';
import { Incident } from './schemas/incidents.js';

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
  console.log(Devices)
  console.log(Telemetry)
  console.log(Operator)
  console.log(Forklift)
  console.log(Incident)
}); 
