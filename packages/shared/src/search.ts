import { DEMO_PRODUCTS } from './catalog';
import { getCategory } from './categories';
import type { Product } from './types';

/**
 * BUSCA DO CATÁLOGO — regra única usada pela API (GET /api/products?q=) e pelo
 * site (filtro local e fallback sem API).
 *
 * - Sem diferenciar acentos nem maiúsculas ("aluminio" = "Alumínio").
 * - A busca é quebrada em palavras e TODAS precisam aparecer no produto, em
 *   qualquer ordem ("canoa aluminio", "aluminio canoa").
 * - Campos: nome, categoria, descrição curta, descrição, especificações
 *   (valores) e características.
 * - Medidas: "6m", "6 m", "6 metros" e "6 mts" viram a mesma coisa; "canoa 6"
 *   também encontra a canoa de 6 m.
 * - Plural/singular por radical simples ("motores" = "motor", "lanchas" = "lancha")
 *   e alguns sinônimos reais do domínio (estofado → estofamento).
 * - Tolerância a 1 erro de digitação por palavra com 4 letras ou mais
 *   ("motr" → motor, "lacnha" → lancha), só quando a palavra digitada NÃO
 *   existe no catálogo: "chata" é uma palavra real (semi-chata) e não vira
 *   "chapa" (QA-10). O vocabulário é o do catálogo compartilhado, igual para
 *   a API e o site.
 * - Busca sem sentido (ex.: "xyzw", "%") não retorna nada.
 *
 * O catálogo é pequeno (dezenas de itens), então a busca é feita em memória.
 */

const DIACRITICS = /[̀-ͯ]/g;

/** Palavras que não ajudam a filtrar. */
const STOPWORDS = new Set([
  'a',
  'o',
  'as',
  'os',
  'um',
  'uma',
  'uns',
  'umas',
  'e',
  'ou',
  'de',
  'da',
  'do',
  'das',
  'dos',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'para',
  'pra',
  'pro',
  'com',
  'por',
  'sem',
  'que',
  'x',
]);

/**
 * Sinônimos e variações do domínio náutico. Chave = radical da palavra buscada
 * (ver `stem`); valores = termos aceitos no lugar dela.
 */
const SYNONYMS: Record<string, string[]> = {
  estofado: ['estofamento'],
  estofar: ['estofamento', 'estofado'],
  estofaria: ['estofamento', 'estofado'],
  estofamento: ['estofado'],
  almofada: ['almofadada', 'estofamento'],
  poltrona: ['estofamento'],
  banco: ['bancos', 'assentos', 'estofamento'],
  assento: ['estofamento', 'poltrona'],
  barco: ['lancha', 'canoa', 'bote', 'chata'],
  voadeira: ['bote', 'canoa'],
  semichata: ['chata'],
  pescar: ['pesca'],
  pescaria: ['pesca'],
  pescador: ['pesca'],
  familia: ['passeio', 'lazer'],
  passear: ['passeio', 'lazer'],
  lazer: ['passeio'],
  passeio: ['lazer'],
  carga: ['cargueira', 'transporte'],
  cargueiro: ['cargueira'],
  pessoa: ['passageiros', 'pessoas'],
  passageiro: ['pessoas', 'passageiros'],
  potencia: ['hp', 'motorizacao'],
  motorizacao: ['motor', 'hp'],
};

/**
 * Normaliza um texto para busca: sem acentos, minúsculo, pontuação vira espaço,
 * decimais "1,90" → "1.90" e medidas "6 m"/"6 metros" → "6m", "90 hp" → "90hp".
 */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/(\d)[,.](\d)/g, '$1.$2')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/(^|[^0-9])\.|\.(?![0-9])/g, '$1 ')
    .replace(/(\d)\s*(?:metros?|mts?|m)(?![a-z])/g, '$1m')
    .replace(/(\d)\s*hp(?![a-z])/g, '$1hp')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Radical simples de plural/singular em português. */
function stem(w: string): string {
  if (w.length < 4 || /^\d/.test(w)) return w;
  if (w.endsWith('oes') || w.endsWith('aes')) return `${w.slice(0, -3)}ao`;
  if (w.endsWith('ais')) return `${w.slice(0, -3)}al`;
  if (w.endsWith('eis')) return `${w.slice(0, -3)}el`;
  if (/(r|z|s)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('ns')) return `${w.slice(0, -2)}m`;
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
}

