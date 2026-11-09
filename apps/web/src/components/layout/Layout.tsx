import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingContact } from './FloatingContact';
import { CookieBanner } from '@/components/consent/CookieBanner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function PageFallback() {
  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
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
      <FloatingContact />
      <CookieBanner />
    </>
  );
}
