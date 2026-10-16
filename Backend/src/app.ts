import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { getHealthTemplate } from './utils/healthTemplate.js';
import { autenticar } from './core/autenticar.js';
import forkliftRouter from './feature/forklift/forkliftRouter.js';
import userRouter from './feature/user/userRouter.js';
import authRouter from './feature/auth/authRouter.js';
import accessRequestRouter from './feature/accessRequest/accessRequestRouter.js';
import telemetryRouter from './feature/telemetry/telemtryRouter.js';
import machineRouter from './feature/machine/machineRouter.js';
import branchRouter from './feature/branch/branchRouter.js';
import categoryRouter from './feature/category/categoryRouter.js';
import sessionRouter from './feature/session/sessionRouter.js';
import incidentRouter from './feature/incident/incidentRouter.js';
import operatorRouter from './feature/operator/operatorRouter.js';
import sectorRouter from './feature/sector/sectorRouter.js';
import resetRouter from './feature/reset/resetRouter.js';

export const app = express();

app.use(cors());
app.use(express.json());

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

let lastPingTime: string | null = null;

app.get('/api/health', (req, res) => {
  const currentPing = new Date().toLocaleString('pt-BR');
  const displayLastPing = lastPingTime || 'Primeiro ping!';
  lastPingTime = currentPing;

  if (req.accepts('html')) {
    const html = getHealthTemplate(displayLastPing);
    res.status(200).send(html);
  } else {
    res.status(200).json({ ok: true, lastPing: displayLastPing });
  }
});

// Rotas públicas: login, solicitação de acesso e reset do banco. Tudo que vem depois de `autenticar` exige token.
app.use('/api/auth', authRouter);
app.use('/api/access-requests', accessRequestRouter);
app.use('/api/reset', resetRouter);

app.use('/api', autenticar);

app.use('/api/forklifts', forkliftRouter);
app.use('/api/users', userRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/machines', machineRouter);
app.use('/api/branches', branchRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/incidents', incidentRouter);
app.use('/api/operators', operatorRouter);
app.use('/api/sectors', sectorRouter);
