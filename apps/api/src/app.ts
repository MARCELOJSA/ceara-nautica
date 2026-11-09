import express, { type ErrorRequestHandler, type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { pino, type Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { PrismaClient } from '@prisma/client';
import type { ApiError } from '@cn/shared';
import type { AppConfig } from './config.js';
import { HttpError } from './lib/http-error.js';
import { createLeadNotifier, type LeadNotifier } from './lib/notify.js';
import { healthRouter } from './routes/health.js';
import { catalogRouter } from './routes/catalog.js';
import { leadsRouter } from './routes/leads.js';

export const BODY_LIMIT = '20kb';

export type AppDeps = {
  config: AppConfig;
  prisma: PrismaClient;
  logger?: Logger;
  /** Sobrescreve o notificador de leads (útil em testes). */
  notify?: LeadNotifier;
};

export function createLogger(level: string): Logger {
  return pino({
    level,
    // Nunca registrar credenciais/cookies nem corpo das requisições (dados pessoais).
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });
}

export function createApp({ config, prisma, logger, notify }: AppDeps): Express {
  const log = logger ?? createLogger(config.logLevel);
  const notifier = notify ?? createLeadNotifier(config.leadWebhook, log);
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    pinoHttp({
      logger: log,
      // Log enxuto: sem IP, headers ou body (LGPD).
      serializers: {
        req: (req: { method: string; url: string }) => ({
          method: req.method,
          url: req.url.split('?')[0],
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  const allowed = new Set(config.webOrigins);
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowed.has(origin)),
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
      maxAge: 600,
    }),
  );

  const rateLimiter: RequestHandler = config.rateLimit.disabled
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: config.rateLimit.windowMs,
        limit: config.rateLimit.max,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: (_req, res) => {
          const body: ApiError = {
            error: 'Muitas requisições. Aguarde um instante e tente novamente.',
          };
          res.status(429).json(body);
        },
      });

  // Rate limit ANTES do parser de body: JSON malformado ou grande demais também conta.
  app.post(['/api/contact', '/api/quotes'], rateLimiter);

  app.use(express.json({ limit: BODY_LIMIT, strict: true }));

  const api = express.Router();
  api.use(healthRouter(prisma));
  api.use(catalogRouter(prisma));
  api.use(leadsRouter({ prisma, ipHashSalt: config.ipHashSalt, notify: notifier }));
  app.use('/api', api);

  // 404 JSON para qualquer rota desconhecida
  app.use((_req, res) => {
    const body: ApiError = { error: 'Rota não encontrada.' };
    res.status(404).json(body);
  });

  // Handler central de erros (Express 5 encaminha rejeições de handlers async)
  const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
    if (res.headersSent) {
      req.log?.error({ err }, 'erro após envio dos headers');
      res.end();
      return;
    }
    if (err instanceof HttpError) {
      const body: ApiError = { error: err.message };
      if (err.details) body.details = err.details;
      res.status(err.status).json(body);
      return;
    }
    const type = (err as { type?: string } | null)?.type;
    if (type === 'entity.too.large') {
      res.status(413).json({ error: 'Conteúdo da requisição muito grande.' } satisfies ApiError);
      return;
    }
    if (type === 'entity.parse.failed') {
      res.status(400).json({ error: 'JSON malformado.' } satisfies ApiError);
      return;
    }
    const status = (err as { status?: number } | null)?.status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      res.status(status).json({ error: 'Requisição inválida.' } satisfies ApiError);
      return;
    }
    req.log?.error({ err }, 'erro não tratado');
    const message =
      !config.isProduction && err instanceof Error
        ? `Erro interno do servidor: ${err.message}`
        : 'Erro interno do servidor.';
    res.status(500).json({ error: message } satisfies ApiError);
  };
  app.use(errorHandler);

  return app;
}
