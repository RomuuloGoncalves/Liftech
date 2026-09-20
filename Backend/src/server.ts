import express from 'express';
import { startKeepAlive } from '@rafaelhdsv/keep-alive';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { getHealthTemplate } from './utils/healthTemplate.js';

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

app.listen(3000, () => {
  logger.info('Servidor rodando! Acesse http://localhost:3000');
  startKeepAlive();
}); 
