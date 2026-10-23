import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('em produção, não usa transport e respeita LOG_LEVEL', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('LOG_LEVEL', 'warn');

        const { logger, obterOpcoesLogger } = await import('../../src/utils/logger.js');
        const opcoes = obterOpcoesLogger();

        expect(opcoes.transport).toBeUndefined();
        expect(opcoes.level).toBe('warn');
        expect(logger.level).toBe('warn');
    });

    test('em desenvolvimento, usa transport pino-pretty e respeita LOG_LEVEL', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('LOG_LEVEL', 'debug');

        const { logger, obterOpcoesLogger } = await import('../../src/utils/logger.js');
        const opcoes = obterOpcoesLogger();

        expect(opcoes.transport).toEqual({
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname,req,res',
            },
        });
        expect(opcoes.level).toBe('debug');
        expect(logger.level).toBe('debug');
    });

    test('redact: log de req.headers.authorization sai com [Redacted]', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        const { criarLogger } = await import('../../src/utils/logger.js');

        const chunks: string[] = [];
        const destino = {
            write(chunk: string) {
                chunks.push(chunk);
                return true;
            },
        };

        const testLogger = criarLogger({ level: 'info' }, destino as any);
        testLogger.info({ req: { headers: { authorization: 'Bearer token-secreto-123' } } }, 'teste redact');

        const saida = chunks.join('');
        expect(saida).toContain('"authorization":"[Redacted]"');
        expect(saida).not.toContain('token-secreto-123');
    });
});
