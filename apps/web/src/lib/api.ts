import {
  DEMO_PRODUCTS,
  matchesSearch,
  normalizeText,
  type ApiError,
  type ContactInput,
  type FormSubmissionResponse,
  type Product,
  type QuoteInput,
} from '@cn/shared';
import { site } from '@/config/site';

/**
 * Cliente da API REST (contrato na Skill, seção 4).
 * Leitura de produtos: se a API estiver indisponível, usa o catálogo de
 * @cn/shared como fallback para o site nunca ficar vazio.
 * Formulários: SEMPRE POST real — sem fallback silencioso.
 */

export class ApiRequestError extends Error {
  status: number;
  details?: Record<string, string[]>;
  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

/** A API não respondeu dentro do prazo (status 0, como erro de rede). */
export class ApiTimeoutError extends ApiRequestError {
  constructor() {
    super(0, 'O servidor demorou para responder.');
    this.name = 'ApiTimeoutError';
  }
}

/**
 * Tempos (docs/HOSTING.md): a API no plano grátis do Render "dorme" após 15 min
 * sem acesso e leva ~1 min para acordar.
 * - Leituras do catálogo: curtas. Se a API não responder, o site mostra o
 *   catálogo local (DEMO_PRODUCTS) em vez de ficar "Carregando".
 * - Envio de formulário: longo, para o pedido não se perder enquanto a API acorda.
 */
export const READ_TIMEOUT_MS = 8000;
export const SUBMIT_TIMEOUT_MS = 90_000;
/** Depois de uma leitura sem resposta, as próximas usam o catálogo local por este tempo. */
export const READ_SKIP_MS = 30_000;
/** Intervalo mínimo entre dois "despertares" da API (por aba). */
export const WAKE_INTERVAL_MS = 5 * 60_000;
/** Tempo máximo esperando a API acordar no despertar em segundo plano. */
export const WAKE_TIMEOUT_MS = 90_000;

const READ_SKIP_KEY = 'cn_api_unreachable_until';
const WAKE_KEY = 'cn_api_wake_at';

/** sessionStorage pode não existir (modo privado antigo, cookies bloqueados). */
const memory = new Map<string, string>();
const store = {
  get(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
  },
};

/**
 * "Acorda" a API em segundo plano (GET /health), sem bloquear nada e sem
 * erro visível se falhar. Chamado ao abrir /orcamento, /contato e páginas de
 * produto e ao focar o formulário. Dispara no máximo uma vez a cada
 * WAKE_INTERVAL_MS por aba, mesmo com várias chamadas seguidas.
 * GET idempotente: não grava nada no servidor.
 */
export function wakeApi(): void {
  const now = Date.now();
  const last = Number(store.get(WAKE_KEY));
  if (last && now - last >= 0 && now - last < WAKE_INTERVAL_MS) return;
  store.set(WAKE_KEY, String(now));
  try {
    // A resposta não interessa: descarta o corpo assim que chega (QA-14 — sem isso o
    // Chromium mantém a requisição aberta e a página nunca fica com a rede ociosa,
    // o que atrapalha robôs de busca), e desiste depois do tempo máximo de despertar.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), WAKE_TIMEOUT_MS);
    fetch(`${site.apiUrl}/health`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    })
      .then((res) => res.body?.cancel())
      .catch(() => undefined)
      .finally(() => clearTimeout(timer));
  } catch {
    // fetch indisponível: ignora (o envio do formulário espera a API acordar)
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: string;
  timeoutMs?: number;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, opts.timeoutMs ?? READ_TIMEOUT_MS);
  try {
    const res = await fetch(`${site.apiUrl}${path}`, {
      method: opts.method ?? 'GET',
      body: opts.body,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body: unknown = isJson ? await res.json().catch(() => null) : null;
    if (!res.ok) {
      const err = (body ?? {}) as Partial<ApiError>;
      throw new ApiRequestError(res.status, err.error || `Erro ${res.status}`, err.details);
    }
    if (!isJson) throw new ApiRequestError(res.status, 'Resposta inválida da API.');
    return body as T;
  } catch (e) {
    if (e instanceof ApiRequestError) throw e;
    if (timedOut) throw new ApiTimeoutError();
    throw new ApiRequestError(0, 'Não foi possível conectar ao servidor.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Leitura do catálogo. Se a API acabou de ficar sem responder (dormindo,
 * fora do ar), não espera de novo a cada página: usa o catálogo local por
 * READ_SKIP_MS e, em paralelo, pede para a API acordar.
 */
async function read<T>(path: string): Promise<T> {
  const until = Number(store.get(READ_SKIP_KEY));
  if (until && Date.now() < until) {
    wakeApi();
    throw new ApiRequestError(0, 'API indisponível (catálogo local).');
  }
  try {
    return await request<T>(path);
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 0) {
      store.set(READ_SKIP_KEY, String(Date.now() + READ_SKIP_MS));
    }
    throw e;
  }
}

const isProductArray = (v: unknown): v is Product[] =>
  Array.isArray(v) && v.every((p) => p && typeof p === 'object' && 'slug' in p && 'name' in p);

export interface ProductQuery {
  category?: string;
  q?: string;
  featured?: boolean;
}

/**
 * Filtro local do catálogo (página /produtos e fallback sem API). A busca usa
 * `matchesSearch` de @cn/shared — a MESMA regra de GET /api/products?q=.
 */
export function filterProducts(list: Product[], query: ProductQuery = {}): Product[] {
  const q = query.q?.trim() ?? '';
  return list.filter(
    (p) =>
      (!query.category || p.category === query.category) &&
      (query.featured === undefined || p.featured === query.featured) &&
      (!q || matchesSearch(p, q)),
  );
}

/** Texto normalizado para busca (sem acento, minúsculo). Alias de `normalizeText`. */
export const normalize = normalizeText;

export interface Loaded<T> {
  data: T;
  /** true quando os dados vieram do catálogo local (API indisponível) */
  fallback: boolean;
}

export async function getProducts(query: ProductQuery = {}): Promise<Loaded<Product[]>> {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.q) params.set('q', query.q);
  if (query.featured !== undefined) params.set('featured', String(query.featured));
  const qs = params.toString();
  try {
    const data = await read<unknown>(`/products${qs ? `?${qs}` : ''}`);
    if (!isProductArray(data)) throw new Error('formato inesperado');
    return { data, fallback: false };
  } catch {
    return { data: filterProducts(DEMO_PRODUCTS, query), fallback: true };
  }
}

/** Retorna null quando o produto não existe (404 da API ou ausente no fallback). */
export async function getProduct(slug: string): Promise<Loaded<Product | null>> {
  try {
    const data = await read<Product>(`/products/${encodeURIComponent(slug)}`);
    return { data, fallback: false };
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return { data: null, fallback: false };
    return { data: DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null, fallback: true };
  }
}

export async function getRelated(product: Product): Promise<Product[]> {
  try {
    const data = await read<unknown>(`/products/${encodeURIComponent(product.slug)}/related`);
    if (!isProductArray(data)) throw new Error('formato inesperado');
    return data.slice(0, 4);
  } catch {
    return DEMO_PRODUCTS.filter(
      (p) => p.category === product.category && p.slug !== product.slug,
    ).slice(0, 4);
  }
}

/**
 * Envio de formulário: SEM retry automático (um POST repetido duplicaria o
 * pedido). Espera até SUBMIT_TIMEOUT_MS para a API acordar; se mesmo assim
 * falhar, a pessoa reenvia pelo botão com os dados preservados.
 */
export function sendContact(body: ContactInput): Promise<FormSubmissionResponse> {
  return request<FormSubmissionResponse>('/contact', {
    method: 'POST',
    body: JSON.stringify(body),
    timeoutMs: SUBMIT_TIMEOUT_MS,
  });
}

export function sendQuote(body: QuoteInput): Promise<FormSubmissionResponse> {
  return request<FormSubmissionResponse>('/quotes', {
    method: 'POST',
    body: JSON.stringify(body),
    timeoutMs: SUBMIT_TIMEOUT_MS,
  });
}
