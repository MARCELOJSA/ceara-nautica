/**
 * Informações de apoio à página de produto e aos cards, DERIVADAS dos dados que
 * o catálogo já tem (specs, textos, categoria). Nada aqui cria medida,
 * capacidade, preço ou prazo: quando o dado não existe, ele não aparece ou fica
 * "sob consulta" / "informado no orçamento".
 */
import type { Product, ProductSpec } from '@cn/shared';

const SOB_CONSULTA = /sob consulta/i;
const hasValue = (s: ProductSpec | undefined): s is ProductSpec =>
  !!s && !!s.value.trim() && !SOB_CONSULTA.test(s.value);

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export type ProductKind = 'embarcacao' | 'motor' | 'estofamento';

export function productKind(p: Pick<Product, 'category'>): ProductKind {
  if (p.category === 'motores-de-popa') return 'motor';
  if (p.category === 'estofamentos') return 'estofamento';
  return 'embarcacao';
}

/* ------------------------------------------------------------------ ficha */

/**
 * Ordem de exibição da ficha técnica (UX-12): o mesmo assunto fica na mesma
 * posição em todos os produtos — medidas, casco, capacidade/uso a bordo,
 * acabamento e, por último, motorização. Rótulos fora da lista vão para o fim
 * na ordem original. Não cria linhas que o produto não tem.
 */
const SPEC_ORDER = [
  'dimensoes',
  'comprimento',
  'boca / pontal',
  'material do casco',
  'casco',
  'chapa',
  'capacidade',
  'bancos',
  'assentos',
  'tanque',
  'capota',
  'pintura',
  'motorizacao',
  'marcas',
  'potencias',
  'materiais',
  'cores',
  'prazo',
];

export function orderedSpecs(specs: ProductSpec[]): ProductSpec[] {
  const rank = (s: ProductSpec) => {
    const i = SPEC_ORDER.indexOf(norm(s.label).trim());
    return i === -1 ? SPEC_ORDER.length : i;
  };
  return specs
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .map(({ s }) => s);
}

/* -------------------------------------------------------------- glossário */

export interface GlossaryEntry {
  term: string;
  text: string;
}

/**
 * Termos de estaleiro explicados em linguagem simples (UX-11). Só entram na
 * legenda os termos que aparecem no produto exibido.
 */
const GLOSSARY: (GlossaryEntry & { match: RegExp })[] = [
  {
    term: 'Dimensões',
    text: 'comprimento × boca × pontal, nessa ordem, como no projeto publicado.',
    match: /\d\s*m\s*x\s*\d/i,
  },
  {
    term: 'Boca',
    text: 'a largura do casco, no ponto mais largo.',
    match: /\bboca\b|\d\s*m\s*x\s*\d/i,
  },
  {
    term: 'Pontal',
    text: 'a altura do casco, do fundo até a borda.',
    match: /\bpontal\b|\d\s*m\s*x\s*\d/i,
  },
  {
    term: 'Chapa',
    text: 'a espessura da chapa de alumínio usada no casco.',
    match: /\bchapa\b|\d\s*mm\b/i,
  },
  { term: 'hp', text: 'a potência do motor, em cavalos (horsepower).', match: /\bhp\b/i },
  {
    term: 'Popa',
    text: 'a parte de trás da embarcação. “Popa lavada” é um tipo de popa — peça à equipe os detalhes do projeto.',
    match: /\bpopa lavada\b/i,
  },
  {
    term: 'Bomba de porão',
    text: 'retira a água que se acumula no fundo da embarcação.',
    match: /bomba de porao/i,
  },
];

export function glossaryFor(p: Product): GlossaryEntry[] {
  const text = norm(
    [p.name, ...p.specs.flatMap((s) => [s.label, s.value]), ...p.features].join(' \n '),
  );
  return GLOSSARY.filter((g) => g.match.test(text)).map(({ term, text: t }) => ({ term, text: t }));
}

/* ------------------------------------------------------------------ cards */

/**
 * Usos citados nos textos (UX-06/UX-23). Um só rótulo por assunto: "passeio" e
 * "lazer" viram "Lazer", o mesmo termo das categorias e da página Sobre.
 */
const USES: { label: string; match: RegExp }[] = [
  { label: 'Lazer', match: /\bpasseio|\blazer\b/ },
  { label: 'Pesca', match: /\bpesca\b/ },
  { label: 'Trabalho', match: /\btrabalho\b/ },
  { label: 'Transporte', match: /\btransporte\b/ },
];

/** Usos citados nos textos do próprio produto (UX-06). Vazio se não houver. */
export function usageTags(p: Product): string[] {
  if (productKind(p) !== 'embarcacao') return [];
  const text = norm([p.shortDescription, p.description, ...p.features].join(' '));
  return USES.filter((u) => u.match.test(text)).map((u) => u.label);
}

const specBy = (p: Product, ...labels: string[]) =>
  p.specs.find((s) => labels.includes(norm(s.label).trim()));

/** Medida principal (comprimento) a partir de "Dimensões" ou "Comprimento". */
export function mainMeasure(p: Product): string | undefined {
  const dims = specBy(p, 'dimensoes');
  if (hasValue(dims)) {
    const first = dims.value.split(/\s*x\s*/i)[0]?.trim();
    if (first) return first;
  }
  const len = specBy(p, 'comprimento');
  return hasValue(len) ? len.value : undefined;
}

