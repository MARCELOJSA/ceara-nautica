import { describe, expect, it, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieBanner } from './CookieBanner';
import { CONSENT_KEY, openCookiePreferences, readConsent } from '@/lib/consent';
import { __resetAnalyticsForTests, initAnalytics, track } from '@/lib/analytics';
import { renderAt } from '@/test/utils';

type ConsentCall = { 0: string; 1: string; 2: Record<string, string> };
const consentCalls = () =>
  (window.dataLayer as unknown as ConsentCall[]).filter((e) => e && e[0] === 'consent');

describe('Banner de cookies (LGPD) e Consent Mode', () => {
  beforeEach(() => {
    window.dataLayer = [];
    delete window.gtag;
    __resetAnalyticsForTests();
    document.head.querySelectorAll('script[id^="cn-"]').forEach((s) => s.remove());
  });

  it('inicia com Consent Mode v2 tudo "denied"', () => {
    initAnalytics();
    const def = consentCalls().find((c) => c[1] === 'default');
    expect(def?.[2]).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('aparece na primeira visita e "Aceitar todos" persiste e atualiza o consentimento', async () => {
    const user = userEvent.setup();
    initAnalytics();
    renderAt(<CookieBanner />);
    expect(screen.getByRole('heading', { name: /privacidade e cookies/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /aceitar todos/i }));
    expect(screen.queryByRole('heading', { name: /privacidade e cookies/i })).not.toBeInTheDocument();
    expect(readConsent()).toMatchObject({ analytics: true, marketing: true });
    const upd = consentCalls().find((c) => c[1] === 'update');
    expect(upd?.[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'granted' });
    // sem IDs configurados nenhum script de terceiros é injetado
    expect(document.querySelector('script[id^="cn-"]')).toBeNull();
  });

  it('"Recusar" salva tudo negado', async () => {
    const user = userEvent.setup();
    renderAt(<CookieBanner />);
    await user.click(screen.getByRole('button', { name: /^recusar$/i }));
    expect(readConsent()).toMatchObject({ analytics: false, marketing: false });
  });

  it('preferências permitem escolher por categoria', async () => {
    const user = userEvent.setup();
    renderAt(<CookieBanner />);
    await user.click(screen.getByRole('button', { name: /preferências/i }));
    await user.click(screen.getByRole('checkbox', { name: /^medição/i }));
    await user.click(screen.getByRole('button', { name: /salvar preferências/i }));
    expect(readConsent()).toMatchObject({ analytics: true, marketing: false });
  });

  it('não aparece se já houver escolha salva e reabre pelo link de preferências', async () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ analytics: false, marketing: false, decidedAt: '2026-01-01', version: 1 }),
    );
    renderAt(<CookieBanner />);
    expect(screen.queryByRole('heading', { name: /privacidade e cookies/i })).not.toBeInTheDocument();
    act(() => openCookiePreferences());
    expect(await screen.findByRole('button', { name: /salvar preferências/i })).toBeInTheDocument();
  });

  it('track() envia eventos para o dataLayer', () => {
    track('generate_lead', { form: 'quote' });
    expect(window.dataLayer).toContainEqual({ event: 'generate_lead', form: 'quote' });
  });
});
