import { useEffect, useRef, useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiRequestError, ApiTimeoutError } from '@/lib/api';
import { clearDraft, clearPending, markPending, hasPending, type FormKey } from './formDraft';

export type SubmitStatus =
  | { kind: 'idle' }
  /**
   * `slow`: passou de SLOW_NOTICE_MS sem resposta (API provavelmente acordando).
   * `verySlow`: passou de VERY_SLOW_NOTICE_MS (UX-32: avisa que pode levar até 1 min).
   */
  | { kind: 'loading'; slow?: boolean; verySlow?: boolean }
  | { kind: 'success'; id: string }
  | { kind: 'error'; message: string };

/** A partir daqui o envio mostra o aviso calmo de "Conectando ao servidor…". */
export const SLOW_NOTICE_MS = 4000;
/** UX-32: depois disso, "alguns segundos" já não é verdade; o aviso muda. */
export const VERY_SLOW_NOTICE_MS = 20_000;

/** UX-31: o navegador pede confirmação antes de recarregar/fechar durante o envio. */
function blockUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  // navegadores antigos exigem returnValue para mostrar o diálogo
  e.returnValue = '';
}

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
 *
 * UX-31: durante o POST, `beforeunload` pede confirmação e uma marca no
 * sessionStorage registra o envio em andamento. Se a página for recarregada no
 * meio, `interrupted` vem `true` ao voltar (a pessoa confere e reenvia; nada é
 * reenviado sozinho). No sucesso, o rascunho do formulário é apagado.
 */
export function useLeadSubmit<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly string[],
  formKey: FormKey,
) {
  const [status, setStatus] = useState<SubmitStatus>({ kind: 'idle' });
  // lido sem efeito colateral (StrictMode chama o inicializador duas vezes)…
  const [interrupted, setInterrupted] = useState(() => hasPending(formKey));
  const inFlight = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopWaiting = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    window.removeEventListener('beforeunload', blockUnload);
  };

  // …e consumido ao montar: a mensagem aparece uma vez, ao voltar à página
  useEffect(() => {
    if (!inFlight.current) clearPending(formKey);
  }, [formKey]);

  // ao sair da página pela navegação interna: sem timers nem aviso pendurados
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener('beforeunload', blockUnload);
    },
    [],
  );

  async function run(send: () => Promise<{ id: string }>, onSuccess?: (id: string) => void) {
    if (inFlight.current) return;
    inFlight.current = true;
    setInterrupted(false);
    setStatus({ kind: 'loading' });
    markPending(formKey);
    window.addEventListener('beforeunload', blockUnload);
    timers.current = [
      setTimeout(() => {
        setStatus((s) => (s.kind === 'loading' ? { kind: 'loading', slow: true } : s));
      }, SLOW_NOTICE_MS),
      setTimeout(() => {
        setStatus((s) =>
          s.kind === 'loading' ? { kind: 'loading', slow: true, verySlow: true } : s,
        );
      }, VERY_SLOW_NOTICE_MS),
    ];
    try {
      const res = await send();
      clearDraft(formKey);
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
      stopWaiting();
      clearPending(formKey);
      inFlight.current = false;
    }
  }

  return { status, setStatus, run, interrupted };
}
