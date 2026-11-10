import { z } from 'zod';
import { CATEGORY_SLUGS } from './categories';

/** Telefone brasileiro: aceita (92) 99999-9999, 92999999999, +55 92 99999-9999 etc. */
const phoneRegex = /^(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}$/;

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

const trimmed = (min: number, max: number, msg: string, multiline = false) =>
  z
    .string({ error: msg })
    .trim()
    .min(min, msg)
    .max(max, `Máximo de ${max} caracteres.`)
    .refine((s) => !hasUnsafeChars(s, multiline), UNSAFE_CHARS_MSG);

const utmField = (max: number) =>
  z
    .string()
    .refine((s) => !hasUnsafeChars(s), UNSAFE_CHARS_MSG)
    .pipe(z.string().max(max))
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
  name: trimmed(2, 120, 'Informe seu nome.'),
  phone: z
    .string({ error: 'Informe seu telefone/WhatsApp.' })
    .trim()
    .regex(phoneRegex, 'Telefone inválido. Ex.: (92) 99999-9999'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .max(160)
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
  subject: trimmed(2, 120, 'Informe o assunto.'),
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
    .max(120)
    .refine((s) => !hasUnsafeChars(s), UNSAFE_CHARS_MSG)
    .optional(),
  message: trimmed(10, 2000, 'Descreva o que você precisa (mín. 10 caracteres).', true),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteData = z.output<typeof quoteSchema>;
export type UtmData = z.output<typeof utmSchema>;
