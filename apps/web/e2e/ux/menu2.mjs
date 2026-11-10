import { chromium } from '@playwright/test';
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const p = await ctx.newPage();
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /recusar/i }).tap();
await p.getByRole('button', { name: /menu/i }).first().tap();
await p.waitForTimeout(800);
console.log(
  await p.evaluate(() => {
    const d = document.getElementById('menu-mobile');
    const r = d.getBoundingClientRect();
    const h = document.querySelector('header');
    const cs = getComputedStyle(h);
    return {
      panel: [r.top, r.height, r.width],
      headerBackdrop: cs.backdropFilter,
      headerH: h.getBoundingClientRect().height,
      navH: d.querySelector('nav').getBoundingClientRect().height,
    };
  }),
);
// can user tap "Serviços"?
const l = p.locator('#menu-mobile nav a', { hasText: /servi/i });
console.log('visible?', await l.isVisible());
try {
  await l.tap({ timeout: 2000 });
  console.log('tapped ->', p.url());
} catch (e) {
  console.log('tap fail', e.message.split('\n')[0]);
}
await b.close();
