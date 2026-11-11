import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PRODUCTS } from '@cn/shared';
import { jsonResponse } from '@/test/utils';
import {
  ApiTimeoutError,
  getProducts,
  READ_SKIP_MS,
  READ_TIMEOUT_MS,
  sendQuote,
  SUBMIT_TIMEOUT_MS,
  WAKE_INTERVAL_MS,
  wakeApi,
} from './api';

/** fetch que só termina quando o AbortSignal dispara (API dormindo). */
function hangingFetch() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      }),
  );
}

const quote = {
  name: 'Ana',
  phone: '92999990000',
  message: 'Quero uma lancha de alumínio.',
  consent: true as const,
};

/** `process` do Node (o tsconfig do app não inclui os tipos do Node). */
type Listener = (reason: unknown) => void;
const nodeProcess = (
  globalThis as unknown as {
    process: { on(e: string, f: Listener): void; off(e: string, f: Listener): void };
  }
).process;

afterEach(() => {
  vi.useRealTimers();
});

describe('wakeApi', () => {
  it('dispara GET /api/health uma vez só, mesmo chamada várias vezes', () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 'ok' }));
    wakeApi();
    wakeApi();
    wakeApi();
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe('/api/health');
    expect(init?.method).toBe('GET');
  });

  it('descarta o corpo da resposta para não deixar a requisição aberta (QA-14)', async () => {
    const res = jsonResponse({ status: 'ok' });
    const cancel = vi.spyOn(res.body!, 'cancel');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(res);
    wakeApi();
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
  });

  it('volta a disparar depois do intervalo', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 'ok' }));
    wakeApi();
    vi.setSystemTime(Date.now() + WAKE_INTERVAL_MS - 1000);
    wakeApi();
    expect(spy).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 2000);
    wakeApi();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ignora a falha (sem exceção nem promessa rejeitada solta)', async () => {
    const unhandled = vi.fn();
    nodeProcess.on('unhandledRejection', unhandled);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    expect(() => wakeApi()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    nodeProcess.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('não quebra se o fetch lançar de forma síncrona', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new TypeError('sem fetch');
    });
    expect(() => wakeApi()).not.toThrow();
  });
});

describe('tempos de requisição', () => {
  it('envio de orçamento espera a API acordar (até 90 s) sem reenviar', async () => {
    vi.useFakeTimers();
    let resolve!: (r: Response) => void;
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    const pending = sendQuote(quote);
    // bem além do tempo de leitura: o POST continua esperando
    await vi.advanceTimersByTimeAsync(60_000);
    resolve(jsonResponse({ ok: true, id: 'q-lento' }, 201));
    await expect(pending).resolves.toEqual({ ok: true, id: 'q-lento' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![1]?.method).toBe('POST');
  });

  it('desiste após SUBMIT_TIMEOUT_MS com ApiTimeoutError e um único POST', async () => {
    vi.useFakeTimers();
    const spy = hangingFetch();
    const pending = sendQuote(quote);
    const assertion = expect(pending).rejects.toBeInstanceOf(ApiTimeoutError);
    await vi.advanceTimersByTimeAsync(SUBMIT_TIMEOUT_MS - 1);
    expect(spy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('leitura do catálogo cai no catálogo local em READ_TIMEOUT_MS', async () => {
    vi.useFakeTimers();
    hangingFetch();
    const pending = getProducts();
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS);
    await expect(pending).resolves.toEqual({ data: DEMO_PRODUCTS, fallback: true });
  });

  it('depois de uma leitura sem resposta, as seguintes usam o catálogo local na hora', async () => {
    vi.useFakeTimers();
    const spy = hangingFetch();
    const first = getProducts();
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS);
    await first;
    const readCalls = () =>
      spy.mock.calls.filter((c) => String(c[0]).startsWith('/api/products')).length;
    expect(readCalls()).toBe(1);

    // dentro da janela: sem esperar e sem nova leitura (mas pede para a API acordar)
    await expect(getProducts({ category: 'canoas' })).resolves.toMatchObject({ fallback: true });
    expect(readCalls()).toBe(1);
    expect(spy.mock.calls.some((c) => c[0] === '/api/health')).toBe(true);

    // passada a janela, tenta a API de novo
    spy.mockResolvedValue(jsonResponse([DEMO_PRODUCTS[0]]));
    vi.setSystemTime(Date.now() + READ_SKIP_MS + 1);
    await expect(getProducts()).resolves.toEqual({ data: [DEMO_PRODUCTS[0]], fallback: false });
    expect(readCalls()).toBe(2);
  });
});
