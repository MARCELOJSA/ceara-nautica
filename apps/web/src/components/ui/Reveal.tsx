import type { ReactNode } from 'react';
import { m } from 'framer-motion';

/** Entrada discreta (≤300ms). MotionConfig reducedMotion="user" desliga para quem prefere. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  const Comp = as === 'li' ? m.li : as === 'section' ? m.section : m.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Comp>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = 'light',
  align = 'left',
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  id?: string;
}) {
  const dark = tone === 'dark';
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p
        className={`eyebrow flex items-center gap-3 ${dark ? 'text-orange' : 'text-orange-ink'} ${align === 'center' ? 'justify-center' : ''}`}
      >
        <span aria-hidden="true" className="h-px w-8 bg-current" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`mt-3 text-[2.125rem] leading-[1.02] font-bold uppercase sm:text-5xl ${dark ? 'text-white' : 'text-graphite-deep'}`}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? 'text-white/75' : 'text-steel'}`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
