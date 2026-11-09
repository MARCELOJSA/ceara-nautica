import {
  DEMO_PRODUCTS,
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

const TIMEOUT_MS = 8000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${site.apiUrl}${path}`, {
      ...init,
      signal: init?.signal ?? ctrl.signal,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
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
    throw new ApiRequestError(0, 'Não foi possível conectar ao servidor.');
  } finally {
    clearTimeout(timer);
  }
}

const isProductArray = (v: unknown): v is Product[] =>
  Array.isArray(v) && v.every((p) => p && typeof p === 'object' && 'slug' in p && 'name' in p);

export interface ProductQuery {
  category?: string;
  q?: string;
  featured?: boolean;
}

export function filterProducts(list: Product[], query: ProductQuery = {}): Product[] {
  const q = normalize(query.q ?? '');
  return list.filter(
    (p) =>
      (!query.category || p.category === query.category) &&
      (query.featured === undefined || p.featured === query.featured) &&
      (!q || normalize(`${p.name} ${p.shortDescription}`).includes(q)),
  );
}

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

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
    const data = await request<unknown>(`/products${qs ? `?${qs}` : ''}`);
    if (!isProductArray(data)) throw new Error('formato inesperado');
    return { data, fallback: false };
  } catch {
    return { data: filterProducts(DEMO_PRODUCTS, query), fallback: true };
  }
}

/** Retorna null quando o produto não existe (404 da API ou ausente no fallback). */
export async function getProduct(slug: string): Promise<Loaded<Product | null>> {
  try {
    const data = await request<Product>(`/products/${encodeURIComponent(slug)}`);
    return { data, fallback: false };
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return { data: null, fallback: false };
    return { data: DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null, fallback: true };
  }
}

export async function getRelated(product: Product): Promise<Product[]> {
  try {
    const data = await request<unknown>(`/products/${encodeURIComponent(product.slug)}/related`);
    if (!isProductArray(data)) throw new Error('formato inesperado');
    return data.slice(0, 4);
  } catch {
    return DEMO_PRODUCTS.filter(
      (p) => p.category === product.category && p.slug !== product.slug,
    ).slice(0, 4);
  }
}

export function sendContact(body: ContactInput): Promise<FormSubmissionResponse> {
  return request<FormSubmissionResponse>('/contact', { method: 'POST', body: JSON.stringify(body) });
}

export function sendQuote(body: QuoteInput): Promise<FormSubmissionResponse> {
  return request<FormSubmissionResponse>('/quotes', { method: 'POST', body: JSON.stringify(body) });
}
