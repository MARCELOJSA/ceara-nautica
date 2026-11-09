import { createHash } from 'node:crypto';
import type { Request } from 'express';
import type { UtmData } from '@cn/shared';

const USER_AGENT_MAX = 300;

export function hashIp(ip: string | undefined, salt: string): string | null {
  if (!ip) return null;
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export function truncateUserAgent(ua: string | undefined): string | null {
  if (!ua) return null;
  return ua.slice(0, USER_AGENT_MAX);
}

/** Colunas de rastreamento (UTM etc.) no formato do Prisma. */
export function utmColumns(utm: UtmData) {
  return {
    utmSource: utm?.utm_source ?? null,
    utmMedium: utm?.utm_medium ?? null,
    utmCampaign: utm?.utm_campaign ?? null,
    utmTerm: utm?.utm_term ?? null,
    utmContent: utm?.utm_content ?? null,
    gclid: utm?.gclid ?? null,
    fbclid: utm?.fbclid ?? null,
    landingPage: utm?.landing_page ?? null,
    referrer: utm?.referrer ?? null,
  };
}

export function requestMeta(req: Request, salt: string) {
  return {
    ipHash: hashIp(req.ip, salt),
    userAgent: truncateUserAgent(req.get('user-agent')),
  };
}

/**
 * Indica se o honeypot `website` foi preenchido (bot). Verificado ANTES da
 * validação Zod para que o bot receba um 201 indistinguível do sucesso.
 */
export function isHoneypotFilled(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const website = (body as Record<string, unknown>).website;
  if (website === undefined || website === null) return false;
  return typeof website !== 'string' || website.length > 0;
}
