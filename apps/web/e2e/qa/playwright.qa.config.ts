import { defineConfig, devices } from '@playwright/test';

/**
 * AGENT 03 — Security QA (Playwright) contra o site JÁ EM EXECUÇÃO e a API REAL.
 * Não sobe servidor (sem webServer) e não simula a API.
 *
 *   npx playwright test -c e2e/qa/playwright.qa.config.ts                     # dev: http://localhost:5173
 *   QA_BASE_URL=http://localhost:4174 npx playwright test -c e2e/qa/...        # build (vite preview)
 *   QA_HEADERS_URL=https://www.dominio.com.br npx playwright test -c ... headers
 *
 * Os arquivos usam a extensão `.qa.ts` para NÃO entrarem no `npm run test:e2e`
 * (que roda com API simulada); este config só procura `*.qa.ts`.
 * Leads gravados pelos testes têm "QA-TEST" no nome (apagar depois do QA).
 */
const baseURL = process.env.QA_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.qa.ts',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: '../../test-results/qa',
  use: {
    baseURL,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});
