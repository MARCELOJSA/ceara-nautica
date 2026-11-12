import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';
import { MOTOR_ISSUE_HREF } from '@/data/content';

export type CtaContext =
  'embarcacao' | 'motores' | 'motor-problema' | 'estofamento' | 'servicos' | 'geral';

const COPY: Record<CtaContext, { title: string; text: string; to: string }> = {
  embarcacao: {
    title: 'Vamos projetar a sua embarcação?',
    text: 'Conte como você vai usar o barco — lazer, pesca, trabalho ou transporte. Um vendedor da nossa equipe retorna para montar o projeto com você.',
    to: '/orcamento?servico=fabricacao',
  },
  motores: {
    title: 'Procurando um motor de popa?',
    text: 'Conte qual é a sua embarcação e como você navega. A equipe indica a motorização adequada e informa marcas e modelos disponíveis no orçamento.',
    to: '/orcamento?servico=motores&categoria=motores-de-popa',
  },
  // UX-33: busca por defeito no motor ("motor falhando") no catálogo
  'motor-problema': {
    title: 'Problema no motor?',
    text: 'Conte o modelo do motor e o que está acontecendo. A equipe confirma se atende o seu caso e retorna pelo telefone informado.',
    to: MOTOR_ISSUE_HREF,
  },
  estofamento: {
    title: 'Mais conforto a bordo',
    text: 'Assentos, poltronas e reforma de estofados. Envie o que você precisa e a equipe retorna com materiais, cores e prazo no orçamento.',
    to: '/orcamento?servico=estofamento&categoria=estofamentos',
  },
  servicos: {
    title: 'Precisa de um serviço?',
    text: 'Fabricação, reparo, manutenção, motor ou estofamento: descreva a sua necessidade e a nossa equipe retorna pelo telefone informado.',
    to: '/orcamento',
  },
  geral: {
    title: 'Vamos conversar sobre o seu barco?',
    text: 'Nova embarcação, reparo, manutenção, motor de popa ou estofamento — conte o que você precisa e a equipe retorna pelo telefone informado.',
    to: '/orcamento',
  },
};

export function CtaBand({ context = 'embarcacao' }: { context?: CtaContext }) {
  const copy = COPY[context];
  return (
    <section
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden bg-graphite-deep text-white"
    >
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
      <div className="container-x flex flex-col gap-10 py-16 lg:flex-row lg:items-end lg:justify-between lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-3 text-orange">
            <span aria-hidden="true" className="h-px w-8 bg-current" />
            Orçamento
          </p>
          <h2
            id="cta-title"
            className="mt-3 text-[2.5rem] leading-[0.98] font-bold text-white uppercase sm:text-6xl"
          >
            {copy.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">{copy.text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Link to={copy.to} className="btn-primary px-7">
            Solicitar orçamento <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <WhatsAppCta
            location="cta_band"
            className="btn-outline-light px-7"
            instagramLabel="Mensagem no Instagram"
          />
        </div>
      </div>
    </section>
  );
}
