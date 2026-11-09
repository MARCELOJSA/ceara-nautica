import { useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiRequestError } from '@/lib/api';

export type SubmitStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; id: string }
  | { kind: 'error'; message: string };

export function messageForError(e: unknown): string {
  if (e instanceof ApiRequestError) {
    if (e.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }
    if (e.status === 429) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    if (e.status === 400) return e.message && e.message !== 'Erro 400' ? `Revise os campos destacados: ${e.message}` : 'Revise os campos destacados.';
    return 'Não foi possível enviar agora. Tente novamente em instantes.';
  }
  return 'Não foi possível enviar agora. Tente novamente em instantes.';
}

/** Executa o POST, mapeia `details` do back para os campos e controla o estado. */
export function useLeadSubmit<T extends FieldValues>(setError: UseFormSetError<T>, fields: readonly string[]) {
  const [status, setStatus] = useState<SubmitStatus>({ kind: 'idle' });

  async function run(send: () => Promise<{ id: string }>, onSuccess?: (id: string) => void) {
    setStatus({ kind: 'loading' });
    try {
      const res = await send();
      setStatus({ kind: 'success', id: res.id });
      onSuccess?.(res.id);
    } catch (e) {
      if (e instanceof ApiRequestError && e.details) {
        for (const [key, msgs] of Object.entries(e.details)) {
          const msg = msgs?.[0];
          if (msg && fields.includes(key)) setError(key as Path<T>, { type: 'server', message: msg });
        }
      }
      setStatus({ kind: 'error', message: messageForError(e) });
    }
  }

  return { status, setStatus, run };
}
