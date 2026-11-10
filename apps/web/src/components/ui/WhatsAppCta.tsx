import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';
import { track } from '@/lib/analytics';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/whatsapp';
import { site } from '@/config/site';

interface LinkFallback {
  to: string;
  label: ReactNode;
  icon?: ReactNode;
}

interface Props {
  message?: string;
  /** contexto para analytics (ex.: "header", "produto") */
  location: string;
  productSlug?: string;
  className?: string;
  /** rótulo quando há número (abre o WhatsApp) */
  label?: ReactNode;
  /**
   * Sem número configurado:
   * - "instagram" (padrão): canal de conversa real — direct do Instagram;
   * - objeto: link interno com rótulo honesto (ex.: "Pedir orçamento").
   * Nunca usa ícone de balão de conversa levando a formulário.
   */
  fallback?: 'instagram' | LinkFallback;
  instagramLabel?: ReactNode;
  /** permite injetar o número (testes) */
  number?: string;
  icon?: boolean;
}

/** CTA de conversa: WhatsApp quando houver número; senão Instagram ou link interno. */
export function WhatsAppCta({
  message = DEFAULT_WHATSAPP_MESSAGE,
  location,
  productSlug,
  className = 'btn-dark',
  label = 'Falar no WhatsApp',
  fallback = 'instagram',
  instagramLabel = 'Perguntar no Instagram',
  number = site.whatsappNumber,
  icon = true,
}: Props) {
  const url = buildWhatsAppUrl(number, message);

  if (url) {
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

  if (fallback === 'instagram') {
    return (
      <a
        href={site.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-cta="instagram"
        onClick={() => track('instagram_click', { location, product_slug: productSlug })}
      >
        {icon && <Instagram aria-hidden="true" className="size-5" strokeWidth={1.75} />}
        {instagramLabel}
        <span className="sr-only"> (abre o Instagram em nova aba)</span>
      </a>
    );
  }

  return (
    <Link to={fallback.to} className={className} data-cta="link-fallback">
      {icon && fallback.icon}
      {fallback.label}
    </Link>
  );
}
