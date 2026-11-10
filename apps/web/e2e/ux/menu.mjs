import { chromium } from '@playwright/test';
const OUT = process.argv[2];
const b = await chromium.launch();
for (const rm of ['no-preference', 'reduce']) {
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: rm,
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/produtos', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /recusar/i }).tap();
  await p.getByRole('button', { name: /menu/i }).first().tap();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/j-menu-${rm}.png` });
}
await b.close();
