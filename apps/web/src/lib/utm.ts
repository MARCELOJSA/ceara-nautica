import type { UtmData } from '@cn/shared';

const KEY = 'cn_utm';
const PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
] as const;

type UtmRecord = NonNullable<UtmData>;

const LIMITS: Record<keyof UtmRecord, number> = {
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
  utm_term: 200,
  utm_content: 200,
  gclid: 500,
  fbclid: 500,
  landing_page: 500,
  referrer: 500,
};

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Captura UTM/gclid/fbclid, landing page e referrer na PRIMEIRA página da sessão.
 * Visitas seguintes na mesma sessão não sobrescrevem (atribuição de primeiro toque).
 * Se a URL atual trouxer novos parâmetros de campanha, eles são registrados.
 */
export function captureUtm(loc: Location = window.location, referrer = document.referrer): void {
  const store = safeStorage();
  if (!store) return;
  const params = new URLSearchParams(loc.search);
  const hasCampaign = PARAMS.some((p) => params.get(p));
  if (store.getItem(KEY) && !hasCampaign) return;

  const data: UtmRecord = {};
  for (const p of PARAMS) {
    const v = params.get(p);
    if (v) data[p] = v.slice(0, LIMITS[p]);
  }
  data.landing_page = `${loc.pathname}${loc.search}`.slice(0, LIMITS.landing_page);
  if (referrer && !referrer.startsWith(loc.origin)) {
    data.referrer = referrer.slice(0, LIMITS.referrer);
  }
  store.setItem(KEY, JSON.stringify(data));
}

/** Dados de atribuição para anexar aos formulários (formato do utmSchema). */
export function getUtm(): UtmRecord | undefined {
  const raw = safeStorage()?.getItem(KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: UtmRecord = {};
    for (const key of Object.keys(LIMITS) as (keyof UtmRecord)[]) {
      const v = parsed[key];
      if (typeof v === 'string' && v) out[key] = v.slice(0, LIMITS[key]);
    }
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}
