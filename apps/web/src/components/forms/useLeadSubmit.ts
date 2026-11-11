import { useEffect, useRef, useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiRequestError, ApiTimeoutError } from '@/lib/api';

export type SubmitStatus =
  | { kind: 'idle' }
  /** `slow`: passou de SLOW_NOTICE_MS sem resposta (API provavelmente acordando) */
  | { kind: 'loading'; slow?: boolean }
  | { kind: 'success'; id: string }
  | { kind: 'error'; message: string };

/** A partir daqui o envio mostra o aviso calmo de "Conectando ao servidor…". */
export const SLOW_NOTICE_MS = 4000;

const KEEP = 'O que você escreveu continua no formulário.';

export function messageForError(e: unknown): string {
  if (e instanceof ApiTimeoutError) {
    return `O servidor demorou para responder. ${KEEP} Tente enviar de novo.`;
  }
  if (e instanceof ApiRequestError) {
    if (e.status === 0) {
      return `Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente. ${KEEP}`;
    }
    if (e.status === 429)
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    if (e.status === 400)
      return e.message && e.message !== 'Erro 400'
        ? `Revise os campos destacados: ${e.message}`
        : 'Revise os campos destacados.';
    return `Não foi possível enviar agora. ${KEEP} Tente novamente em instantes.`;
  }
  return `Não foi possível enviar agora. ${KEEP} Tente novamente em instantes.`;
}

/**
 * Executa o POST, mapeia `details` do back para os campos e controla o estado.
 * Um envio por vez (sem duplo POST) e nenhum reenvio automático.
 */
export function useLeadSubmit<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly string[],
) {
  const [status, setStatus] = useState<SubmitStatus>({ kind: 'idle' });
  const inFlight = useRef(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(slowTimer.current), []);

  async function run(send: () => Promise<{ id: string }>, onSuccess?: (id: string) => void) {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus({ kind: 'loading' });
    slowTimer.current = setTimeout(() => {
      setStatus((s) => (s.kind === 'loading' ? { kind: 'loading', slow: true } : s));
    }, SLOW_NOTICE_MS);
    try {
      const res = await send();
      setStatus({ kind: 'success', id: res.id });
      onSuccess?.(res.id);
    } catch (e) {
      if (e instanceof ApiRequestError && e.details) {
        for (const [key, msgs] of Object.entries(e.details)) {
          const msg = msgs?.[0];
          if (msg && fields.includes(key))
            setError(key as Path<T>, { type: 'server', message: msg });
        }
      }
      setStatus({ kind: 'error', message: messageForError(e) });
    } finally {
      clearTimeout(slowTimer.current);
      inFlight.current = false;
    }
  }

  return { status, setStatus, run };
}
