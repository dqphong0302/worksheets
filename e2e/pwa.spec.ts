import { expect, test } from '@playwright/test';

test('production manifest, service worker, icons and offline shell', async ({ page, context, request }) => {
  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: 'Worksheet Generator',
    short_name: 'Worksheets',
    display: 'standalone',
    start_url: '/',
    scope: '/',
  });
  expect(manifest.icons).toHaveLength(2);

  for (const path of ['/sw.js', '/icons/icon-192.png', '/icons/icon-512.png']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
  }

  await page.goto('/');
  await expect(page.locator('main h4')).toHaveCount(15);
  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return { scope: ready.scope, active: Boolean(ready.active) };
  });
  expect(registration).toEqual({ scope: 'http://127.0.0.1:4173/', active: true });

  // Reload once so this document is controlled by the active worker.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('main h4')).toHaveCount(15);
  await context.setOffline(false);
});
