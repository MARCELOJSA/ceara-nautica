import type { Server } from 'node:http';

/**
 * Para o servidor HTTP sem cortar requisições em andamento (ex.: um lead sendo gravado
 * quando o Render manda SIGTERM numa nova publicação ou ao pôr o serviço para dormir).
 *
 * - deixa de aceitar conexões novas;
 * - fecha na hora as conexões keep-alive ociosas;
 * - espera as requisições em andamento terminarem até `timeoutMs`; depois disso, derruba
 *   as conexões restantes (o Render manda SIGKILL 30 s após o SIGTERM).
 */
export function closeServer(server: Server, timeoutMs: number): Promise<'closed' | 'timeout'> {
  return new Promise((resolve) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      server.closeAllConnections();
    }, timeoutMs);
    timer.unref();

    server.close(() => {
      clearTimeout(timer);
      resolve(timedOut ? 'timeout' : 'closed');
    });
    server.closeIdleConnections();
  });
}
