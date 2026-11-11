import { Link } from 'react-router-dom';
import { getCategory } from '@cn/shared';
import { ArrowRight, ExternalLink, Instagram } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd } from '@/components/seo/jsonld';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/layout/CtaBand';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal, SectionHeading } from '@/components/ui/Reveal';
import { site } from '@/config/site';
import { track } from '@/lib/analytics';
import { useProducts } from '@/hooks/useProducts';
import { publishedProjects } from '@/data/product-info';

const VALUES = ['Resistência', 'Leveza', 'Segurança', 'Conforto', 'Durabilidade'];

/** Etapas — só o que a empresa publica (projeto personalizado, pintura, entregas). */
const STEPS = [
  {
    title: 'Você conta o uso',
    text: 'Lazer, pesca, trabalho ou transporte: o uso define o tipo de embarcação e o projeto.',
  },
  {
    title: 'Projeto sob medida',
    text: 'Medidas, layout e motorização são definidos com a equipe. O projeto é 100% personalizado.',
  },
  {
    title: 'Pintura do seu jeito',
    text: 'A pintura também é personalizada: você escolhe a cor e o acabamento.',
  },
  {
    title: 'Entrega',
    text: 'Em Manaus ou em outras regiões. A empresa já entregou embarcações em Belém e no Suriname.',
  },
];

/**
 * Categorias em destaque (as mesmas dos destaques do Instagram) → catálogo DESTE
 * site (UX-26). O nome da seção diz para onde o botão leva; o Instagram tem
 * link próprio, explícito e marcado como externo.
 */
const FEATURED_CATEGORIES = ['lanchas', 'canoas', 'botes', 'semi-chatas', 'estofamentos'];

