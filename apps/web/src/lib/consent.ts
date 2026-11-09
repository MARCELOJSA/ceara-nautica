/**
 * Preferências de cookies (LGPD). Persistidas em localStorage.
 * - necessary: sempre ativo (preferência de consentimento e sessão de UTM)
 * - analytics: Google Analytics 4 / GTM (medição)
 * - marketing: Meta Pixel / anúncios
 */
export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  /** ISO date da decisão */
  decidedAt: string;
  version: 1;
}

export const CONSENT_KEY = 'cn_consent_v1';
export const CONSENT_EVENT = 'cn:consent-change';
export const OPEN_PREFERENCES_EVENT = 'cn:open-cookie-preferences';

export function readConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ConsentState>;
    if (v.version !== 1 || typeof v.analytics !== 'boolean' || typeof v.marketing !== 'boolean') {
      return null;
    }
    return v as ConsentState;
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = { ...choice, decidedAt: new Date().toISOString(), version: 1 };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    /* modo privado: segue só em memória */
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  return state;
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}
