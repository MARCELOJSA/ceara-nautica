import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Instagram, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { NAV_LINKS } from '@/data/content';
import { site } from '@/config/site';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';
import { track } from '@/lib/analytics';

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const close = useCallback(() => setOpen(false), []);

  useFocusTrap(panelRef, open, close);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm transition-[border-color,box-shadow] duration-200 supports-[backdrop-filter]:bg-white/85 ${
        scrolled ? 'border-steel-light shadow-[0_1px_0_rgba(23,25,28,0.04)]' : 'border-transparent'
      }`}
    >
      <div className="container-x flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
        <Link to="/" className="-ml-1 inline-flex min-h-11 items-center rounded-sm px-1" aria-label="Ceará Náutica — página inicial">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `relative inline-flex min-h-11 items-center px-3.5 font-display text-[1.0625rem] font-semibold tracking-[0.06em] uppercase transition-colors after:absolute after:inset-x-3.5 after:bottom-2 after:h-0.5 after:origin-left after:bg-orange after:transition-transform after:duration-200 ${
                      isActive
                        ? 'text-graphite-deep after:scale-x-100'
                        : 'text-steel after:scale-x-0 hover:text-graphite-deep hover:after:scale-x-100'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/orcamento" className="btn-primary hidden sm:inline-flex">
            Solicitar orçamento
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-sm text-graphite-deep hover:bg-steel-light/60 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen(true)}
          >
            <Menu aria-hidden="true" className="size-6" />
            <span className="sr-only">Abrir menu</span>
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-graphite-deep/60 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={close}
          aria-hidden="true"
        />
        <div
          id="menu-mobile"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          hidden={!open}
          className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col bg-graphite-deep text-white shadow-2xl"
        >
          <div className="flex h-[68px] items-center justify-between border-b border-white/10 px-5">
            <span className="eyebrow text-white/70">Menu</span>
            <button
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-white/10"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">Fechar menu</span>
            </button>
          </div>
          <nav aria-label="Menu mobile" className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="divide-y divide-white/10">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `flex min-h-14 items-center justify-between font-display text-2xl font-semibold tracking-[0.04em] uppercase ${
                        isActive ? 'text-orange' : 'text-white hover:text-orange'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3 border-t border-white/10 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Link to="/orcamento" className="btn-primary w-full">
              Solicitar orçamento
            </Link>
            <WhatsAppCta
              location="menu_mobile"
              className="btn-outline-light w-full"
              fallbackTo="/contato"
              fallbackLabel="Fale com a equipe"
            />
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('instagram_click', { location: 'menu_mobile' })}
              className="flex min-h-11 items-center justify-center gap-2 text-sm text-white/75 hover:text-white"
            >
              <Instagram aria-hidden="true" className="size-4" /> {site.instagramHandle}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
