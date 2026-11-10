import { DEMO_PRODUCTS } from '@cn/shared';
import { loadConfig, type AppConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { createPrisma } from '../src/lib/prisma.js';
import { resolveTestDatabaseUrl } from '../scripts/test-db.js';
import type { LeadNotifier } from '../src/lib/notify.js';

export const testDatabaseUrl = resolveTestDatabaseUrl();

/** Prisma apontado SEMPRE para o banco de testes. */
export const prisma = createPrisma(testDatabaseUrl);

export function testConfig(env: Record<string, string> = {}): AppConfig {
  return loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: testDatabaseUrl,
    RATE_LIMIT_DISABLED: 'true',
    IP_HASH_SALT: 'salt-de-teste',
    LEAD_WEBHOOK_URL: '',
    WEB_ORIGIN: 'http://localhost:5173,http://localhost:4173',
    TRUST_PROXY: '0',
    ...env,
  });
}

/** Variáveis mínimas para um app em modo produção nos testes (SEC-07 exige todas). */
export const PROD_ENV = {
  NODE_ENV: 'production',
  IP_HASH_SALT: 'salt-forte-de-teste-0123456789',
  RATE_LIMIT_DISABLED: 'false',
  RATE_LIMIT_MAX: '1000',
};

export function makeApp(env: Record<string, string> = {}, notify?: LeadNotifier) {
  return createApp({ config: testConfig(env), prisma, notify });
}

export const validContact = {
  name: 'Maria Teste',
  phone: '(92) 99999-9999',
  email: 'maria@example.com',
  subject: 'Dúvida sobre lanchas',
  message: 'Gostaria de saber mais sobre as lanchas em alumínio.',
  consent: true,
  website: '',
  utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'teste', gclid: 'abc123' },
};

const quoteProduct = DEMO_PRODUCTS[0]!;

export const validQuote = {
  name: 'João Teste',
  phone: '92999999999',
  email: '',
  category: quoteProduct.category,
  productSlug: quoteProduct.slug,
  city: 'Manaus',
  message: 'Quero um orçamento para uma lancha de 6 metros.',
  consent: true,
  utm: { utm_source: 'instagram', landing_page: `/produtos/${quoteProduct.slug}` },
};
