import { phoneDigits } from '@cn/shared';

/** Formata o telefone informado para a pessoa conferir: (92) 99999-0000. */
export function formatPhone(value: string): string {
  const d = phoneDigits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value.trim();
}
