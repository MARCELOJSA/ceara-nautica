import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONSENT_EVENT, OPEN_PREFERENCES_EVENT, readConsent, saveConsent } from '@/lib/consent';
import { applyConsent } from '@/lib/analytics';

/**
 * Banner de cookies (LGPD): aceitar, recusar ou escolher por categoria.
 * Nada de medição/marketing é carregado antes da escolha.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(() => readConsent() === null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const saved = readConsent();
  const [analytics, setAnalytics] = useState(saved?.analytics ?? false);
  const [marketing, setMarketing] = useState(saved?.marketing ?? false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const open = () => {
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
      setPrefsOpen(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  useEffect(() => {
    const onChange = () => setVisible(false);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!visible) return null;

  const decide = (choice: { analytics: boolean; marketing: boolean }) => {
    const state = saveConsent(choice);
    applyConsent(state);
    setPrefsOpen(false);
    setVisible(false);
  };

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-x-0 bottom-0 z-[45] max-h-[85svh] overflow-y-auto border-t border-white/10 bg-graphite-deep text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
      data-testid="cookie-banner"
    >
      <div className="container-x pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:py-5 lg:py-6">
        <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-3xl">
            <h2 id={titleId} className="eyebrow sr-only text-orange sm:not-sr-only">
              Privacidade e cookies
            </h2>
            <p
              id={descId}
              className="text-[0.8125rem] leading-snug text-white/80 sm:mt-2 sm:text-sm sm:leading-relaxed"
            >
              <span className="sm:hidden">
                Usamos cookies de medição e marketing só com a sua autorização.{' '}
              </span>
              <span className="hidden sm:inline">
                Usamos cookies essenciais para o site funcionar. Com a sua autorização, também
                usamos cookies de medição e de marketing para entender o uso do site e melhorar
                nossas campanhas. Você pode mudar a escolha a qualquer momento.{' '}
              </span>
              Saiba mais na{' '}
              <Link
                to="/politica-de-privacidade"
                className="text-white underline decoration-orange underline-offset-4"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
          {!prefsOpen && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:flex-nowrap">
              <button
                type="button"
                className="btn-outline-light order-3 col-span-2 min-h-11 border-transparent text-sm text-white/80 underline decoration-white/40 underline-offset-4 sm:order-none sm:col-span-1 sm:border-white/40 sm:text-[1.0625rem] sm:no-underline"
                onClick={() => setPrefsOpen(true)}
              >
                Preferências
              </button>
              <button
                type="button"
                className="btn-outline-light px-3"
                onClick={() => decide({ analytics: false, marketing: false })}
              >
                Recusar
              </button>
              <button
                type="button"
                className="btn-primary px-3"
                onClick={() => decide({ analytics: true, marketing: true })}
              >
                Aceitar todos
              </button>
            </div>
          )}
        </div>

        {prefsOpen && (
          <form
            className="mt-5 border-t border-white/10 pt-5"
            onSubmit={(e) => {
              e.preventDefault();
              decide({ analytics, marketing });
            }}
          >
            <fieldset>
              <legend className="sr-only">Categorias de cookies</legend>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex gap-3 rounded-sm border border-white/10 p-4">
                  <input type="checkbox" checked disabled className="mt-1 size-5 accent-orange" />
                  <span>
                    <span className="block text-sm font-semibold text-white">Essenciais</span>
                    <span className="block text-xs text-white/70">
                      Sempre ativos. Guardam sua escolha de cookies e a origem da visita para os
                      formulários.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-sm border border-white/10 p-4 hover:border-white/30">
                  <input
                    type="checkbox"
                    name="analytics"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-1 size-5 accent-orange"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">Medição</span>
                    <span className="block text-xs text-white/70">
                      Estatísticas de uso (ex.: Google Analytics), de forma agregada.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-sm border border-white/10 p-4 hover:border-white/30">
                  <input
                    type="checkbox"
                    name="marketing"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-1 size-5 accent-orange"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">Marketing</span>
                    <span className="block text-xs text-white/70">
                      Medição de anúncios (ex.: Meta Pixel, Google Ads).
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-outline-light"
                onClick={() => decide({ analytics: false, marketing: false })}
              >
                Recusar todos
              </button>
              <button type="submit" className="btn-primary">
                Salvar preferências
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
