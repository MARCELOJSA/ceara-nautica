import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Cria/migra/semeia o banco de testes (cearanautica_test) uma vez por execução.
    globalSetup: ['./tests/global-setup.ts'],
    // Todos os arquivos usam o mesmo banco de testes: execução sequencial.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
  },
});
