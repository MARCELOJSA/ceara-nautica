import { Link } from 'react-router-dom';
import { ArrowRight, Check, Wrench } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd, faqJsonLd } from '@/components/seo/jsonld';
import { Faq } from '@/components/ui/Faq';
import { IllustrativeNote, PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/layout/CtaBand';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal } from '@/components/ui/Reveal';
import { FAQ, SERVICES } from '@/data/content';

export default function Services() {
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Serviços', path: '/servicos' },
  ];
  return (
    <>
      <Seo
        title="Serviços náuticos e reparos em Manaus"
        description="Fabricação de embarcações em alumínio em Manaus, reparos, manutenção náutica, revenda de motores de popa e estofamento náutico. Fale com a Ceará Náutica."
        path="/servicos"
        jsonLd={[breadcrumbJsonLd(crumbs), faqJsonLd(FAQ)]}
      />
      <PageHeader
        eyebrow="Serviços"
        title="Do estaleiro ao rio"
        intro="Fabricação de embarcações em alumínio, reparos, manutenção náutica, motores de popa e estofamento — em Manaus – AM."
        crumbs={crumbs}
        image={{ src: '/images/servicos/fabricacao.webp', alt: '' }}
      >
        <nav aria-label="Serviços nesta página" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <a
                  href={`#${s.slug}`}
                  className="inline-flex min-h-11 items-center rounded-sm border border-white/25 px-4 font-display text-base font-semibold tracking-[0.06em] text-white uppercase hover:border-orange hover:text-orange"
                >
                  {s.kicker}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="py-8 lg:py-12">
        {SERVICES.map((s, i) => {
          const reverse = i % 2 === 1;
          return (
            <section
              key={s.slug}
              id={s.slug}
              aria-labelledby={`${s.slug}-title`}
              className="py-10 lg:py-14"
            >
              <div
                className={`container-x grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                <Reveal className="relative">
                  <div className="aspect-[4/3] overflow-hidden rounded-md bg-steel-light">
                    <SmartImage
                      src={s.image}
                      alt={s.imageAlt}
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="h-full w-full object-cover"
                      width={1280}
                      height={960}
                    />
                  </div>
                  <span
                    aria-hidden="true"
                    className={`absolute top-3 rounded-sm bg-graphite-deep/80 px-3 py-1 font-display text-4xl leading-none font-bold text-orange sm:text-5xl ${reverse ? 'right-3' : 'left-3'}`}
                  >
                    0{i + 1}
                  </span>
                </Reveal>
                <Reveal delay={0.05}>
                  <p className="eyebrow flex items-center gap-3 text-orange-ink">
                    <span aria-hidden="true" className="h-px w-8 bg-current" />
                    {s.kicker}
                  </p>
                  <h2
                    id={`${s.slug}-title`}
                    className="mt-3 text-4xl leading-[1] font-bold uppercase sm:text-5xl"
                  >
                    {s.title}
                  </h2>
                  <p className="mt-5 text-[1.0625rem] leading-relaxed text-graphite">{s.summary}</p>
                  <ul className="mt-6 space-y-2.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-graphite">
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-5 shrink-0 text-orange-ink"
                          strokeWidth={2.25}
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link to={s.cta.to} className="btn-primary">
                      {s.cta.label} <ArrowRight aria-hidden="true" className="size-5" />
                    </Link>
                    {/* UX-22: caminho próprio para quem tem o motor com problema */}
                    {s.secondaryCta && (
                      <Link
                        to={s.secondaryCta.to}
                        className="btn-outline"
                        data-testid={`service-secondary-${s.slug}`}
                      >
                        <Wrench aria-hidden="true" className="size-5" />
                        {s.secondaryCta.label}
                      </Link>
                    )}
                  </div>
                </Reveal>
              </div>
            </section>
          );
        })}
        <div className="container-x">
          <IllustrativeNote />
        </div>
      </div>
      <Faq items={FAQ} />
      <CtaBand context="servicos" />
    </>
  );
}
