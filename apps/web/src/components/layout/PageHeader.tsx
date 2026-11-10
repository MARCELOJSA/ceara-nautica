import type { ReactNode } from 'react';
import { Breadcrumb, type Crumb } from '@/components/ui/Breadcrumb';
import { SmartImage } from '@/components/ui/SmartImage';

interface Props {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  /**
   * Versão curta e COMPLETA da introdução para o celular (UX-20). Substitui a
   * longa abaixo de `sm`, em vez de cortá-la com reticências no meio da frase.
   */
  introShort?: ReactNode;
  crumbs: Crumb[];
  image?: { src: string; alt: string };
  children?: ReactNode;
  /**
   * Versão baixa no celular (catálogo, UX-09): menos respiro e título menor,
   * para os filtros e resultados aparecerem na 1ª tela. Para encurtar o texto,
   * use `introShort` (nunca cortar a frase).
   */
  compact?: boolean;
}

/** Cabeçalho das páginas internas: faixa grafite, filete laranja e foto opcional. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  introShort,
  crumbs,
  image,
  children,
  compact = false,
}: Props) {
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
      <div
        className={`container-x ${compact ? 'pt-4 pb-6 sm:pt-10 sm:pb-14 lg:pb-20' : 'pt-8 pb-14 sm:pt-10 lg:pb-20'}`}
      >
        <Breadcrumb items={crumbs} tone="dark" />
        <div className={`max-w-3xl ${compact ? 'mt-4 sm:mt-10 lg:mt-14' : 'mt-10 lg:mt-14'}`}>
          <p
            className={`eyebrow flex items-center gap-3 text-orange ${compact ? 'max-sm:hidden' : ''}`}
          >
            <span aria-hidden="true" className="h-px w-8 bg-current" />
            {eyebrow}
          </p>
          <h1
            className={`leading-[0.98] font-bold text-white uppercase sm:mt-3 sm:text-6xl lg:text-7xl ${compact ? 'text-[2.125rem]' : 'mt-3 text-[2.75rem]'}`}
          >
            {title}
          </h1>
          {intro && (
            <p
              className={`max-w-2xl leading-relaxed text-white/80 sm:mt-5 sm:text-lg ${compact ? 'mt-2 text-sm' : 'mt-5 text-base'} ${introShort ? 'max-sm:hidden' : ''}`}
            >
              {intro}
            </p>
          )}
          {introShort && (
            <p
              className={`max-w-2xl leading-relaxed text-white/80 sm:hidden ${compact ? 'mt-2 text-sm' : 'mt-5 text-base'}`}
              data-testid="intro-short"
            >
              {introShort}
            </p>
          )}
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
