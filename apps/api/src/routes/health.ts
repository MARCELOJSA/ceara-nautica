import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

export function healthRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Processo no ar => status 'ok'. O estado do banco vem em `db`.
  router.get('/health', async (_req, res) => {
    let db: 'ok' | 'error' = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }
    res.set('Cache-Control', 'no-store').json({ status: 'ok', db });
  });

  return router;
}
