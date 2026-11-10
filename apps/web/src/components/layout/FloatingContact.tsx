import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, Instagram, MessageCircle } from 'lucide-react';
import { site } from '@/config/site';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

/**
 * Atalhos de contato sempre à mão.
 * - Celular/tablet: barra fixa inferior compacta (respeita a safe-area) com
 *   "Pedir orçamento" + "Instagram" (ou "WhatsApp", se houver número).
 * - Desktop: botão flutuante discreto "Orçamento" (ou "WhatsApp").
 * Sem número de WhatsApp, nada usa ícone de balão de conversa.
 */
export function FloatingContact({ number = site.whatsappNumber }: { number?: string }) {
  const { pathname } = useLocation();
  const wa = buildWhatsAppUrl(number, DEFAULT_WHATSAPP_MESSAGE);
  const onQuote = pathname.startsWith('/orcamento');
  const primary = onQuote
    ? { to: '/contato', label: 'Contato' }
    : { to: '/orcamento', label: 'Pedir orçamento' };

  const desktopBase =
    'fixed right-6 bottom-6 z-30 hidden min-h-12 items-center gap-2 rounded-full bg-graphite-deep px-5 font-display text-base font-semibold tracking-[0.06em] text-white uppercase shadow-[0_6px_20px_rgba(23,25,28,0.22)] transition-colors hover:bg-graphite lg:inline-flex';

  return (
    <>
      <nav
        aria-label="Atalhos de contato"
        data-testid="mobile-contact-bar"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-graphite-deep px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="mx-auto flex max-w-xl gap-2">
          <Link
            to={primary.to}
            className="btn-primary min-h-12 flex-1 px-3"
            data-testid="floating-contact"
          >
            <ClipboardList aria-hidden="true" className="size-5" /> {primary.label}
          </Link>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { location: 'barra_mobile' })}
              className="btn-outline-light min-h-12 flex-1 px-3"
              data-testid="mobile-bar-secondary"
            >
              <MessageCircle aria-hidden="true" className="size-5" /> WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : (
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('instagram_click', { location: 'barra_mobile' })}
              className="btn-outline-light min-h-12 flex-1 px-3"
              data-testid="mobile-bar-secondary"
            >
              <Instagram aria-hidden="true" className="size-5" /> Instagram
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          )}
        </div>
      </nav>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={desktopBase}
          data-testid="floating-desktop"
          onClick={() => track('whatsapp_click', { location: 'flutuante' })}
        >
          <MessageCircle aria-hidden="true" className="size-5" /> WhatsApp
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : (
        !onQuote && (
          <Link to="/orcamento" className={desktopBase} data-testid="floating-desktop">
            <ClipboardList aria-hidden="true" className="size-5 text-orange" /> Orçamento
          </Link>
        )
      )}
    </>
  );
}

/** Espaço no fim da página para a barra inferior (celular) não cobrir conteúdo. */
export function MobileBarSpacer() {
  return (
    <div
      aria-hidden="true"
      className="h-[calc(4rem+env(safe-area-inset-bottom))] bg-graphite-deep lg:hidden"
    />
  );
}