export default function About() {
  const { data } = useProducts();
  const projects = publishedProjects(data);
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Sobre', path: '/sobre' },
  ];
  return (
    <>
      <Seo
        title="Sobre a Ceará Náutica — Náutica & Estaleiro em Manaus"
        description="Conheça a Ceará Náutica: fabricação de embarcações em alumínio em Manaus com projeto 100% personalizado, reparos, manutenção, motores de popa e estofamento."
        path="/sobre"
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <PageHeader
        eyebrow="Sobre nós"
        title="Náutica & Estaleiro em Manaus"
        intro="Fabricamos embarcações em alumínio com projeto 100% personalizado, pensadas para os rios da Amazônia."
        crumbs={crumbs}
        image={{ src: '/images/galeria/rio-floresta.webp', alt: '' }}
      />

      <section className="py-20 lg:py-28" aria-labelledby="quem-somos">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeading
              id="quem-somos"
              eyebrow="Quem somos"
              title="Embarcações feitas sob medida para o rio"
            />
            <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-graphite">
              <p>
                A Ceará Náutica atua em Manaus – AM com barcos e embarcações em alumínio:
                fabricação, reparos, manutenções, revenda de motores de popa e estofamentos.
              </p>
              <p>
                Cada embarcação nasce de um projeto personalizado — lanchas, canoas, botes e
                semi-chatas definidos conforme o uso de quem vai navegar, seja lazer, pesca,
                trabalho ou transporte. A pintura também é personalizada: o cliente escolhe a cor.
              </p>
              <p>
                Nossa equipe de vendedores acompanha o cliente do primeiro contato à entrega — que
                pode ser em Manaus ou em outras regiões. Já entregamos embarcações em Belém e no
                Suriname.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-steel-light">
              <SmartImage
                src="/images/sobre.webp"
                alt="Embarcação regional navegando no rio, ao lado de um píer de madeira"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-xs text-steel">Foto ilustrativa.</p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="valores" className="bg-graphite-deep py-16 text-white lg:py-20">
        <div className="container-x">
          <h2 id="valores" className="eyebrow text-orange">
            O que buscamos em cada embarcação
          </h2>
          <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
            {VALUES.map((v) => (
              <li
                key={v}
                className="font-display text-4xl font-bold uppercase sm:text-5xl lg:text-6xl"
              >
                {v}
                <span aria-hidden="true" className="text-orange">
                  .
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 lg:py-28" aria-labelledby="como-funciona">
        <div className="container-x">
          <SectionHeading
            id="como-funciona"
            eyebrow="Como funciona"
            title="Do pedido à entrega"
            intro="O caminho de uma embarcação feita sob medida na Ceará Náutica."
          />
          <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-graphite-deep pt-5">
                <span
                  aria-hidden="true"
                  className="font-display text-sm font-semibold tracking-[0.18em] text-orange-ink"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 text-2xl font-bold uppercase">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-steel">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-3xl text-[0.9375rem] leading-relaxed text-graphite">
            Depois da entrega, a empresa também faz reparos, manutenção, revenda de motores de popa
            e estofamento.{' '}
            <Link to="/servicos" className="link-underline font-medium">
              Ver os serviços
            </Link>
            .
          </p>
        </div>
      </section>

      <section
        className="border-t border-steel-light bg-white py-20 lg:py-28"
        aria-labelledby="projetos-publicados"
      >
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
          <div>
            <SectionHeading
              id="projetos-publicados"
              eyebrow="Projetos publicados"
              title="O que já saiu do estaleiro"
              intro="A Ceará Náutica publica os seus projetos no Instagram desde 2022. Estes são os projetos do catálogo, com a data da publicação original."
            />
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('instagram_click', { location: 'sobre' })}
              className="btn-dark mt-8"
              data-testid="about-instagram"
            >
              <Instagram aria-hidden="true" className="size-5" />
              <span className="whitespace-nowrap">Ver no Instagram</span>
              <span className="font-sans text-sm font-normal tracking-normal normal-case opacity-80 max-sm:sr-only">
                {site.instagramHandle}
              </span>
              <ExternalLink aria-hidden="true" className="size-4 opacity-80" />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            <h3 id="categorias-destaque" className="mt-10 eyebrow text-graphite-deep">
              Categorias em destaque
            </h3>
            <p className="mt-1 text-sm text-steel">Abrem o catálogo aqui no site.</p>
            <ul
              className="mt-3 flex flex-wrap gap-2"
              aria-labelledby="categorias-destaque"
              data-testid="featured-categories"
            >
              {FEATURED_CATEGORIES.map((slug) => {
                const c = getCategory(slug);
                if (!c) return null;
                return (
                  <li key={slug}>
                    <Link
                      to={`/produtos?categoria=${slug}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-steel/30 px-4 font-display text-base font-semibold tracking-[0.06em] text-graphite uppercase transition-colors hover:border-graphite-deep"
                    >
                      {c.name}
                      <ArrowRight aria-hidden="true" className="size-4 text-steel" />
                      <span className="sr-only"> no catálogo do site</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            {projects.length > 0 ? (
              <ol className="border-l border-steel-light" data-testid="published-projects">
                {projects.map((p) => (
                  <li key={p.slug} className="relative pb-6 pl-6 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="absolute top-2 -left-[5px] size-2.5 rounded-full border-2 border-white bg-graphite-deep"
                    />
                    <p className="text-sm text-steel">
                      <time dateTime={p.iso}>{p.date}</time> · {getCategory(p.category)?.name}
                    </p>
                    {/* UX-29: nome sublinhado + "Ver projeto →" deixam claro que é link */}
                    <Link
                      to={`/produtos/${p.slug}`}
                      className="group -mx-2 mt-0.5 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-sm px-2 py-1.5 transition-colors hover:bg-steel-light/40"
                      data-testid="project-link"
                    >
                      <span className="font-display text-xl font-semibold text-graphite-deep uppercase underline decoration-steel/50 decoration-2 underline-offset-4 transition-colors group-hover:text-orange-ink group-hover:decoration-orange-ink">
                        {p.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap text-orange-ink">
                        Ver projeto
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-steel">Carregando projetos…</p>
            )}
            <p className="mt-6 text-xs leading-relaxed text-steel">
              Medidas e detalhes conforme cada publicação. Cada embarcação é feita sob medida: um
              novo projeto pode ter outras medidas e acabamento.
            </p>
          </div>
        </div>
      </section>
      <CtaBand context="geral" />
    </>
  );
}
