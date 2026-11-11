import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, Expand, Instagram, Tag, Wrench } from 'lucide-react';
import { getCategory } from '@cn/shared';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd, productJsonLd } from '@/components/seo/jsonld';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SmartImage } from '@/components/ui/SmartImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { Faq } from '@/components/ui/Faq';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';
import { DemoBadge, ProductCard } from '@/components/product/ProductCard';
import { IllustrativeNote } from '@/components/layout/PageHeader';
import { PageFallback } from '@/components/layout/Layout';
import { useProduct, useRelated } from '@/hooks/useProducts';
import { productWhatsAppMessage } from '@/lib/whatsapp';
import { productImages } from '@/lib/images';
import { track } from '@/lib/analytics';
import { productSeoDescription, productSeoTitle } from '@/lib/seo';
import { site } from '@/config/site';
import { glossaryFor, orderedSpecs, priceNote, productFaq, productKind } from '@/data/product-info';
import NotFound from './NotFound';

const BOAT_COPY = {
  aboutTitle: 'Sobre este projeto',
  adjust:
    'Medidas, layout, motorização, cor e acabamento podem ser ajustados ao seu uso. Fale com a equipe para montar o seu projeto.',
};

/** Pedido de revisão/defeito no motor (contrato com o formulário de orçamento, UX-22). */
const MOTOR_ISSUE_HREF = '/orcamento?servico=motor-revisao';