/** Capacidade publicada, se houver ("8 pessoas + 1 tripulante"). */
export function capacity(p: Product): string | undefined {
  const c = specBy(p, 'capacidade');
  return hasValue(c) ? c.value : undefined;
}

/**
 * Resumo discreto do card: medida · capacidade (quando publicadas) e usos
 * citados nos textos. Para motor/estofamento não há resumo de medida nem uso.
 * `usesPending`: embarcação sem uso publicado — o card mostra "sob consulta"
 * (UX-23) em vez de omitir a linha ou deduzir um uso.
 */
export function cardSummary(p: Product): {
  facts: string[];
  uses: string[];
  usesPending: boolean;
} {
  const facts = [mainMeasure(p), capacity(p)].filter((x): x is string => !!x);
  const uses = usageTags(p);
  return { facts, uses, usesPending: productKind(p) === 'embarcacao' && uses.length === 0 };
}

/* -------------------------------------------------------- preço e prazo */

export function priceNote(p: Product): string {
  switch (productKind(p)) {
    case 'motor':
      return 'Preço e disponibilidade dependem da marca, do modelo e da potência. Por isso são informados no orçamento.';
    case 'estofamento':
      return 'Preço e prazo dependem da quantidade de assentos, do material e do acabamento. Por isso são informados no orçamento.';
    default:
      return 'Preço e prazo dependem das medidas, da motorização e do acabamento escolhidos. Por isso são informados no orçamento, para o seu projeto.';
  }
}

/* -------------------------------------------------------------- mini-FAQ */

export interface FaqEntry {
  q: string;
  a: string;
}

/** Perguntas curtas do produto (UX-05). Só fatos confirmados; o resto, no orçamento. */
export function productFaq(p: Product): FaqEntry[] {
  const kind = productKind(p);
  if (kind === 'motor') {
    return [
      {
        q: 'Quanto custa o motor?',
        a: 'O preço depende da marca, do modelo e da potência disponíveis no momento. A equipe informa no orçamento.',
      },
      {
        q: 'Quais marcas e potências vocês têm?',
        a: 'Marcas, modelos e potências disponíveis são informados pela equipe no orçamento.',
      },
      {
        q: 'Como sei qual potência escolher?',
        a: 'Conte no pedido qual é a sua embarcação (tamanho e material) e como você navega. A equipe orienta a escolha da motorização.',
      },
      {
        // UX-22: conserto de motor não é confirmado — sem prometer o serviço
        q: 'Vocês fazem revisão ou conserto de motor?',
        a: 'Descreva o modelo e o problema no pedido; a equipe confirma se atende e como.',
      },
    ];
  }
  if (kind === 'estofamento') {
    return [
      {
        q: 'Quanto custa e quanto tempo leva?',
        a: 'Depende da quantidade de assentos, do material e do acabamento. Preço e prazo são informados no orçamento.',
      },
      {
        q: 'Preciso levar a embarcação?',
        a: 'Isso é combinado com a equipe no orçamento, conforme o serviço. Descreva no pedido quais assentos quer fazer ou reformar.',
      },
      {
        q: 'Posso escolher cor e material?',
        a: 'Materiais e cores são definidos com a equipe no orçamento.',
      },
    ];
  }
  const cap = capacity(p);
  return [
    {
      q: 'Quanto custa e qual o prazo?',
      a: 'Cada embarcação é feita sob medida. Preço e prazo dependem das medidas, da motorização e do acabamento e são informados no orçamento.',
    },
    {
      q: 'Quantas pessoas ou quanto peso ela leva?',
      a: cap
        ? `No projeto publicado, a capacidade é de ${cap}. Para outro projeto, a capacidade depende das medidas e é confirmada no orçamento.`
        : 'A capacidade depende das medidas e da configuração do projeto. Ela é confirmada pela equipe no orçamento.',
    },
    {
      q: 'Posso mudar medidas, layout e cor?',
      a: 'Sim. O projeto é 100% personalizado e a pintura também: você escolhe a cor e o acabamento.',
    },
    {
      q: 'Vocês entregam fora de Manaus?',
      a: 'Sim. A empresa já entregou embarcações em outras regiões, como Belém e o Suriname. As condições para o seu destino são informadas no orçamento.',
    },
  ];
}

/* ------------------------------------------------- projetos publicados */

export interface PublishedProject {
  slug: string;
  name: string;
  category: Product['category'];
  /** data da publicação no Instagram (dd/mm/aaaa), lida de `source` */
  date: string;
  /** para ordenar (aaaa-mm-dd) */
  iso: string;
}

/** Projetos com data de publicação no Instagram (campo `source`), do mais recente ao mais antigo. */
export function publishedProjects(products: Product[]): PublishedProject[] {
  const out: PublishedProject[] = [];
  for (const p of products) {
    const m = p.source?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) continue;
    const [, d, mo, y] = m;
    out.push({
      slug: p.slug,
      name: p.name,
      category: p.category,
      date: `${d}/${mo}/${y}`,
      iso: `${y}-${mo}-${d}`,
    });
  }
  return out.sort((a, b) => b.iso.localeCompare(a.iso));
}
