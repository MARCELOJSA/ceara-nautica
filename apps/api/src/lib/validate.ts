import type { ZodError, ZodTypeAny, z } from 'zod';
import { HttpError } from './http-error.js';

/** Converte um ZodError em `{ campo: [mensagens] }` (campos aninhados com ponto: utm.utm_source). */
export function zodDetails(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_';
    (details[key] ??= []).push(issue.message);
  }
  return details;
}

export function parseOr400<S extends ZodTypeAny>(
  schema: S,
  input: unknown,
  message = 'Dados inválidos.',
): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, message, zodDetails(result.error));
  return result.data as z.output<S>;
}
