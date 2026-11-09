import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { buildSrcSet } from '@/lib/images';

/**
 * <img> responsivo com fallback elegante: nunca exibe imagem quebrada.
 * Convenção do script de imagens: /images/x.webp (maior) + /images/x-640.webp
 * (+ -1280 / -1920 no hero e faixas largas).
 */
interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  /** larguras extras disponíveis além de 640 e da maior */
  widths?: number[];
  maxWidth?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** classes do container do placeholder */
  fallbackClassName?: string;
}

export function SmartImage({
  src,
  alt,
  widths = [640],
  maxWidth = 1280,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
  className,
  fallbackClassName,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} (imagem indisponível)` : 'Imagem indisponível'}
        className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(135deg,#E6E7E9_0_1px,transparent_1px_12px)] bg-steel-light/50 text-steel ${fallbackClassName ?? className ?? ''}`}
      >
        <ImageOff aria-hidden="true" className="size-7" strokeWidth={1.5} />
        <span className="eyebrow text-[0.6875rem]">Imagem em breve</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      srcSet={buildSrcSet(src, widths, maxWidth)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // atributo em minúsculas para compatibilidade com React 18
      {...(priority ? { fetchpriority: 'high' } : {})}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
