import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getCategory, type Product } from '@cn/shared';
import { SmartImage } from '@/components/ui/SmartImage';
import { productImages } from '@/lib/images';

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-graphite-deep/15 bg-white/90 px-2 py-1 font-display text-[0.6875rem] font-semibold tracking-[0.14em] text-graphite uppercase ${className}`}
      title="Item demonstrativo — será substituído pelo catálogo oficial"
    >
      Demonstrativo
    </span>
  );
}

/** Primeira especificação com valor real (não "Sob consulta"), para dar contexto no card. */
function keySpec(p: Product): string | undefined {
  const s = p.specs.find((x) => x.value && !/sob consulta/i.test(x.value));
  return s ? s.value : undefined;
}

export function ProductCard({
  product,
  headingLevel = 3,
}: {
  product: Product;
  headingLevel?: 2 | 3;
}) {
  const cover = productImages(product)[0];
  const category = getCategory(product.category);
  const spec = keySpec(product);
  const H = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-steel-light bg-white transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-graphite/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-steel-light">
        <SmartImage
          src={cover?.src ?? ''}
          alt={cover?.alt ?? product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          width={640}
          height={480}
        />
        {product.isDemo && <DemoBadge className="absolute top-3 left-3" />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-orange-ink">{category?.name}</p>
        <H className="mt-1.5 text-[1.625rem] leading-tight font-bold uppercase">
          <Link
            to={`/produtos/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-orange"
          >
            {product.name}
          </Link>
        </H>
        <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-steel">
          {product.shortDescription}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {spec ? (
            <span className="truncate font-display text-sm font-semibold tracking-[0.06em] text-graphite uppercase">
              {spec}
            </span>
          ) : (
            <span />
          )}
          <span
            aria-hidden="true"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-steel-light text-graphite-deep transition-colors group-hover:border-orange group-hover:bg-orange"
          >
            <ArrowUpRight className="size-5" />
          </span>
        </div>
      </div>
    </article>
  );
}
