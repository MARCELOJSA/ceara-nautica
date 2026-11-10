import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Instagram } from 'lucide-react';
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
      <p>
        Número errado?{' '}
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center font-semibold text-graphite-deep underline decoration-orange underline-offset-4"
        >
          Corrigir o telefone
        </button>{' '}
        e envie de novo.
      </p>
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
