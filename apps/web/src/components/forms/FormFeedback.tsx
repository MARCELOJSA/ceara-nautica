import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Info, Instagram } from 'lucide-react';
import { site } from '@/config/site';
import { formatPhone } from './phone';
import type { SubmitStatus } from './useLeadSubmit';

/**
 * Repete o telefone informado na tela de sucesso (UX-19) e oferece corrigir.
 * Não promete prazo de retorno (não confirmado pela empresa).
 */
export function PhoneConfirmation({ phone, onEdit }: { phone: string; onEdit: () => void }) {
  return (
    <>
      <p data-testid="success-phone">
        Vamos retornar no{' '}
        <strong className="whitespace-nowrap text-graphite-deep">{formatPhone(phone)}</strong>, por
        ligação ou WhatsApp.
      </p>
      {/* UX-21: pergunta + botão em linha própria (sem frase partida em dois tempos verbais) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="phone-fix">
        <span>Número errado?</span>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center font-semibold text-graphite-deep underline decoration-orange underline-offset-4"
        >
          Corrigir o telefone
        </button>
      </div>
    </>
  );
}

export function FormSuccess({
  title,
  children,
  onReset,
  resetLabel,
}: {
  title: string;
  children: React.ReactNode;
  onReset: () => void;
  resetLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="rounded-md border border-graphite/15 bg-white p-6 outline-none sm:p-8"
    >
      <CheckCircle2 aria-hidden="true" className="size-9 text-orange" strokeWidth={1.75} />
      <h2 className="mt-4 text-3xl font-bold uppercase">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-steel">{children}</div>
      <button type="button" onClick={onReset} className="btn-outline mt-6">
        {resetLabel}
      </button>
    </div>
  );
}

export function FormError({ status }: { status: SubmitStatus }) {
  if (status.kind !== 'error') return null;
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-sm border border-red-700/30 bg-red-50 p-4 text-sm text-red-900"
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">{status.message}</p>
        <p className="mt-1">
          Se preferir, envie uma mensagem direta no Instagram:{' '}
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            {site.instagramHandle}
            <Instagram aria-hidden="true" className="ml-1 inline size-3.5" />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export const SLOW_MESSAGE =
  'Conectando ao servidor… isso pode levar alguns segundos na primeira vez. Não feche a página.';

/** UX-32: depois de ~20 s, "alguns segundos" não é mais verdade. */
export const VERY_SLOW_MESSAGE =
  'Ainda conectando… na primeira vez pode levar até 1 minuto. Seu pedido não se perdeu, aguarde. Não feche a página.';

/**
 * Aviso calmo quando o envio demora (API acordando, docs/HOSTING.md).
 * A região viva existe sempre, para o leitor de tela anunciar quando o texto aparece.
 */
export function SlowNotice({ status }: { status: SubmitStatus }) {
  const slow = status.kind === 'loading' && status.slow === true;
  const verySlow = slow && status.kind === 'loading' && status.verySlow === true;
  return (
    <p
      role="status"
      aria-live="polite"
      data-testid="submit-slow"
      className={
        slow
          ? 'rounded-sm border-l-2 border-graphite/40 bg-white px-4 py-3 text-sm text-graphite'
          : 'sr-only'
      }
    >
      {verySlow ? VERY_SLOW_MESSAGE : slow ? SLOW_MESSAGE : ''}
    </p>
  );
}

export const INTERRUPTED_MESSAGE =
  'Seu envio anterior pode não ter sido concluído. Confira os dados e envie de novo se não recebeu a confirmação.';

/**
 * UX-31: a página foi recarregada/fechada durante um envio. Não sabemos se o
 * pedido chegou; o rascunho foi restaurado e a pessoa decide se reenvia.
 */
export function InterruptedNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="status"
      data-testid="submit-interrupted"
      className="flex gap-3 rounded-sm border-l-2 border-orange bg-white px-4 py-3 text-sm text-graphite"
    >
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-orange-ink" />
      <p>{INTERRUPTED_MESSAGE}</p>
    </div>
  );
}