/** Distância de edição ≤ 1 (inserção, remoção, troca ou inversão de letras vizinhas). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // troca
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // inversão
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

const isNumberToken = (w: string) => /^\d/.test(w);

/** Divide em palavras; para medidas ("6m", "90hp") inclui também o número e a unidade. */
function tokenize(normalized: string): string[] {
  const out: string[] = [];
  for (const w of normalized.split(' ')) {
    if (!w) continue;
    out.push(w);
    const m = /^(\d+(?:\.\d+)?)(m|hp)$/.exec(w);
    if (m) out.push(m[1]!, m[2]!);
  }
  return out;
}

interface SearchIndex {
  /** Nome e categoria: aceitam prefixo de qualquer tamanho ("alum", "estof"). */
  strong: string[];
  /** Demais campos. */
  all: string[];
}

const indexCache = new WeakMap<Product, SearchIndex>();

function indexOf(p: Product): SearchIndex {
  const cached = indexCache.get(p);
  if (cached) return cached;
  const categoryName = getCategory(p.category)?.name ?? p.category;
  const strong = tokenize(normalizeText(`${p.name} ${categoryName}`));
  const rest = tokenize(
    normalizeText(
      [p.shortDescription, p.description, ...p.specs.map((s) => s.value), ...p.features].join(' '),
    ),
  );
  const index = { strong: [...new Set(strong)], all: [...new Set([...strong, ...rest])] };
  indexCache.set(p, index);
  return index;
}

/** Uma palavra buscada (`q`) corresponde a uma palavra do produto (`w`)? */
function termMatches(q: string, w: string, strong: boolean, fuzzy = true): boolean {
  if (q === w) return true;
  if (isNumberToken(q) || isNumberToken(w)) return false; // números: só exato
  if (stem(q) === stem(w)) return true;
  if (w.startsWith(q)) {
    // Nome/categoria: prefixo livre (busca enquanto digita).
    // Demais campos: só sufixos curtos (motor → motores, alum → alumínio), para
    // "motor" não casar com "motorização" em toda descrição.
    if (strong ? q.length >= 2 : q.length >= 3 && w.length - q.length <= 4) return true;
  }
  if (fuzzy && q.length >= 4 && w.length >= 4) {
    if (withinOneEdit(q, w) || withinOneEdit(stem(q), stem(w))) return true;
  }
  return false;
}

let catalogIndexes: SearchIndex[] | undefined;
const knownCache = new Map<string, boolean>();

/** A palavra existe no catálogo sem precisar de tolerância a erro? */
function isKnownWord(q: string): boolean {
  const cached = knownCache.get(q);
  if (cached !== undefined) return cached;
  catalogIndexes ??= DEMO_PRODUCTS.map(indexOf);
  const known = catalogIndexes.some(
    (index) =>
      index.strong.some((w) => termMatches(q, w, true, false)) ||
      index.all.some((w) => termMatches(q, w, false, false)),
  );
  knownCache.set(q, known);
  return known;
}

function wordMatches(index: SearchIndex, q: string): boolean {
  const alternatives = [q, ...(SYNONYMS[stem(q)] ?? [])];
  return alternatives.some((alt) => {
    const fuzzy = !isKnownWord(alt);
    return (
      index.strong.some((w) => termMatches(alt, w, true, fuzzy)) ||
      index.all.some((w) => termMatches(alt, w, false, fuzzy))
    );
  });
}

/** Palavras significativas da busca (sem repetição e sem palavras vazias). */
export function searchTerms(q: string): string[] {
  const words = normalizeText(q)
    .split(' ')
    .filter((w) => w && (isNumberToken(w) || w.length > 1));
  const meaningful = words.filter((w) => !STOPWORDS.has(w));
  return [...new Set(meaningful.length ? meaningful : words)];
}

/**
 * O produto corresponde à busca `q`? Busca vazia corresponde a tudo; busca só
 * com símbolos/ruído não corresponde a nada.
 */
export function matchesSearch(product: Product, q: string): boolean {
  if (!q.trim()) return true;
  const terms = searchTerms(q);
  if (!terms.length) return false;
  const index = indexOf(product);
  return terms.every((t) => wordMatches(index, t));
}

/** Filtra uma lista de produtos pela busca, mantendo a ordem original. */
export function searchProducts<T extends Product>(list: T[], q: string): T[] {
  return q.trim() ? list.filter((p) => matchesSearch(p, q)) : list;
}
