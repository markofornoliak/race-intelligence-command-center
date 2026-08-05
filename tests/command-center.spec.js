import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import baseline from './visual-baseline.json' with { type: 'json' };

function changedPixelRatio(first, second) {
  const a = PNG.sync.read(first);
  const b = PNG.sync.read(second);
  if (a.width !== b.width || a.height !== b.height) return 1;
  let changed = 0;
  const threshold = 20;
  for (let i = 0; i < a.data.length; i += 4) {
    const delta = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (delta > threshold) changed += 1;
  }
  return changed / (a.width * a.height);
}

test('command center smoke, modes and responsive workspace', async ({ page }, testInfo) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Engineering clarity');
  await expect(page.locator('[data-action="enter"]')).toBeVisible();
  const canvas = page.locator('#vehicle-canvas');
  const fallback = page.locator('[data-webgl-fallback]');
  await expect(canvas.or(fallback)).toBeVisible();
  const canvasBox = await canvas.boundingBox().catch(() => null);
  if (canvasBox) expect(canvasBox.width).toBeGreaterThan(baseline.minimumCanvasWidth);

  await page.locator('[data-action="enter"]').click();
  await expect(page.locator('[data-workspace]')).toBeVisible();
  const runtimeAvailable = await page.evaluate(() => Boolean(window.RI60X?.diagnostics));
  if (runtimeAvailable) {
    await page.locator('[data-mode="technical"]').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'technical');
    await page.locator('[data-mode="cfd"]').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'cfd');
    await expect(page.locator('[data-cfd-controls]')).toBeVisible();
    await page.locator('[data-mode="dynamics"]').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dynamics');
    await expect(page.locator('[data-dynamics-controls]')).toBeVisible();
    await page.locator('[data-camera="suspension"]').click();
    await page.locator('[data-action="reset-scene"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'studio');
    expect(errors).toEqual([]);
  } else {
    await expect(fallback).toBeVisible();
  }

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('command-center.png'), fullPage: true });
});

test('telemetry relationships and exports are available', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="enter"]').click();
  await page.locator('[data-workspace-tab="analysis"]').click();
  await expect(page.locator('[data-telemetry-chart]')).toBeVisible();
  await page.locator('[data-action="play"]').click();
  await page.waitForTimeout(700);
  const speed = Number((await page.locator('[data-tel-speed]').textContent()).replaceAll(',', ''));
  const rpm = Number((await page.locator('[data-tel-rpm]').textContent()).replaceAll(',', ''));
  const gear = Number(await page.locator('[data-tel-gear]').textContent());
  expect(speed).toBeGreaterThan(0);
  expect(rpm).toBeGreaterThan(5000);
  expect(gear).toBeGreaterThanOrEqual(2);
  await expect(page.locator('[data-action="export-csv"]')).toBeVisible();
  await expect(page.locator('[data-action="export-json"]')).toBeVisible();
});

test('visual output is stable across an authored reset', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Visual stability baseline runs once on desktop Chromium.');
  await page.goto('/');
  await page.waitForTimeout(1800);
  const viewport = page.locator('[data-viewport]');
  const first = await viewport.screenshot({ animations: 'disabled' });
  await page.locator('[data-action="reset-camera"]').click();
  await page.waitForTimeout(1200);
  const second = await viewport.screenshot({ animations: 'disabled' });
  const ratio = changedPixelRatio(first, second);
  expect(ratio).toBeLessThan(baseline.desktop.maxChangedPixelRatio);
  await page.screenshot({ path: testInfo.outputPath('visual-regression-reference.png'), fullPage: true });
});

test('same-origin transfer size stays inside performance budget', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1200);
  const transferSize = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter((entry) => new URL(entry.name).origin === location.origin)
    .reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0));
  expect(transferSize).toBeLessThan(baseline.performanceBudgetBytes);
});
