/**
 * CSP sem 'unsafe-eval' (docs/SECURITY-REPORT.md, "Headers da hospedagem").
 *
 * O zod 4 testa `new Function("")` ao criar cada `z.object` para gerar um
 * validador mais rápido. Com a CSP do site o teste falha (a validação continua
 * funcionando), mas o navegador registra uma violação de CSP no console.
 * `jitless: true` desliga o teste e a geração de código; a validação é a mesma.
 *
 * A configuração do zod mora em `globalThis.__zod_globalConfig` (zod/v4/core,
 * core.js: `globalConfig`), lida quando os schemas são criados. Gravar aqui,
 * antes de qualquer schema existir, evita colocar o zod no pacote inicial só
 * para chamar `z.config` (os schemas de @cn/shared ficam no chunk dos formulários).
 * Precisa ser o primeiro import do main.tsx. Teste: zod-csp.test.ts.
 */
type ZodGlobalConfig = { jitless?: boolean } & Record<string, unknown>;
const g = globalThis as typeof globalThis & { __zod_globalConfig?: ZodGlobalConfig };
g.__zod_globalConfig = Object.assign(g.__zod_globalConfig ?? {}, { jitless: true });

export {};
