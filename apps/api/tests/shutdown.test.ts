import { createServer, request as httpRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { closeServer } from '../src/lib/shutdown.js';

/** Servidor cujo handler só responde quando `release()` é chamado. */
function slowServer() {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((r) => (release = r));
  const server = createServer((_req, res) => {
    void gate.then(() => res.end('ok'));
  });
  return { server, release: () => release() };
}

function listen(server: Server): Promise<number> {
  return new Promise((r) =>
    server.listen(0, '127.0.0.1', () => r((server.address() as AddressInfo).port)),
  );
}

function get(port: number): Promise<{ status?: number; body: string; error?: string }> {
  return new Promise((resolve) => {
    const req = httpRequest({ host: '127.0.0.1', port, path: '/' }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
      res.on('error', (e) => resolve({ body, error: e.message }));
    });
    req.on('error', (e) => resolve({ body: '', error: e.message }));
    req.end();
  });
}

const servers: Server[] = [];
afterEach(() => {
  for (const s of servers.splice(0)) s.closeAllConnections();
});

describe('encerramento gracioso (SIGTERM do Render)', () => {
  it('espera a requisição em andamento terminar e recusa conexões novas', async () => {
    const { server, release } = slowServer();
    servers.push(server);
    const port = await listen(server);

    const inFlight = get(port);
    await new Promise((r) => setTimeout(r, 50)); // a requisição chega ao handler
    const closing = closeServer(server, 5_000);

    const refused = await get(port);
    expect(refused.error).toBeDefined();

    release();
    expect(await inFlight).toEqual({ status: 200, body: 'ok' });
    expect(await closing).toBe('closed');
  });

  it('após o tempo limite derruba as conexões presas', async () => {
    const { server } = slowServer(); // nunca responde
    servers.push(server);
    const port = await listen(server);

    const inFlight = get(port);
    await new Promise((r) => setTimeout(r, 50));
    const started = Date.now();
    expect(await closeServer(server, 200)).toBe('timeout');
    expect(Date.now() - started).toBeLessThan(2_000);
    expect((await inFlight).error).toBeDefined();
  });
});
