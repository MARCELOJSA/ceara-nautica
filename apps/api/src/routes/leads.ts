import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { contactSchema, quoteSchema, type FormSubmissionResponse } from '@cn/shared';
import { parseOr400 } from '../lib/validate.js';
import { isHoneypotFilled, requestMeta, utmColumns } from '../lib/leads.js';
import type { LeadNotifier } from '../lib/notify.js';

type LeadDeps = {
  prisma: PrismaClient;
  ipHashSalt: string;
  notify: LeadNotifier;
};

/** Id falso com o mesmo formato aparente de um cuid, para não denunciar o honeypot. */
const fakeId = () => `c${randomBytes(16).toString('hex').slice(0, 24)}`;

export function leadsRouter({ prisma, ipHashSalt, notify }: LeadDeps): Router {
  const router = Router();

  router.post('/contact', async (req, res) => {
    if (isHoneypotFilled(req.body)) {
      req.log?.info('honeypot acionado em /api/contact');
      const body: FormSubmissionResponse = { ok: true, id: fakeId() };
      res.status(201).json(body);
      return;
    }
    const data = parseOr400(contactSchema, req.body);
    const created = await prisma.contactMessage.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        subject: data.subject,
        message: data.message,
        consent: data.consent,
        ...utmColumns(data.utm),
        ...requestMeta(req, ipHashSalt),
      },
      select: { id: true, createdAt: true },
    });
    notify({
      type: 'contact',
      id: created.id,
      createdAt: created.createdAt.toISOString(),
      summary: { subject: data.subject, utm_source: data.utm?.utm_source },
    });
    const body: FormSubmissionResponse = { ok: true, id: created.id };
    res.status(201).json(body);
  });

  router.post('/quotes', async (req, res) => {
    if (isHoneypotFilled(req.body)) {
      req.log?.info('honeypot acionado em /api/quotes');
      const body: FormSubmissionResponse = { ok: true, id: fakeId() };
      res.status(201).json(body);
      return;
    }
    const data = parseOr400(quoteSchema, req.body);
    const created = await prisma.quoteRequest.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        category: data.category ?? null,
        productSlug: data.productSlug ?? null,
        city: data.city || null,
        message: data.message,
        consent: data.consent,
        ...utmColumns(data.utm),
        ...requestMeta(req, ipHashSalt),
      },
      select: { id: true, createdAt: true },
    });
    notify({
      type: 'quote',
      id: created.id,
      createdAt: created.createdAt.toISOString(),
      summary: {
        category: data.category,
        productSlug: data.productSlug,
        city: data.city,
        utm_source: data.utm?.utm_source,
      },
    });
    const body: FormSubmissionResponse = { ok: true, id: created.id };
    res.status(201).json(body);
  });

  return router;
}
