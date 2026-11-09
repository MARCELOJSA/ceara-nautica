import { site } from '@/config/site';

export const DEFAULT_WHATSAPP_MESSAGE =
  'Olá, Ceará Náutica! Vim pelo site e gostaria de mais informações.';

export function productWhatsAppMessage(productName: string): string {
  return `Olá, Ceará Náutica! Vim pelo site e tenho interesse em: ${productName}. Poderiam me passar mais informações?`;
}

/**
 * Monta o link wa.me. Retorna null quando não há número configurado —
 * nesse caso a UI deve levar o usuário para /orcamento ou /contato.
 */
export function buildWhatsAppUrl(
  number: string | undefined,
  message: string = DEFAULT_WHATSAPP_MESSAGE,
): string | null {
  const digits = (number ?? '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function whatsappUrl(message?: string): string | null {
  return buildWhatsAppUrl(site.whatsappNumber, message);
}
