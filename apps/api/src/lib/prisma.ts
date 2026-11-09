import { PrismaClient } from '@prisma/client';

export function createPrisma(databaseUrl?: string): PrismaClient {
  return new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: ['warn', 'error'],
  });
}

export type { PrismaClient };
