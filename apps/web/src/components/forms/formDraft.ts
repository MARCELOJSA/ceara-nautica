import { useEffect } from 'react';
import type { FieldValues, Path, PathValue, UseFormSetValue, UseFormWatch } from 'react-hook-form';

/**
 * UX-31: rascunho do formulário e marca de "envio em andamento" no
 * sessionStorage (some ao fechar a aba). Só campos de texto: o consentimento
 * LGPD e o honeypot NUNCA são guardados. Toda leitura/escrita fica em
 * try/catch (modo privado, cota cheia, storage bloqueado).
 */
export type FormKey = 'contact' | 'quote';

const DRAFT_PREFIX = 'cn_draft_';
const PENDING_PREFIX = 'cn_pending_';
/** Nunca entram no rascunho, mesmo que alguém os inclua na lista por engano. */
const NEVER_SAVE = new Set(['consent', 'website']);
const MAX_LEN = 5000;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function safeFields(fields: readonly string[]): string[] {
  return fields.filter((f) => !NEVER_SAVE.has(f));
}

export function readDraft(key: FormKey, fields: readonly string[]): Record<string, string> {
  try {
    const raw = storage()?.getItem(DRAFT_PREFIX + key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const f of safeFields(fields)) {
      const v = (parsed as Record<string, unknown>)[f];
      if (typeof v === 'string' && v) out[f] = v.slice(0, MAX_LEN);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveDraft(
  key: FormKey,
  fields: readonly string[],
  values: Record<string, unknown>,
): void {
  try {
    const s = storage();
    if (!s) return;
    const out: Record<string, string> = {};
    for (const f of safeFields(fields)) {
      const v = values[f];
      if (typeof v === 'string' && v.trim()) out[f] = v.slice(0, MAX_LEN);
    }
    if (Object.keys(out).length) s.setItem(DRAFT_PREFIX + key, JSON.stringify(out));
    else s.removeItem(DRAFT_PREFIX + key);
  } catch {
    /* sem storage: o formulário funciona normalmente, só sem rascunho */
  }
}

export function clearDraft(key: FormKey): void {
  try {
    storage()?.removeItem(DRAFT_PREFIX + key);
  } catch {
    /* ignora */
  }
}

export function markPending(key: FormKey): void {
  try {
    storage()?.setItem(PENDING_PREFIX + key, '1');
  } catch {
    /* ignora */
  }
}

export function clearPending(key: FormKey): void {
  try {
    storage()?.removeItem(PENDING_PREFIX + key);
  } catch {
    /* ignora */
  }
}

/** Havia um envio em andamento quando a página foi recarregada/fechada? */
export function hasPending(key: FormKey): boolean {
  try {
    return storage()?.getItem(PENDING_PREFIX + key) != null;
  } catch {
    return false;
  }
}

/**
 * Restaura o rascunho ao montar e o salva a cada alteração dos campos de texto.
 * Usa setValue (e não defaultValues) para que "Enviar outra mensagem" (reset)
 * volte ao formulário vazio, e não ao rascunho antigo.
 */
export function useFormDraft<T extends FieldValues>(
  key: FormKey,
  fields: readonly (Path<T> & string)[],
  watch: UseFormWatch<T>,
  setValue: UseFormSetValue<T>,
) {
  useEffect(() => {
    const draft = readDraft(key, fields);
    for (const [f, v] of Object.entries(draft)) {
      setValue(f as Path<T>, v as PathValue<T, Path<T>>);
    }
    const sub = watch((values) => saveDraft(key, fields, values as Record<string, unknown>));
    return () => sub.unsubscribe();
    // os campos são constantes do módulo de cada formulário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, watch, setValue]);
}
