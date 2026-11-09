import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { SmartImage } from './SmartImage';

export interface LightboxImage {
  src: string;
  alt: string;
}

interface Props {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  label?: string;
}

/** Lightbox acessível: diálogo modal, foco preso, Esc fecha, setas navegam. */
export function Lightbox({ images, index, onClose, onIndexChange, label = 'Visualização de imagem' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const open = index !== null && images.length > 0;
  useFocusTrap(ref, open, onClose);

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, go]);

  if (!open || index === null) return null;
  const img = images[index]!;
  const many = images.length > 1;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className="fixed inset-0 z-[70] flex flex-col bg-graphite-deep/95 text-white"
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-sm text-white/75" aria-live="polite">
          {index + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-white/10"
        >
          <X aria-hidden="true" className="size-6" />
          <span className="sr-only">Fechar</span>
        </button>
      </div>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- clique no fundo é atalho; Esc e botão Fechar cobrem teclado */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <figure className="flex max-h-full max-w-6xl flex-col items-center">
          <SmartImage
            key={img.src}
            src={img.src}
            alt={img.alt}
            priority
            sizes="100vw"
            className="max-h-[calc(100dvh-9rem)] w-auto max-w-full rounded-sm object-contain"
            fallbackClassName="h-[50vh] w-[80vw] rounded-sm"
          />
          <figcaption className="mt-3 px-4 text-center text-sm text-white/75">{img.alt}</figcaption>
        </figure>
        {many && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 sm:left-4"
            >
              <ChevronLeft aria-hidden="true" className="size-6" />
              <span className="sr-only">Imagem anterior</span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute top-1/2 right-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 sm:right-4"
            >
              <ChevronRight aria-hidden="true" className="size-6" />
              <span className="sr-only">Próxima imagem</span>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
