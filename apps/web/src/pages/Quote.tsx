import { useSearchParams } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd } from '@/components/seo/jsonld';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageFallback } from '@/components/layout/Layout';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';
import { useProducts } from '@/hooks/useProducts';
import { SERVICES } from '@/data/content';
import { site } from '@/config/site';
import { whatsappUrl } from '@/lib/whatsapp';

const STEPS = [
  { title: 'Você conta o que precisa', text: 'Tipo de embarcação, uso, tamanho, motorização e cor.' },
  { title: 'Um vendedor retorna', text: 'Nossa equipe entra em contato para entender o projeto.' },
  { title: 'Projeto sob medida', text: 'Definimos juntos a embarcação ideal para o seu uso.' },
];

export default function Quote() {
  const [params] = useSearchParams();
  const { data, loading } = useProducts();
  const produto = params.get('produto') ?? undefined;
  const categoria = params.get('categoria') ?? undefined;
  const servico = SERVICES.find((s) => s.slug === params.get('servico'));
  const initialMessage = servico ? `Tenho interesse no serviço: ${servico.title}.\n\n` : '';
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Orçamento', path: '/orcamento' },
  ];

  return (
    <>
      <Seo
        title="Solicite um orçamento — Embarcações em alumínio em Manaus"
        description="Peça o orçamento da sua lancha, canoa, bote ou semi-chata em alumínio, motor de popa, reparo, manutenção ou estofamento. Ceará Náutica, Manaus – AM."
        path="/orcamento"
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <PageHeader
        eyebrow="Orçamento"
        title="Solicite seu orçamento"
        intro="Cada embarcação é feita sob medida. Quanto mais detalhes você enviar, mais preciso será o retorno da nossa equipe."
        crumbs={crumbs}
      />
      <section className="py-14 lg:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            {loading ? (
              <PageFallback />
            ) : (
              <QuoteForm
                products={data}
                initialProductSlug={produto}
                initialCategory={categoria}
                initialMessage={initialMessage}
              />
            )}
          </div>
          <aside aria-labelledby="como-funciona" className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="como-funciona" className="eyebrow text-graphite-deep">
              Como funciona
            </h2>
            <ol className="mt-4 space-y-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-display text-3xl leading-none font-bold text-orange-ink">0{i + 1}</span>
                  <span>
                    <span className="block font-display text-xl font-semibold uppercase">{s.title}</span>
                    <span className="block text-sm leading-relaxed text-steel">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-8 rounded-md border border-steel-light bg-white p-5">
              <p className="text-sm text-graphite">Prefere conversar antes?</p>
              <div className="mt-3 flex flex-col gap-2">
                {whatsappUrl() && <WhatsAppCta location="orcamento" className="btn-dark w-full" />}
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full"
                >
                  <Instagram aria-hidden="true" className="size-5" /> Mensagem no Instagram
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