/** Textos que mudam conforme o tipo de item (embarcação, motor ou estofamento). */
function detailCopy(category: string) {
  if (category === 'motores-de-popa') {
    return {
      aboutTitle: 'Sobre os motores',
      adjust:
        'Marcas, modelos e potências disponíveis são informados no orçamento. Conte qual é a sua embarcação e como você navega para receber a indicação adequada.',
    };
  }
  if (category === 'estofamentos') {
    return {
      aboutTitle: 'Sobre o serviço',
      adjust:
        'Materiais, cores e prazo são definidos no orçamento, conforme os assentos e o uso da sua embarcação.',
    };
  }
  return BOAT_COPY;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, loading } = useProduct(slug);
  const related = useRelated(product);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  // estável: não reinicia o foco preso do lightbox a cada troca de foto (QA-01)
  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    setActive(0);
    if (product) {
      track('view_item', {
        item_id: product.slug,
        item_name: product.name,
        item_category: product.category,
      });
    }
  }, [product]);

  if (loading) return <PageFallback />;
  if (!product) return <NotFound />;

  const category = getCategory(product.category);
  const available = productImages(product);
  const images = available.length ? available : [{ src: '', alt: product.name }];
  const copy = detailCopy(product.category);
  const current = images[Math.min(active, images.length - 1)]!;
  const crumbs = [
    { name: 'Início', path: '/' },
    // rótulo neutro: o catálogo também tem motores e estofamentos (UX-17)
    { name: 'Catálogo', path: '/produtos' },
    ...(category ? [{ name: category.name, path: `/produtos?categoria=${category.slug}` }] : []),
    { name: product.name, path: `/produtos/${product.slug}` },
  ];
  const quoteHref = `/orcamento?produto=${encodeURIComponent(product.slug)}`;
  const specs = orderedSpecs(product.specs);
  const glossary = glossaryFor(product);
  const faq = productFaq(product);

  return (
    <>
      <Seo
        title={productSeoTitle(product.name, category?.name)}
        description={productSeoDescription(product.shortDescription)}
        path={`/produtos/${product.slug}`}
        image={available[0]?.src}
        type="product"
        jsonLd={[productJsonLd(product), breadcrumbJsonLd(crumbs)]}
      />

      <div className="border-b border-steel-light bg-white">
        <div className="container-x py-4">
          <Breadcrumb items={crumbs} />
        </div>
      </div>

      <section className="bg-white pt-8 pb-16 lg:pt-12 lg:pb-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          {/* Galeria */}
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-steel-light">
              <button
                type="button"
                onClick={() => setLightbox(Math.min(active, images.length - 1))}
                className="group block h-full w-full"
              >
                <SmartImage
                  key={current.src}
                  src={current.src}
                  alt={current.alt}
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="h-full w-full object-cover"
                  width={1280}
                  height={960}
                />
                <span className="absolute right-3 bottom-3 inline-flex min-h-10 items-center gap-2 rounded-sm bg-graphite-deep/80 px-3 text-sm font-medium text-white">
                  <Expand aria-hidden="true" className="size-4" /> Ampliar
                </span>
              </button>
              {product.isDemo && <DemoBadge className="absolute top-3 left-3" />}
            </div>
            {images.length > 1 && (
              <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5" aria-label="Miniaturas">
                {images.map((img, i) => (
                  <li key={img.src || i}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={i === active ? 'true' : undefined}
                      className={`block aspect-[4/3] w-full overflow-hidden rounded-sm border-2 bg-steel-light ${
                        i === active
                          ? 'border-orange'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <SmartImage
                        src={img.src}
                        alt=""
                        sizes="120px"
                        className="h-full w-full object-cover"
                      />
                      <span className="sr-only">
                        Ver imagem {i + 1}: {img.alt}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <IllustrativeNote className="mt-4" />
          </div>

          {/* Informações */}
          <div>
            <p className="eyebrow text-orange-ink">{category?.name}</p>
            <h1 className="mt-2 text-[2.5rem] leading-[0.98] font-bold uppercase sm:text-5xl lg:text-[3.5rem]">
              {product.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-graphite">{product.shortDescription}</p>

            {product.availability && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-sm bg-offwhite px-3 py-2 text-sm font-medium text-graphite-deep">
                <span aria-hidden="true" className="size-2 rounded-full bg-orange" />
                Disponibilidade: {product.availability}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link to={quoteHref} className="btn-primary flex-1 px-6">
                Solicitar orçamento <ArrowRight aria-hidden="true" className="size-5" />
              </Link>
              <WhatsAppCta
                message={productWhatsAppMessage(product.name)}
                location="produto"
                productSlug={product.slug}
                className="btn-outline flex-1 px-6"
                instagramLabel="Perguntar no Instagram"
              />
            </div>

            {/* UX-22: caminho próprio para quem já tem motor com defeito — secundário à compra */}
            {productKind(product) === 'motor' && (
              <p className="mt-4">
                <Link
                  to={MOTOR_ISSUE_HREF}
                  className="group inline-flex min-h-11 items-center gap-2.5 font-medium text-graphite-deep underline decoration-orange decoration-2 underline-offset-4 hover:text-orange-ink"
                  data-testid="motor-issue-link"
                >
                  <Wrench aria-hidden="true" className="size-5 shrink-0 text-graphite" />
                  <span>
                    Problema no motor? Descreva aqui
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-1.5 inline size-4 align-[-0.15em] transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </p>
            )}

            {/* UX-05: preço e prazo sem números — explicados no lugar da decisão */}
            <div
              className="mt-5 flex gap-3 rounded-sm border border-steel-light bg-offwhite p-4"
              data-testid="price-note"
            >
              <Tag aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-graphite" />
              <div>
                <h2 className="eyebrow text-graphite-deep">Preço e prazo: sob consulta</h2>
                <p className="mt-1 text-sm leading-relaxed text-graphite">{priceNote(product)}</p>
              </div>
            </div>

            <h2 className="mt-10 eyebrow text-graphite-deep">Especificações</h2>
            <dl className="mt-3 divide-y divide-steel-light border-y border-steel-light">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 py-3 text-[0.9375rem]"
                >
                  <dt className="text-steel">{s.label}</dt>
                  <dd
                    className={`font-medium ${/sob consulta/i.test(s.value) ? 'text-steel italic' : 'text-graphite-deep'}`}
                  >
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
            {glossary.length > 0 && (
              <div className="mt-3 text-sm leading-relaxed text-steel" data-testid="spec-glossary">
                <p className="font-medium text-graphite">Entenda a ficha</p>
                <dl className="mt-1 space-y-0.5">
                  {glossary.map((g) => (
                    <div key={g.term}>
                      <dt className="inline font-semibold text-graphite">{g.term}:</dt>{' '}
                      <dd className="inline">{g.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.features.length > 0 && (
              <>
                <h2 className="mt-8 eyebrow text-graphite-deep">Características</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.9375rem] text-graphite">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-orange-ink"
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                {product.features.some((f) => f.endsWith('*')) && (
                  <p className="mt-2 text-xs text-steel">
                    * Condição do projeto publicado; confirme com a equipe.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="descricao-title"
        className="border-t border-steel-light py-16 lg:py-20"
      >
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <h2 id="descricao-title" className="text-4xl font-bold uppercase">
            {copy.aboutTitle}
          </h2>
          <div>
            <p className="text-lg leading-relaxed text-graphite">{product.description}</p>
            <p className="mt-4 leading-relaxed text-steel">{copy.adjust}</p>
            {product.source && (
              <p className="mt-6 flex items-center gap-2 text-sm text-steel">
                <Instagram aria-hidden="true" className="size-4 shrink-0" />
                <span>
                  Fonte:{' '}
                  <a
                    href={site.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline"
                  >
                    {product.source}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      <Faq
        id="duvidas-produto"
        items={faq}
        eyebrow="Antes de pedir"
        title="Dúvidas comuns"
        intro="Respostas curtas e honestas. O que depende do seu projeto é informado no orçamento."
      />

      {related.length > 0 && (
        <section
          aria-labelledby="relacionados-title"
          className="border-t border-steel-light bg-white py-16 lg:py-20"
        >
          <div className="container-x">
            <h2 id="relacionados-title" className="text-4xl font-bold uppercase">
              Veja também
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Lightbox
        images={images.filter((i) => i.src)}
        index={lightbox}
        onClose={closeLightbox}
        onIndexChange={setLightbox}
        label={`Fotos — ${product.name}`}
      />
    </>
  );
}
