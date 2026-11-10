import { useCallback, useEffect, useRef, type TouchEvent } from 'react';
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

/** Distância mínima (px) do gesto horizontal para trocar de foto. */
const SWIPE_MIN = 48;

/**
 * Lightbox acessível: diálogo modal, foco preso, Esc fecha, setas (botões e
 * teclado) navegam e, no celular, arrastar para o lado troca a foto (UX-13).
 * Trocar de foto mantém o foco no controle usado (QA-01, ver useFocusTrap).
 */
export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
  label = 'Visualização de imagem',
}: Props) {
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

  // gesto de arrastar (touch): só conta se for predominantemente horizontal
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swipedAt = useRef(0);
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      touch.current = null;
      return;
    }
    const t = e.touches[0]!;
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    const t = e.changedTouches[0];
    if (!start || !t || images.length < 2) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    swipedAt.current = Date.now();
    go(dx < 0 ? 1 : -1);
  };

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
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2 pb-4 select-none sm:px-16"
        data-testid="lightbox-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => (touch.current = null)}
        onClick={(e) => {
          // o toque que terminou um arrasto não deve fechar a galeria
          if (Date.now() - swipedAt.current < 500) return;
          if (e.target === e.currentTarget) onClose();
        }}
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
          <figcaption className="mt-3 px-4 text-center text-sm text-white/75">
            {img.alt}
            {many && (
              <span className="mt-1 block text-xs text-white/55 lg:hidden">
                Arraste para o lado para ver as outras fotos
              </span>
            )}
          </figcaption>
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
