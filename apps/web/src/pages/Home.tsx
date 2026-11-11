import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Expand } from 'lucide-react';
import { CATEGORIES } from '@cn/shared';
import { Seo } from '@/components/seo/Seo';
import { localBusinessJsonLd } from '@/components/seo/jsonld';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal, SectionHeading } from '@/components/ui/Reveal';
import { ProductCard } from '@/components/product/ProductCard';
import { Lightbox } from '@/components/ui/Lightbox';
import { CtaBand } from '@/components/layout/CtaBand';
import { IllustrativeNote } from '@/components/layout/PageHeader';
import { CATEGORY_COVERS, DIFFERENTIALS, GALLERY, SERVICES } from '@/data/content';
import { useProducts } from '@/hooks/useProducts';
import { track } from '@/lib/analytics';
import { homeFeatured } from '@/lib/featured';

const CAPABILITIES = [
  { label: 'Embarcações em alumínio', to: '/produtos' },
  { label: 'Fabricação sob medida', to: '/servicos#fabricacao' },
  { label: 'Reparos e manutenção', to: '/servicos#reparos' },
  { label: 'Motores de popa', to: '/produtos?categoria=motores-de-popa' },
];

function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[calc(100svh-68px)] flex-col overflow-hidden bg-graphite-deep text-white lg:min-h-[calc(100svh-76px)]"
    >
      <div className="absolute inset-0 -z-10">
        <SmartImage
          src="/images/hero.webp"
          alt="Embarcação navegando em um rio largo da Amazônia ao entardecer"
          widths={[640, 1280, 1920]}
          maxWidth={2560}
          sizes="100vw"
          priority
          className="h-full w-full object-cover object-[30%_70%]"
          fallbackClassName="hidden"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,25,28,0.55)_0%,rgba(23,25,28,0.15)_40%,rgba(23,25,28,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,25,28,0.7)_0%,rgba(23,25,28,0)_65%)]" />
      </div>

      <div className="container-x flex flex-1 flex-col justify-center py-16 sm:py-20">
        <p className="eyebrow flex items-center gap-3 text-white/85">
          <span aria-hidden="true" className="h-px w-10 bg-orange" />
          Náutica &amp; Estaleiro · Manaus – AM
        </p>
        <h1
          id="hero-title"
          className="mt-5 max-w-[14ch] text-[3.25rem] leading-[0.92] font-bold text-white uppercase sm:text-7xl lg:text-[6.25rem]"
        >
          Seu próximo destino começa aqui.
        </h1>
        <p className="mt-6 max-w-xl font-display text-2xl font-semibold tracking-[0.02em] text-orange uppercase sm:text-[1.75rem]">
          Qualidade e confiança em cada embarcação.
        </p>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          Fabricamos embarcações em alumínio com projeto 100% personalizado para os rios da Amazônia
          — e cuidamos delas com reparos, manutenção, motores de popa e estofamento.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/orcamento" className="btn-primary px-7">
            Solicitar orçamento <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <Link to="/produtos" className="btn-outline-light px-7">
            Ver embarcações
          </Link>
        </div>
      </div>

      <div className="border-t border-white/15 bg-graphite-deep/40 backdrop-blur-[2px]">
        <ul className="container-x grid grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c, i) => (
            <li key={c.label} className={i > 0 ? 'lg:border-l lg:border-white/15' : ''}>
              <Link
                to={c.to}
                className={`group flex min-h-16 items-center gap-3 py-4 font-display text-[0.9375rem] font-semibold tracking-[0.08em] text-white/90 uppercase hover:text-white sm:text-base ${
                  i % 2 === 1 ? 'pl-4 sm:pl-6' : ''
                } ${i > 0 ? 'lg:pl-6' : ''}`}
              >
                <span aria-hidden="true" className="font-sans text-xs text-orange">
                  0{i + 1}
                </span>
                <span className="underline-offset-4 group-hover:underline group-hover:decoration-orange">
                  {c.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section
      aria-labelledby="sobre-title"
      className="border-t border-steel-light py-14 sm:py-20 lg:py-28"
    >
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <Reveal>
          <SectionHeading
            id="sobre-title"
            eyebrow="Ceará Náutica"
            title={
              <>
                Feitas para o rio.
                <br />
                <span className="text-steel">Feitas para você.</span>
              </>
            }
          />
          <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-graphite">
            <p>
              A Ceará Náutica é náutica e estaleiro em Manaus. Trabalhamos com{' '}
              <strong className="font-semibold text-graphite-deep">
                barcos de alumínio em Manaus
              </strong>{' '}
              — lanchas, canoas, botes e semi-chatas — com projeto personalizado, pintura na cor que
              você escolher e foco em resistência, leveza, segurança, conforto e durabilidade.
            </p>
            <p>
              Além da fabricação de embarcações, fazemos reparos e manutenção náutica, revendemos
              motores de popa e produzimos estofamentos. Já entregamos embarcações para outras
              regiões, como Belém e o Suriname.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <Link
              to="/sobre"
              className="link-underline inline-flex min-h-11 items-center font-display text-lg font-semibold tracking-[0.06em] uppercase"
            >
              Conheça a empresa
            </Link>
            <Link
              to="/servicos"
              className="link-underline inline-flex min-h-11 items-center font-display text-lg font-semibold tracking-[0.06em] uppercase"
            >
              Nossos serviços
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.05} className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-md bg-steel-light sm:aspect-[4/3] lg:aspect-[4/5]">
            <SmartImage
              src="/images/sobre.webp"
              alt="Pequena embarcação navegando próxima a um píer em rio de águas barrentas"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-full w-full object-cover"
              width={1280}
              height={960}
            />
          </div>
          <div className="absolute -bottom-6 left-6 hidden max-w-[16rem] rounded-sm bg-graphite-deep p-5 text-white sm:block">
            <p className="eyebrow text-orange">Projeto 100% personalizado</p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Medidas, layout, motorização e cor definidos com a nossa equipe.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Featured() {
  const { data, loading } = useProducts();
  const items = homeFeatured(data);
  return (
    <section
      aria-labelledby="destaques-title"
      className="border-t border-steel-light bg-white py-20 lg:py-28"
    >
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="destaques-title"
            eyebrow="Projetos em destaque"
            title="Embarcações em alumínio"
            intro="Projetos fabricados pela Ceará Náutica e publicados no nosso Instagram. Cada embarcação é feita sob medida."
          />
          <Link to="/produtos" className="btn-outline shrink-0 self-start md:self-auto">
            Ver todas <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
        {loading ? (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-[26rem] animate-pulse rounded-md bg-steel-light/60" />
            ))}
          </ul>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <Reveal
                as="li"
                key={p.slug}
                delay={Math.min(i, 3) * 0.04}
                className={i >= 3 ? 'hidden sm:block' : undefined}
              >
                <ProductCard product={p} />
              </Reveal>
            ))}
          </ul>
        )}
        <IllustrativeNote className="mt-6" />
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section aria-labelledby="categorias-title" className="py-14 sm:py-20 lg:py-28">
      <div className="container-x">
        <SectionHeading
          id="categorias-title"
          eyebrow="Categorias"
          title="Encontre a sua embarcação"
          intro="Lanchas em Manaus, canoas, botes e semi-chatas em alumínio — além de motores de popa e estofamentos."
        />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => {
            const cover = CATEGORY_COVERS[c.slug];
            return (
              <Reveal as="li" key={c.slug} delay={Math.min(i, 3) * 0.04}>
                <Link
                  to={`/produtos?categoria=${c.slug}`}
                  onClick={() => track('select_category', { category: c.slug, location: 'home' })}
                  className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-md bg-graphite-deep text-white sm:aspect-[5/4]"
                >
                  <SmartImage
                    src={cover.src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-70 transition-[transform,opacity] duration-300 group-hover:scale-[1.04] group-hover:opacity-55"
                    fallbackClassName="absolute inset-0 opacity-20"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,25,28,0)_35%,rgba(23,25,28,0.92)_100%)]"
                  />
                  <span className="relative p-3.5 sm:p-6">
                    <span className="block font-sans text-xs font-semibold text-orange">
                      0{i + 1}
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-3">
                      <span className="font-display text-xl leading-none font-bold uppercase sm:text-3xl">
                        {c.name}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="hidden size-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1 sm:block"
                      />
                    </span>
                    <span className="mt-1 hidden text-sm leading-snug text-white/80 sm:block">
                      {c.description}
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ServicesBlock() {
  return (
    <section
      aria-labelledby="servicos-title"
      className="bg-graphite-deep py-20 text-white lg:py-28"
    >
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="servicos-title"
            tone="dark"
            eyebrow="Serviços"
            title="Do projeto à manutenção"
            intro="Fabricação de embarcações em Manaus, reparos, manutenção náutica, motores de popa e estofamento — tudo em um só lugar."
          />
          <Link to="/servicos" className="btn-outline-light mt-8">
            Todos os serviços <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
        <ol className="border-t border-white/15">
          {SERVICES.map((s, i) => (
            <li key={s.slug} className="border-b border-white/15">
              <Link
                to={`/servicos#${s.slug}`}
                className="group grid grid-cols-[2.5rem_1fr_auto] items-start gap-4 py-6 sm:grid-cols-[3.5rem_1fr_auto] sm:py-7"
              >
                <span className="pt-1.5 font-sans text-sm font-semibold text-orange">0{i + 1}</span>
                <span>
                  <span className="block font-display text-2xl font-bold uppercase sm:text-3xl">
                    {s.title}
                  </span>
                  <span className="mt-2 block max-w-xl text-[0.9375rem] leading-relaxed text-white/70">
                    {s.summary}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1.5 size-6 text-white/50 transition-[transform,color] duration-200 group-hover:translate-x-1 group-hover:text-orange"
                />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Differentials() {
  return (
    <section aria-labelledby="diferenciais-title" className="py-20 lg:py-28">
      <div className="container-x">
        <SectionHeading
          id="diferenciais-title"
          eyebrow="Por que a Ceará Náutica"
          title="O que fazemos, sem rodeios"
          intro="Sem números de vitrine: estes são os fatos sobre o nosso trabalho."
        />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFERENTIALS.map((d, i) => (
            <Reveal
              as="li"
              key={d.title}
              delay={(i % 4) * 0.04}
              className="border-t-2 border-graphite-deep pt-5"
            >
              <h3 className="text-2xl font-bold uppercase">{d.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-steel">{d.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const spans = ['lg:col-span-2 lg:row-span-2', '', '', 'lg:row-span-2', '', '', '', ''];
  return (
    <section
      aria-labelledby="galeria-title"
      className="border-t border-steel-light bg-white py-20 lg:py-28"
    >
      <div className="container-x">
        <SectionHeading
          id="galeria-title"
          eyebrow="Galeria"
          title="A vida no rio"
          intro="Lazer, pesca, trabalho e transporte: embarcações fazem parte do dia a dia na Amazônia."
        />
        <ul className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] lg:grid-cols-4 lg:gap-4">
          {GALLERY.map((g, i) => (
            <li
              key={g.src}
              className={`${spans[i] ?? ''} overflow-hidden rounded-md bg-steel-light`}
            >
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="group relative block h-full w-full"
              >
                <SmartImage
                  src={g.src}
                  alt={g.alt}
                  sizes="(min-width: 1024px) 40vw, 50vw"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-2 bottom-2 inline-flex size-9 items-center justify-center rounded-sm bg-graphite-deep/70 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Expand className="size-4" />
                </span>
                <span className="sr-only">Ampliar imagem</span>
              </button>
            </li>
          ))}
        </ul>
        <IllustrativeNote className="mt-6" />
      </div>
      <Lightbox
        images={GALLERY}
        index={index}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
        label="Galeria de fotos"
      />
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Seo
        title="Ceará Náutica — Estaleiro e barcos de alumínio em Manaus"
        description="Barcos de alumínio sob medida em Manaus: lanchas, canoas, botes e semi-chatas. Também reparos, manutenção náutica, motores de popa e estofamento."
        path="/"
        jsonLd={localBusinessJsonLd()}
      />
      <Hero />
      <Categories />
      <Intro />
      <Featured />
      <ServicesBlock />
      <Differentials />
      <Gallery />
      <CtaBand context="geral" />
    </>
  );
}
