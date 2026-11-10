import { z } from 'zod';
import { CATEGORY_SLUGS } from './categories';

/**
 * Telefone brasileiro com DDD. Aceita os jeitos comuns de digitar:
 * (92) 99999-9999 · (92) 9 9999-9999 · 92 9 9999 9999 · 92999999999 · +55 (92) 99999-9999.
 * A validação conta os dígitos (10 ou 11, ou 12/13 com o 55), sem depender da pontuação.
 */
export const PHONE_EXAMPLE = '(92) 99999-9999';
const phoneChars = /^[\d\s()+.-]+$/;
export function phoneDigits(value: string): string {
  const d = value.replace(/\D/g, '');
  return d.length >= 12 && d.startsWith('55') ? d.slice(2) : d;
}
export function isValidPhone(value: string): boolean {
  if (!phoneChars.test(value)) return false;
  const d = phoneDigits(value);
  // DDD 11–99; celular (11 dígitos) começa com 9 depois do DDD; fixo (10 dígitos) com 2–5
  return /^[1-9][1-9](9\d{8}|[2-5]\d{7})$/.test(d);
}
export function phoneError(value: string): string | undefined {
  if (isValidPhone(value)) return undefined;
  const d = phoneDigits(value);
  const hasDdd = /^\s*(\+?\s*55\s*)?\(\s*\d{2}\s*\)/.test(value);
  if (!hasDdd && (d.length === 8 || d.length === 9)) return `Inclua o DDD. Ex.: ${PHONE_EXAMPLE}`;
  if (d.length < 10) return `Número incompleto. Ex.: ${PHONE_EXAMPLE}`;
  return `Telefone inválido. Ex.: ${PHONE_EXAMPLE}`;
}

/**
 * Caracteres proibidos em texto livre:
 * - U+0000: o PostgreSQL não aceita esse caractere em texto (SEC-01);
 * - demais controles C0/C1 (só a mensagem aceita quebra de linha e tab);
 * - controles de direção bidi (U+202A–U+202E, U+2066–U+2069), que disfarçam
 *   o texto exibido em e-mails e planilhas de leads (SEC-08).
 */
// eslint-disable-next-line no-control-regex -- a regra existe justamente para barrar controles
const UNSAFE_SINGLE_LINE = /[\u0000-\u001F\u007F-\u009F‪-‮⁦-⁩]/;
// eslint-disable-next-line no-control-regex -- idem, permitindo \t, \n e \r
const UNSAFE_MULTILINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/;

export const hasUnsafeChars = (s: string, multiline = false): boolean =>
  (multiline ? UNSAFE_MULTILINE : UNSAFE_SINGLE_LINE).test(s);

export const UNSAFE_CHARS_MSG = 'Contém caractere inválido.';

/**
 * Texto obrigatório com limites. `msg` aparece quando o campo está vazio;
 * `shortMsg`, quando foi preenchido mas é curto demais.
 */
const trimmed = (min: number, max: number, msg: string, multiline = false, shortMsg?: string) =>
  z
    .string({ error: msg })
    .trim()
    .min(1, { error: msg, abort: true })
    .min(min, shortMsg ?? msg)
    .max(max, `Máximo de ${max} caracteres.`)
    .refine((s) => !hasUnsafeChars(s, multiline), UNSAFE_CHARS_MSG);

const utmField = (max: number) =>
  z
    .string()
    .refine((s) => !hasUnsafeChars(s), UNSAFE_CHARS_MSG)
    .pipe(z.string().max(max, `Máximo de ${max} caracteres.`))
    .optional();

export const utmSchema = z
  .object({
    utm_source: utmField(200),
    utm_medium: utmField(200),
    utm_campaign: utmField(200),
    utm_term: utmField(200),
    utm_content: utmField(200),
    gclid: utmField(500),
    fbclid: utmField(500),
    landing_page: utmField(500),
    referrer: utmField(500),
  })
  .partial()
  .optional();

const baseLead = {
  name: trimmed(2, 120, 'Informe seu nome.', false, 'Nome muito curto.'),
  phone: z
    .string({ error: 'Informe seu telefone/WhatsApp.' })
    .trim()
    .min(1, { error: 'Informe seu telefone/WhatsApp.', abort: true })
    .max(30, `Telefone inválido. Ex.: ${PHONE_EXAMPLE}`)
    .superRefine((v, ctx) => {
      if (!v) return;
      const msg = phoneError(v);
      if (msg) ctx.addIssue({ code: 'custom', message: msg });
    }),
  email: z
    .string()
    .trim()
    .max(160, 'Máximo de 160 caracteres.')
    .email('E-mail inválido. Ex.: nome@provedor.com.br')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  /** Consentimento LGPD para contato — obrigatório */
  consent: z.literal(true, {
    error: 'É necessário autorizar o contato para enviar.',
  }),
  /** Honeypot anti-spam: deve vir vazio */
  website: z.string().max(0).optional(),
  utm: utmSchema,
};

export const contactSchema = z.object({
  ...baseLead,
  subject: trimmed(2, 120, 'Informe o assunto.', false, 'Assunto muito curto (mín. 2 caracteres).'),
  message: trimmed(10, 2000, 'A mensagem deve ter pelo menos 10 caracteres.', true),
});

/** Tipo de solicitação do orçamento (campo opcional do formulário) */
export const REQUEST_TYPES = [
  { value: 'nova-embarcacao', label: 'Nova embarcação' },
  { value: 'reparo', label: 'Reparo' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'motor', label: 'Motor de popa' },
  { value: 'estofamento', label: 'Estofamento' },
  { value: 'outro', label: 'Outro' },
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number]['value'];
const REQUEST_TYPE_VALUES = REQUEST_TYPES.map((r) => r.value) as [RequestType, ...RequestType[]];

export const quoteSchema = z.object({
  ...baseLead,
  requestType: z.enum(REQUEST_TYPE_VALUES, { error: 'Tipo de solicitação inválido.' }).optional(),
  category: z.enum(CATEGORY_SLUGS, { error: 'Categoria inválida.' }).optional(),
  productSlug: z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Produto inválido.')
    .optional(),
  city: z
    .string()
    .trim()
    .max(120, 'Máximo de 120 caracteres.')
    .refine((s) => !hasUnsafeChars(s), UNSAFE_CHARS_MSG)
    .optional(),
  message: trimmed(10, 2000, 'Descreva o que você precisa (mín. 10 caracteres).', true),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteData = z.output<typeof quoteSchema>;
export type UtmData = z.output<typeof utmSchema>;
