import { describe, expect, it } from 'vitest';
import './zod-csp';
import { config, z } from 'zod';

describe('zod sem eval (CSP)', () => {
  it('o zod enxerga jitless: true pela configuração global', () => {
    expect(config().jitless).toBe(true);
  });

  it('objetos continuam validando normalmente', () => {
    const schema = z.object({ name: z.string().min(2) });
    expect(schema.safeParse({ name: 'Ana' }).success).toBe(true);
    expect(schema.safeParse({ name: 'A' }).success).toBe(false);
  });
});
