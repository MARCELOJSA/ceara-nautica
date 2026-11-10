import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingContact, MobileBarSpacer } from './FloatingContact';
import { CookieBanner } from '@/components/consent/CookieBanner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Placeholder enquanto o chunk da página carrega. Ocupa a altura da tela para o
 * rodapé ficar fora da área visível: quando a página entra, nada visível é
 * empurrado (QA-06 — CLS de 0,19–0,36 no desktop com `min-h-[60vh]`).
 */
export function PageFallback() {
  return (
    <div
      className="container-x flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <span className="eyebrow text-steel">Carregando…</span>
    </div>
  );
}

export function Layout() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only-focusable top-3 left-3 z-[60] rounded-sm bg-graphite-deep px-4 py-3 text-sm font-semibold text-white"
      >
        Pular para o conteúdo
      </a>
      <ScrollToTop />
      <Header />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileBarSpacer />
      <FloatingContact />
      <CookieBanner />
    </>
  );
}
