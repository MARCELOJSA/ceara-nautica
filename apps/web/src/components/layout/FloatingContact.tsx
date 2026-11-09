import { Link, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { site } from '@/config/site';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

/**
 * Botão flutuante de conversa.
 * - Com VITE_WHATSAPP_NUMBER: abre o WhatsApp com mensagem pré-preenchida.
 * - Sem número: leva para /orcamento (ou /contato quando já se está no orçamento).
 */
export function FloatingContact({ number = site.whatsappNumber }: { number?: string }) {
  const { pathname } = useLocation();
  const url = buildWhatsAppUrl(number, DEFAULT_WHATSAPP_MESSAGE);
  const base =
    'fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 inline-flex size-14 items-center justify-center rounded-full bg-orange text-graphite-deep shadow-[0_6px_20px_rgba(23,25,28,0.25)] transition-colors hover:bg-orange-hover sm:right-6 sm:bottom-6';

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        data-testid="floating-contact"
        onClick={() => track('whatsapp_click', { location: 'floating' })}
      >
        <MessageCircle aria-hidden="true" className="size-7" strokeWidth={1.75} />
        <span className="sr-only">Conversar no WhatsApp (abre em nova aba)</span>
      </a>
    );
  }

  if (pathname.startsWith('/orcamento') || pathname.startsWith('/contato')) return null;

  return (
    <Link to="/orcamento" className={base} data-testid="floating-contact">
      <MessageCircle aria-hidden="true" className="size-7" strokeWidth={1.75} />
      <span className="sr-only">Fale com a equipe — solicitar orçamento</span>
    </Link>
  );
}
