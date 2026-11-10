import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd } from '@/components/seo/jsonld';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/layout/CtaBand';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal, SectionHeading } from '@/components/ui/Reveal';
import { DIFFERENTIALS } from '@/data/content';
import { site } from '@/config/site';
import { track } from '@/lib/analytics';

const VALUES = ['Resistência', 'Leveza', 'Segurança', 'Conforto', 'Durabilidade'];

export default function About() {
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
                src="/images/galeria/aluminio-atracado.webp"
                alt="Barcos de alumínio atracados em um píer"
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

      <section className="py-20 lg:py-28" aria-labelledby="o-que-fazemos">
        <div className="container-x">
          <SectionHeading
            id="o-que-fazemos"
            eyebrow="O que fazemos"
            title="Fatos sobre o nosso trabalho"
          />
          <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIALS.map((d) => (
              <li key={d.title} className="border-t-2 border-graphite-deep pt-5">
                <h3 className="text-2xl font-bold uppercase">{d.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-steel">{d.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-14 flex flex-col gap-4 rounded-md border border-steel-light bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="max-w-2xl text-graphite">
              Quer ver os projetos reais? Publicamos as embarcações fabricadas no nosso Instagram.
            </p>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('instagram_click', { location: 'sobre' })}
              className="btn-dark shrink-0"
            >
              <Instagram aria-hidden="true" className="size-5" /> {site.instagramHandle}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </div>
          <p className="mt-6 text-sm text-steel">
            Veja também os nossos{' '}
            <Link to="/servicos" className="link-underline">
              serviços
            </Link>{' '}
            e as{' '}
            <Link to="/produtos" className="link-underline">
              embarcações
            </Link>
            .
          </p>
        </div>
      </section>
      <CtaBand context="geral" />
    </>
  );
}
