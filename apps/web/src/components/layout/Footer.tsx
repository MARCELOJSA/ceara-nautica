import { Link } from 'react-router-dom';
import { Clock, Instagram, Mail, MapPin } from 'lucide-react';
import { CATEGORIES } from '@cn/shared';
import { Logo } from '@/components/brand/Logo';
import { NAV_LINKS } from '@/data/content';
import { mapUrlFor, site } from '@/config/site';
import { openCookiePreferences } from '@/lib/consent';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';
import { track } from '@/lib/analytics';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-graphite-deep text-white/75">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10 lg:py-20">
        <div className="max-w-sm">
          <Link
            to="/"
            className="inline-flex rounded-sm"
            aria-label="Ceará Náutica — página inicial"
          >
            <Logo tone="dark" />
          </Link>
          <p className="mt-5 text-sm leading-relaxed">
            Náutica e estaleiro em Manaus – AM. Fabricação de embarcações em alumínio com projeto
            personalizado, reparos, manutenção, motores de popa e estofamento náutico.
          </p>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('instagram_click', { location: 'footer' })}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm border border-white/15 px-4 text-sm font-medium text-white hover:border-orange hover:text-orange"
          >
            <Instagram aria-hidden="true" className="size-4" />
            {site.instagramHandle}
            <span className="sr-only"> no Instagram (abre em nova aba)</span>
          </a>
        </div>

        <nav aria-label="Rodapé — site">
          <h2 className="eyebrow text-white">Navegação</h2>
          <ul className="mt-4 space-y-1">
            {[...NAV_LINKS, { to: '/orcamento', label: 'Orçamento' }].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="inline-flex min-h-10 items-center text-sm hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Rodapé — embarcações">
          <h2 className="eyebrow text-white">Embarcações</h2>
          <ul className="mt-4 space-y-1">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/produtos?categoria=${c.slug}`}
                  className="inline-flex min-h-10 items-center text-sm hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-white">Atendimento</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-orange" />
              {site.address ? (
                <a
                  href={mapUrlFor(site.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {site.address}
                  <span className="sr-only"> (abre o mapa em nova aba)</span>
                </a>
              ) : (
                <span>{site.locationLabel}</span>
              )}
            </li>
            {site.businessHours && (
              <li className="flex gap-3">
                <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-orange" />
                <span>{site.businessHours}</span>
              </li>
            )}
            {site.email && (
              <li className="flex gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-orange" />
                <a href={`mailto:${site.email}`} className="break-all hover:text-white">
                  {site.email}
                </a>
              </li>
            )}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link to="/orcamento" className="btn-primary">
              Solicitar orçamento
            </Link>
            <WhatsAppCta
              location="footer"
              className="btn-outline-light"
              instagramLabel="Mensagem no Instagram"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-white/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name} — {site.tagline}. {site.locationLabel}.
          </p>
          <p className="text-white/70">Fotos do site meramente ilustrativas (banco de imagens).</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link
              to="/politica-de-privacidade"
              className="inline-flex min-h-10 items-center hover:text-white"
            >
              Política de Privacidade
            </Link>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="inline-flex min-h-10 items-center hover:text-white"
            >
              Preferências de cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
