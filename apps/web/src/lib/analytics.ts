import { site } from '@/config/site';
import { readConsent, type ConsentState } from './consent';

/**
 * Camada de marketing/medição.
 * - `track()` sempre envia para window.dataLayer (não sai do navegador sem os scripts).
 * - GTM, GA4 e Meta Pixel só são CARREGADOS após consentimento e se os IDs existirem.
 * - Google Consent Mode v2: tudo "denied" por padrão, atualizado conforme a escolha.
 */

export type AnalyticsEvent =
  | 'view_item'
  | 'whatsapp_click'
  | 'generate_lead'
  | 'form_submit'
  | 'select_category'
  | 'search'
  | 'instagram_click';

type Params = Record<string, string | number | boolean | undefined>;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const loaded = { gtm: false, ga4: false, pixel: false };
let initialized = false;

function ensureDataLayer(): void {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // Consent Mode exige o objeto `arguments` (não um array).
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }
}

function injectScript(src: string, id: string): void {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  s.id = id;
  document.head.appendChild(s);
}

function consentModeFrom(c: Pick<ConsentState, 'analytics' | 'marketing'>) {
  return {
    analytics_storage: c.analytics ? 'granted' : 'denied',
    ad_storage: c.marketing ? 'granted' : 'denied',
    ad_user_data: c.marketing ? 'granted' : 'denied',
    ad_personalization: c.marketing ? 'granted' : 'denied',
  } as const;
}

function loadGtm(id: string): void {
  if (loaded.gtm) return;
  loaded.gtm = true;
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  injectScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`, 'cn-gtm');
}

function loadGa4(id: string): void {
  if (loaded.ga4) return;
  loaded.ga4 = true;
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, 'cn-ga4');
  window.gtag?.('js', new Date());
  window.gtag?.('config', id, { anonymize_ip: true });
}

function loadPixel(id: string): void {
  if (loaded.pixel) return;
  loaded.pixel = true;
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;
  injectScript('https://connect.facebook.net/en_US/fbevents.js', 'cn-pixel');
  fbq('init', id);
  fbq('track', 'PageView');
}

/** Aplica o consentimento: atualiza Consent Mode e carrega o que foi autorizado. */
export function applyConsent(c: Pick<ConsentState, 'analytics' | 'marketing'>): void {
  ensureDataLayer();
  window.gtag?.('consent', 'update', consentModeFrom(c));
  if (!c.analytics && !c.marketing) return;
  if (site.gtmId) loadGtm(site.gtmId);
  if (c.analytics && site.ga4Id) loadGa4(site.ga4Id);
  if (c.marketing && site.metaPixelId) loadPixel(site.metaPixelId);
}

/** Chamado uma vez no boot do app. */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  ensureDataLayer();
  window.gtag?.('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
  const saved = readConsent();
  if (saved) applyConsent(saved);
}

const PIXEL_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  generate_lead: 'Lead',
  form_submit: 'Contact',
  whatsapp_click: 'Contact',
  view_item: 'ViewContent',
  search: 'Search',
};

export function track(event: AnalyticsEvent, params: Params = {}): void {
  if (typeof window === 'undefined') return;
  ensureDataLayer();
  window.dataLayer.push({ event, ...params });
  const pixelEvent = PIXEL_EVENTS[event];
  if (pixelEvent && loaded.pixel && window.fbq) window.fbq('track', pixelEvent, params);
}

/** Apenas para testes. */
export function __resetAnalyticsForTests(): void {
  initialized = false;
  loaded.gtm = loaded.ga4 = loaded.pixel = false;
}
