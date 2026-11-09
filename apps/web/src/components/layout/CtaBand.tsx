import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-graphite-deep text-white">
      <div className="absolute inset-0 -z-10">
        <SmartImage
          src="/images/cta-rio.webp"
          alt=""
          widths={[640, 1280]}
          maxWidth={1920}
          sizes="100vw"
          className="h-full w-full object-cover opacity-40"
          fallbackClassName="hidden"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,25,28,0.92)_0%,rgba(23,25,28,0.6)_100%)]" />
      </div>
      <div className="container-x flex flex-col gap-10 py-20 lg:flex-row lg:items-end lg:justify-between lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-3 text-orange">
            <span aria-hidden="true" className="h-px w-8 bg-current" />
            Orçamento
          </p>
          <h2 id="cta-title" className="mt-3 text-[2.5rem] leading-[0.98] font-bold text-white uppercase sm:text-6xl">
            Vamos projetar a sua embarcação?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Conte como você vai usar o barco — lazer, pesca, trabalho ou transporte. Um vendedor
            da nossa equipe retorna para montar o projeto com você.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Link to="/orcamento" className="btn-primary px-7">
            Solicitar orçamento <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <WhatsAppCta location="cta_band" className="btn-outline-light px-7" fallbackTo="/contato" fallbackLabel="Fale com a equipe" />
        </div>
      </div>
    </section>
  );
}
