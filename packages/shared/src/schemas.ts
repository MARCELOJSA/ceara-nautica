import { z } from 'zod';
import { CATEGORY_SLUGS } from './categories';

/** Telefone brasileiro: aceita (92) 99999-9999, 92999999999, +55 92 99999-9999 etc. */
const phoneRegex = /^(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}$/;

const trimmed = (min: number, max: number, msg: string) =>
  z.string({ required_error: msg }).trim().min(min, msg).max(max, `Máximo de ${max} caracteres.`);

export const utmSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    gclid: z.string().max(500).optional(),
    fbclid: z.string().max(500).optional(),
    landing_page: z.string().max(500).optional(),
    referrer: z.string().max(500).optional(),
  })
  .partial()
  .optional();

const baseLead = {
  name: trimmed(2, 120, 'Informe seu nome.'),
  phone: z
    .string({ required_error: 'Informe seu telefone/WhatsApp.' })
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
    errorMap: () => ({ message: 'É necessário autorizar o contato para enviar.' }),
  }),
  /** Honeypot anti-spam: deve vir vazio */
  website: z.string().max(0).optional(),
  utm: utmSchema,
};

export const contactSchema = z.object({
  ...baseLead,
  subject: trimmed(2, 120, 'Informe o assunto.'),
  message: trimmed(10, 2000, 'A mensagem deve ter pelo menos 10 caracteres.'),
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
  requestType: z
    .enum(REQUEST_TYPE_VALUES, { errorMap: () => ({ message: 'Tipo de solicitação inválido.' }) })
    .optional(),
  category: z
    .enum(CATEGORY_SLUGS, { errorMap: () => ({ message: 'Categoria inválida.' }) })
    .optional(),
  productSlug: z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Produto inválido.')
    .optional(),
  city: z.string().trim().max(120).optional(),
  message: trimmed(10, 2000, 'Descreva o que você precisa (mín. 10 caracteres).'),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteData = z.output<typeof quoteSchema>;
export type UtmData = z.output<typeof utmSchema>;
