import type { ReactNode } from 'react';
import { Breadcrumb, type Crumb } from '@/components/ui/Breadcrumb';
import { SmartImage } from '@/components/ui/SmartImage';

interface Props {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs: Crumb[];
  image?: { src: string; alt: string };
  children?: ReactNode;
}

/** Cabeçalho das páginas internas: faixa grafite, filete laranja e foto opcional. */
export function PageHeader({ eyebrow, title, intro, crumbs, image, children }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-graphite-deep text-white">
      {image && (
        <div className="absolute inset-0 -z-10">
          <SmartImage
            src={image.src}
            alt=""
            priority
            sizes="100vw"
            className="h-full w-full object-cover opacity-35"
            fallbackClassName="hidden"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#17191C_0%,rgba(23,25,28,0.88)_45%,rgba(23,25,28,0.55)_100%)]" />
        </div>
      )}
      <div className="container-x pt-8 pb-14 sm:pt-10 lg:pb-20">
        <Breadcrumb items={crumbs} tone="dark" />
        <div className="mt-10 max-w-3xl lg:mt-14">
          <p className="eyebrow flex items-center gap-3 text-orange">
            <span aria-hidden="true" className="h-px w-8 bg-current" />
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[2.75rem] leading-[0.98] font-bold text-white uppercase sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          {intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{intro}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function IllustrativeNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-steel ${className}`}>
      Fotos meramente ilustrativas (banco de imagens). As fotos reais das embarcações da Ceará
      Náutica estão no nosso Instagram.
    </p>
  );
}
