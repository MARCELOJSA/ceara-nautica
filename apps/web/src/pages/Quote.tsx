import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { DEMO_PRODUCTS } from '@cn/shared';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd } from '@/components/seo/jsonld';
import { PageHeader } from '@/components/layout/PageHeader';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';
import { useProducts } from '@/hooks/useProducts';
import { useWakeApi } from '@/hooks/useWakeApi';
import { quotePageCopy, quotePreset } from '@/data/content';
import { site } from '@/config/site';
import { whatsappUrl } from '@/lib/whatsapp';

export default function Quote() {
  useWakeApi();
  const [params] = useSearchParams();
  const { data, loading } = useProducts();
  const produto = params.get('produto') ?? undefined;
  // ?servico= define tipo, mensagem inicial e (se a URL não trouxer) a categoria
  const preset = quotePreset(params.get('servico'));
  const categoria = params.get('categoria') ?? preset?.category;
  const initialRequestType = preset?.requestType;
  // UX-30: topo e "Como funciona" acompanham o tipo do pedido (serviço, motor, embarcação)
  const [requestType, setRequestType] = useState<string>(initialRequestType ?? '');
  const copy = quotePageCopy(requestType);
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Orçamento', path: '/orcamento' },
  ];

  return (
    <>
      <Seo
        title="Orçamento de barcos em alumínio em Manaus"
        description="Peça o orçamento da sua lancha, canoa, bote ou semi-chata em alumínio, motor de popa, reparo, manutenção ou estofamento. Ceará Náutica, Manaus – AM."
        path="/orcamento"
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <PageHeader eyebrow="Orçamento" title={copy.title} intro={copy.intro} crumbs={crumbs} />
      <section className="py-14 lg:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            {/*
              Sem esperar a API: com ela dormindo (docs/HOSTING.md) a pessoa já
              pode preencher; a lista de modelos usa o catálogo local até a
              resposta chegar.
            */}
            <QuoteForm
              products={loading ? DEMO_PRODUCTS : data}
              initialProductSlug={produto}
              initialCategory={categoria}
              initialRequestType={initialRequestType}
              onRequestTypeChange={setRequestType}
            />
          </div>
          <aside aria-labelledby="como-funciona" className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="como-funciona" className="eyebrow text-graphite-deep">
              Como funciona
            </h2>
            <ol className="mt-4 space-y-5" data-testid="quote-steps">
              {copy.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-display text-3xl leading-none font-bold text-orange-ink">
                    0{i + 1}
                  </span>
                  <span>
                    <span className="block font-display text-xl font-semibold uppercase">
                      {s.title}
                    </span>
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
