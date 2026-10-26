import pino from 'pino';

export function obterOpcoesLogger(env = process.env): pino.LoggerOptions {
  const isProduction = env.NODE_ENV === 'production';
  return {
    level: env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization'],
    ...(isProduction
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname,req,res',
            },
          },
        }),
  };
}

export function criarLogger(opcoes?: pino.LoggerOptions, destino?: pino.DestinationStream) {
  const base = obterOpcoesLogger();
  if (destino) {
    const { transport, ...resto } = base;
    return pino({ ...resto, ...opcoes }, destino);
  }
  return pino({ ...base, ...opcoes });
}

export const logger = criarLogger();
