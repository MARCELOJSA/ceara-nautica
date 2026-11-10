import { Plus } from 'lucide-react';
import { SectionHeading } from './Reveal';

export interface FaqItem {
  q: string;
  a: string;
}

/** Perguntas frequentes com <details> nativo (acessível e sem JS). */
export function Faq({ items, id = 'perguntas-frequentes' }: { items: FaqItem[]; id?: string }) {
  return (
    <section aria-labelledby={id} className="border-t border-steel-light bg-white py-16 lg:py-24">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
        <SectionHeading
          id={id}
          eyebrow="Dúvidas"
          title="Perguntas frequentes"
          intro="O que não está aqui é informado no orçamento — sem promessas que não podemos cumprir."
        />
        <div className="divide-y divide-steel-light border-y border-steel-light">
          {items.map((it) => (
            <details key={it.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl font-semibold uppercase marker:hidden [&::-webkit-details-marker]:hidden">
                {it.q}
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 text-orange-ink transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="pb-5 leading-relaxed text-graphite">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
