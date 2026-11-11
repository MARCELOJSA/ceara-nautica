import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { CATEGORIES, getCategory } from '@cn/shared';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd } from '@/components/seo/jsonld';
import { IllustrativeNote, PageHeader } from '@/components/layout/PageHeader';
import { ProductCard } from '@/components/product/ProductCard';
import { CtaBand, type CtaContext } from '@/components/layout/CtaBand';
import { useProducts } from '@/hooks/useProducts';
import { filterProducts } from '@/lib/api';
import { looksLikeMotorIssue, looksLikeService as isServiceQuery } from '@/lib/search';
import { MOTOR_ISSUE_HREF, MOTOR_ISSUE_LABEL } from '@/data/content';
import { track } from '@/lib/analytics';

function ctaContext(category: string): CtaContext {
  if (category === 'motores-de-popa') return 'motores';
  if (category === 'estofamentos') return 'estofamento';
  return 'embarcacao';
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const rawCategory = params.get('categoria') ?? '';
  const category = getCategory(rawCategory) ? rawCategory : '';
  const q = params.get('q') ?? '';
  const [term, setTerm] = useState(q);
  const { data, loading } = useProducts();
  const lastTracked = useRef('');
  const chipsRef = useRef<HTMLDivElement>(null);

  // mantém o chip ativo visível na rolagem horizontal (celular)
  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    const box = chipsRef.current;
    if (!el || !box || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({
      left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2,
      behavior: 'auto',
    });
  }, [category]);

  // mantém o campo sincronizado com a URL (voltar/avançar do navegador)
  useEffect(() => setTerm(q), [q]);

  // busca com debounce → URL (?q=)
  useEffect(() => {
    if (term === q) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (term.trim()) next.set('q', term);
      else next.delete('q');
      setParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [term, q, params, setParams]);

  useEffect(() => {
    const t = q.trim();
    if (t && t !== lastTracked.current) {
      lastTracked.current = t;
      track('search', { search_term: t });
    }
  }, [q]);

  const results = useMemo(
    () => filterProducts(data, { category: category || undefined, q }),
    [data, category, q],
  );

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('categoria', slug);
    else next.delete('categoria');
    setParams(next);
    if (slug) track('select_category', { category: slug, location: 'catalogo' });
  };

  const clearAll = () => {
    setTerm('');
    setParams(new URLSearchParams());
  };

  const cat = getCategory(category);
  const title = cat ? `${cat.name} em alumínio em Manaus` : 'Embarcações em alumínio em Manaus';
  const description = cat
    ? `${cat.description} Fabricação sob medida pela Ceará Náutica, em Manaus – AM.`
    : 'Lanchas, canoas, botes e semi-chatas em alumínio, motores de popa e estofamentos. Projetos sob medida da Ceará Náutica em Manaus – AM.';

  const crumbs = [
    { name: 'Início', path: '/' },
    // rótulo neutro: o catálogo também tem motores e estofamentos (UX-17)
    { name: 'Catálogo', path: '/produtos' },
    ...(cat ? [{ name: cat.name, path: `/produtos?categoria=${cat.slug}` }] : []),
  ];
  const looksLikeService = isServiceQuery(q);
  // UX-27: "motor falhando", "motor não liga"... → pedido de problema no motor
  const motorIssue = looksLikeMotorIssue(q);

  return (
    <>
      <Seo
        title={title}
        description={description}
        path={category ? `/produtos?categoria=${category}` : '/produtos'}
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <PageHeader
        eyebrow="Catálogo"
        title={cat ? cat.name : 'Embarcações e produtos'}
        intro={
          cat
            ? cat.description
            : 'Projetos de lanchas, canoas, botes e semi-chatas em alumínio fabricados pela Ceará Náutica, além de motores de popa e estofamentos. Tudo sob medida.'
        }
        // UX-20: no celular, uma frase curta e completa (as das categorias já são curtas)
        introShort={
          cat
            ? undefined
            : 'Lanchas, canoas, botes e semi-chatas em alumínio, além de motores e estofamentos.'
        }
        crumbs={crumbs}
        compact
      />

      <section className="pt-4 pb-10 sm:pt-10 lg:py-14" aria-label="Lista de produtos">
        <div className="container-x">
          <div className="flex flex-col gap-3 border-b border-steel-light pb-4 sm:gap-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div
              ref={chipsRef}
              role="group"
              aria-label="Filtrar por categoria"
              className="-mx-5 flex scroll-px-5 gap-2 overflow-x-auto px-5 pb-1 [mask-image:linear-gradient(90deg,#000_88%,transparent)] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]"
            >
              {[{ slug: '', name: 'Todas' }, ...CATEGORIES].map((c) => {
                const active = c.slug === category;
                return (
                  <button
                    key={c.slug || 'todas'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(c.slug)}
                    className={`inline-flex min-h-11 shrink-0 items-center rounded-sm border px-4 font-display text-base font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors ${
                      active
                        ? 'border-graphite-deep bg-graphite-deep text-white'
                        : 'border-steel/30 bg-white text-graphite hover:border-graphite-deep'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full lg:max-w-xs"
            >
              <label htmlFor="busca" className="sr-only">
                Buscar por nome
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-steel"
              />
              <input
                id="busca"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar por nome"
                className="field-input pl-11"
                autoComplete="off"
              />
            </form>
          </div>

          <p className="mt-3 text-sm text-steel sm:mt-6" aria-live="polite" aria-atomic="true">
            {loading
              ? 'Carregando produtos…'
              : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}${cat ? ` em ${cat.name}` : ''}${q ? ` para “${q}”` : ''}`}
          </p>

          {loading ? (
            <ul
              className="mt-4 grid gap-6 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-hidden="true"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="h-[26rem] animate-pulse rounded-md bg-steel-light/60" />
              ))}
            </ul>
          ) : results.length ? (
            <ul
              className="mt-4 grid gap-6 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="product-grid"
            >
              {results.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} headingLevel={2} />
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="mt-4 flex flex-col items-start gap-4 rounded-md border border-dashed border-steel/40 bg-white p-5 sm:mt-6 sm:p-12"
              data-testid="empty-state"
            >
              {/* UX-09: a dica de serviço vem primeiro, para aparecer sem rolar */}
              {looksLikeService && (
                <p
                  className="max-w-xl rounded-sm bg-offwhite p-4 text-graphite"
                  data-testid="service-hint"
                >
                  Procura reparo, manutenção ou outro serviço?{' '}
                  <Link to="/servicos" className="link-underline font-semibold">
                    Veja nossos serviços
                  </Link>
                  .
                  {motorIssue && (
                    <>
                      <br />
                      <Link
                        to={MOTOR_ISSUE_HREF}
                        className="link-underline mt-2 inline-flex min-h-11 items-center font-semibold"
                        data-testid="motor-issue-hint"
                      >
                        {MOTOR_ISSUE_LABEL}
                      </Link>
                      <span className="block text-sm text-steel">
                        A equipe confirma se atende o seu caso.
                      </span>
                    </>
                  )}
                </p>
              )}
              <h2 className="text-2xl font-bold uppercase sm:text-3xl">
                Nenhum produto encontrado
              </h2>
              <p className="max-w-xl text-steel">
                Não encontramos itens com esses filtros. Como cada embarcação é feita sob medida,
                você também pode descrever o que precisa no pedido de orçamento.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={clearAll} className="btn-dark">
                  <X aria-hidden="true" className="size-5" /> Limpar filtros
                </button>
                <Link to="/orcamento" className="btn-outline">
                  Solicitar orçamento
                </Link>
                {!looksLikeService && (
                  <Link
                    to="/servicos"
                    className="inline-flex min-h-11 items-center px-2 font-medium text-graphite underline decoration-orange underline-offset-4"
                  >
                    Ver serviços
                  </Link>
                )}
              </div>
            </div>
          )}
          <IllustrativeNote className="mt-8" />
        </div>
      </section>
      <CtaBand context={ctaContext(category)} />
    </>
  );
}
