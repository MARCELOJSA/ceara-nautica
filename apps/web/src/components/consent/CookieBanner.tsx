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
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-white/10 bg-graphite-deep text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="container-x py-5 lg:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-3xl">
            <h2 id={titleId} className="eyebrow text-orange">
              Privacidade e cookies
            </h2>
            <p id={descId} className="mt-2 text-sm leading-relaxed text-white/80">
              Usamos cookies essenciais para o site funcionar. Com a sua autorização, também usamos
              cookies de medição e de marketing para entender o uso do site e melhorar nossas
              campanhas. Você pode mudar a escolha a qualquer momento. Saiba mais na{' '}
              <Link to="/politica-de-privacidade" className="text-white underline decoration-orange underline-offset-4">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
          {!prefsOpen && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap">
              <button type="button" className="btn-outline-light" onClick={() => setPrefsOpen(true)}>
                Preferências
              </button>
              <button type="button" className="btn-outline-light" onClick={() => decide({ analytics: false, marketing: false })}>
                Recusar
              </button>
              <button type="button" className="btn-primary" onClick={() => decide({ analytics: true, marketing: true })}>
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
                      Sempre ativos. Guardam sua escolha de cookies e a origem da visita para os formulários.
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
              <button type="button" className="btn-outline-light" onClick={() => decide({ analytics: false, marketing: false })}>
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
