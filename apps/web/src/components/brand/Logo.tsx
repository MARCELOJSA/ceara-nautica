import { useId } from 'react';

/**
 * Logo da Ceará Náutica recriada em SVG a partir de public/brand/logo-original.jpg:
 * barco estilizado em grafite com cortes brancos, "CEARÁ NÁUTICA" em laranja e
 * "NÁUTICA & ESTALEIRO" entre filetes. Os cortes usam máscara (transparência real),
 * então a marca funciona sobre fundo claro e escuro.
 */

interface MarkProps {
  className?: string;
  color?: string;
  title?: string;
}

export function BoatMark({ className, color = 'currentColor', title }: MarkProps) {
  return (
    <svg
      viewBox="64 124 516 206"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <MarkShapes color={color} />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** "light" = para fundos claros; "dark" = para fundos escuros */
  tone?: 'light' | 'dark';
  /** horizontal (cabeçalho) ou empilhada (fiel à original) */
  layout?: 'horizontal' | 'stacked';
}

export function Logo({ className, tone = 'light', layout = 'horizontal' }: LogoProps) {
  const markColor = tone === 'light' ? '#55585D' : '#C9CBCF';
  const subColor = tone === 'light' ? '#2B2E33' : '#E6E7E9';
  const lineColor = tone === 'light' ? '#9A9EA4' : '#6B7078';

  if (layout === 'stacked') {
    return (
      <svg viewBox="0 0 520 330" className={className} role="img" aria-label="Ceará Náutica — Náutica & Estaleiro">
        <svg x="40" y="0" width="440" height="176" viewBox="64 124 516 206">
          <MarkShapes color={markColor} />
        </svg>
        <line x1="0" y1="204" x2="40" y2="204" stroke={lineColor} strokeWidth="3" />
        <line x1="480" y1="204" x2="520" y2="204" stroke={lineColor} strokeWidth="3" />
        <text
          x="260"
          y="232"
          textAnchor="middle"
          fill="#E8731A"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="600"
          fontSize="58"
          letterSpacing="1.5"
        >
          CEARÁ NÁUTICA
        </text>
        <line x1="0" y1="284" x2="120" y2="284" stroke={lineColor} strokeWidth="3" />
        <line x1="400" y1="284" x2="520" y2="284" stroke={lineColor} strokeWidth="3" />
        <text
          x="260"
          y="292"
          textAnchor="middle"
          fill={subColor}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="24"
          letterSpacing="1"
        >
          NÁUTICA &amp; ESTALEIRO
        </text>
      </svg>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <BoatMark className="h-9 w-auto shrink-0 sm:h-10" color={markColor} />
      <span className="flex flex-col leading-none">
        <span
          className="font-sans text-[1.0625rem] font-semibold tracking-[0.04em] whitespace-nowrap text-orange sm:text-[1.1875rem]"
          style={{ color: '#E8731A' }}
        >
          CEARÁ NÁUTICA
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          <span aria-hidden="true" className="h-px w-3 shrink-0" style={{ background: lineColor }} />
          <span
            className="text-[0.5625rem] font-bold tracking-[0.12em] whitespace-nowrap sm:text-[0.625rem]"
            style={{ color: subColor }}
          >
            NÁUTICA &amp; ESTALEIRO
          </span>
          <span aria-hidden="true" className="h-px w-3 shrink-0" style={{ background: lineColor }} />
        </span>
      </span>
      <span className="sr-only">Ceará Náutica — página inicial</span>
    </span>
  );
}

const CUTS = [
  { d: 'M150 228 C 215 196, 300 176, 392 179', w: 9 },
  { d: 'M92 304 C 230 252, 400 215, 572 186', w: 10 },
  { d: 'M318 312 C 380 282, 470 274, 522 318', w: 10 },
];
const HULL =
  'M72 324 C 110 300, 135 282, 152 262 L 140 212 C 200 178, 262 150, 322 132 L 392 178 L 576 176 C 545 205, 505 240, 470 262 C 495 275, 515 300, 522 322 C 470 300, 400 300, 320 312 C 230 320, 150 324, 72 324 Z';

/** Casco + cortes (máscara com id único por instância). */
function MarkShapes({ color }: { color: string }) {
  const id = `cn-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="400">
          <rect x="0" y="0" width="640" height="400" fill="#fff" />
          <g fill="none" stroke="#000" strokeLinecap="round">
            {CUTS.map((c) => (
              <path key={c.d} d={c.d} strokeWidth={c.w} />
            ))}
          </g>
          <circle cx="267" cy="241" r="7" fill="#000" />
          <circle cx="305" cy="236" r="7" fill="#000" />
        </mask>
      </defs>
      <path mask={`url(#${id})`} fill={color} d={HULL} />
    </>
  );
}
