import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { track } from '@/lib/analytics';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/whatsapp';
import { site } from '@/config/site';

interface Props {
  message?: string;
  /** contexto para analytics (ex.: "header", "produto") */
  location: string;
  productSlug?: string;
  className?: string;
  /** rótulo quando há número (abre o WhatsApp) */
  label?: ReactNode;
  /** rótulo quando NÃO há número (leva para uma página do site) */
  fallbackLabel?: ReactNode;
  /** destino quando não há número configurado */
  fallbackTo?: string;
  /** permite injetar o número (testes) */
  number?: string;
  icon?: boolean;
}

/**
 * CTA de conversa: com número configurado abre o WhatsApp com mensagem pré-preenchida;
 * sem número, leva para /orcamento ou /contato — nunca promete um número inexistente.
 */
export function WhatsAppCta({
  message = DEFAULT_WHATSAPP_MESSAGE,
  location,
  productSlug,
  className = 'btn-dark',
  label = 'Falar no WhatsApp',
  fallbackLabel = 'Fale com a equipe',
  fallbackTo = '/contato',
  number = site.whatsappNumber,
  icon = true,
}: Props) {
  const url = buildWhatsAppUrl(number, message);

  if (!url) {
    return (
      <Link to={fallbackTo} className={className} data-cta="contact-fallback">
        {icon && <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.75} />}
        {fallbackLabel}
      </Link>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-cta="whatsapp"
      onClick={() => track('whatsapp_click', { location, product_slug: productSlug })}
    >
      {icon && <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.75} />}
      {label}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}
