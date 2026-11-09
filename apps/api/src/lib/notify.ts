import type { Logger } from 'pino';

export type LeadNotification = {
  type: 'contact' | 'quote';
  id: string;
  createdAt: string;
  /** Resumo sem dados pessoais completos (nome/telefone/e-mail ficam no banco). */
  summary: Record<string, string | null | undefined>;
};

export type LeadNotifier = (lead: LeadNotification) => void;

/**
 * Cria o notificador de novos leads. Se `url` estiver vazio, é um no-op.
 * O envio é "fire-and-forget": nunca lança erro nem atrasa a resposta HTTP.
 */
export function createLeadNotifier(
  opts: { url?: string; timeoutMs: number },
  logger: Logger,
): LeadNotifier {
  const { url, timeoutMs } = opts;
  if (!url) return () => {};
  return (lead) => {
    void (async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(lead),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) {
          logger.warn({ status: res.status, leadId: lead.id }, 'webhook de lead respondeu com erro');
        }
      } catch (err) {
        logger.warn(
          { leadId: lead.id, err: err instanceof Error ? err.message : String(err) },
          'falha ao notificar webhook de lead',
        );
      }
    })();
  };
}
