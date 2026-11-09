import 'dotenv/config';
import { z } from 'zod';

const DEFAULT_ORIGINS = 'http://localhost:5173,http://localhost:4173';

const boolish = z
  .string()
  .optional()
  .transform((v) => ['1', 'true', 'yes', 'on'].includes((v ?? '').trim().toLowerCase()));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  WEB_ORIGIN: z
    .string()
    .optional()
    .transform((v) =>
      (v && v.trim() ? v : DEFAULT_ORIGINS)
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean),
    ),
  TRUST_PROXY: z.string().optional().default('0'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_DISABLED: boolish,
  IP_HASH_SALT: z.string().optional().default(''),
  LEAD_WEBHOOK_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .pipe(z.string().url('LEAD_WEBHOOK_URL inválida').optional()),
  LEAD_WEBHOOK_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  isProduction: boolean;
  port: number;
  databaseUrl: string;
  webOrigins: string[];
  /** Valor repassado a app.set('trust proxy', ...) */
  trustProxy: boolean | number | string;
  rateLimit: { windowMs: number; max: number; disabled: boolean };
  ipHashSalt: string;
  leadWebhook: { url?: string; timeoutMs: number };
  logLevel: string;
};

function parseTrustProxy(raw: string): boolean | number | string {
  const v = raw.trim().toLowerCase();
  if (v === '' || v === '0' || v === 'false') return false;
  if (v === 'true') return true;
  if (/^\d+$/.test(v)) return Number(v);
  return raw.trim(); // lista de IPs/sub-redes ou 'loopback', 'uniquelocal'...
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuração inválida: ${msg}`);
  }
  const e = parsed.data;
  const isProduction = e.NODE_ENV === 'production';
  if (isProduction && (!e.IP_HASH_SALT || e.IP_HASH_SALT === 'troque-este-valor')) {
    throw new Error('IP_HASH_SALT precisa ser definido com um valor aleatório em produção.');
  }
  return {
    nodeEnv: e.NODE_ENV,
    isProduction,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    webOrigins: e.WEB_ORIGIN,
    trustProxy: parseTrustProxy(e.TRUST_PROXY),
    rateLimit: {
      windowMs: e.RATE_LIMIT_WINDOW_MS,
      max: e.RATE_LIMIT_MAX,
      disabled: e.RATE_LIMIT_DISABLED,
    },
    ipHashSalt: e.IP_HASH_SALT,
    leadWebhook: { url: e.LEAD_WEBHOOK_URL, timeoutMs: e.LEAD_WEBHOOK_TIMEOUT_MS },
    logLevel: e.LOG_LEVEL ?? (e.NODE_ENV === 'test' ? 'silent' : 'info'),
  };
}
