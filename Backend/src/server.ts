import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { User } from './schemas/user.js';
import { Device } from './schemas/device.js';
import { Telemetry } from './schemas/telemetry.js';
import { Operator } from './schemas/operator.js';
import { Forklift } from './schemas/forklift.js';
import { Incident } from './schemas/incident.js';

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
  console.log(User)
  console.log(Device)
  console.log(Telemetry)
  console.log(Operator)
  console.log(Forklift)
  console.log(Incident)
}); 
