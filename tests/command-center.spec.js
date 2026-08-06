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

async function waitForRuntime(page) {
  await page.waitForFunction(() => Boolean(window.RI60X?.diagnostics), null, { timeout: 20000 });
  return page.evaluate(() => window.RI60X.diagnostics());
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
  await expect.poll(async () => (await canvas.isVisible()) || (await fallback.isVisible())).toBe(true);
  if (await canvas.isVisible()) {
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(baseline.minimumCanvasWidth);
  }

  const diagnostics = await waitForRuntime(page);
  await page.locator('[data-action="enter"]').click();
  await expect(page.locator('[data-workspace]')).toBeVisible();

  await page.locator('[data-mode="technical"]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'technical');
  await page.locator('[data-mode="cfd"]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'cfd');
  await expect(page.locator('[data-cfd-controls]')).toBeVisible();
  await page.locator('[data-mode="dynamics"]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dynamics');
  await expect(page.locator('[data-dynamics-controls]')).toBeVisible();

  if (diagnostics.webgl !== false) {
    await page.locator('[data-camera="suspension"]').click();
    await page.waitForTimeout(250);
    const afterModes = await page.evaluate(() => window.RI60X.diagnostics());
    expect(afterModes.authoredViolations).toBe(0);
    expect(afterModes.cameraMode).toBe('dynamics');
    expect(afterModes.cameraPreset).toBe('suspension');
  }

  await page.locator('[data-action="reset-scene"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'studio');
  if (diagnostics.webgl !== false) {
    await page.waitForTimeout(250);
    const afterReset = await page.evaluate(() => window.RI60X.diagnostics());
    expect(afterReset.authoredViolations).toBe(0);
    expect(afterReset.cameraMode).toBe('studio');
    expect(afterReset.cameraPreset).toBe('hero');
  }

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('command-center.png'), fullPage: true });
});

test('telemetry relationships and exports are available', async ({ page }) => {
  await page.goto('/');
  const diagnostics = await waitForRuntime(page);
  test.skip(diagnostics.telemetry === false, 'Only the static bootstrap fallback was available.');
  await page.locator('[data-action="enter"]').click();
  await page.locator('[data-workspace-tab="analysis"]').click();
  await expect(page.locator('[data-panel="analysis"]')).toBeVisible();
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
  const diagnostics = await waitForRuntime(page);
  test.skip(diagnostics.webgl === false, 'The CI runner exposed only the lightweight fallback.');
  await page.waitForTimeout(1800);
  const viewport = page.locator('[data-viewport]');
  const first = await viewport.screenshot({ animations: 'disabled' });
  await page.evaluate(() => window.RI60X.reset());
  await page.waitForTimeout(1200);
  const second = await viewport.screenshot({ animations: 'disabled' });
  const ratio = changedPixelRatio(first, second);
  expect(ratio).toBeLessThan(baseline.desktop.maxChangedPixelRatio);
  const diagnosticsAfter = await page.evaluate(() => window.RI60X.diagnostics());
  expect(diagnosticsAfter.authoredViolations).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('visual-regression-reference.png'), fullPage: true });
});

test('same-origin transfer size stays inside performance budget', async ({ page }) => {
  await page.goto('/');
  await waitForRuntime(page);
  await page.waitForTimeout(600);
  const transferSize = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter((entry) => new URL(entry.name).origin === location.origin)
    .reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0));
  expect(transferSize).toBeLessThan(baseline.performanceBudgetBytes);
});

test('lightweight runtime remains functional without WebGL2', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Forced fallback is validated once.');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined, configurable: true });
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, ...args) {
      if (type === 'webgl2') return null;
      return originalGetContext.call(this, type, ...args);
    };
  });
  await page.goto('/');
  const diagnostics = await waitForRuntime(page);
  expect(diagnostics.webgl).toBe(false);
  expect(diagnostics.telemetry).toBe(true);
  expect(diagnostics.telemetryFrames).toBeGreaterThan(800);
  await expect(page.locator('[data-webgl-fallback]')).toBeVisible();
  await expect(page.locator('#vehicle-canvas')).toBeHidden();
  await page.locator('[data-action="enter"]').click();
  await page.locator('[data-workspace-tab="analysis"]').click();
  await expect(page.locator('[data-telemetry-chart]')).toBeVisible();
  await page.locator('[data-action="play"]').click();
  await page.waitForTimeout(500);
  expect(Number(await page.locator('[data-tel-speed]').textContent())).toBeGreaterThan(0);
});

test('iPhone workspace is a bottom sheet with safe touch geometry', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-webkit', 'Mobile layout is validated on the iPhone WebKit project.');
  await page.goto('/');
  await waitForRuntime(page);
  await page.locator('[data-action="enter"]').click();
  const workspace = page.locator('[data-workspace]');
  await expect(workspace).toBeVisible();
  const box = await workspace.boundingBox();
  const viewport = page.viewportSize();
  expect(box.y).toBeGreaterThan(48);
  expect(box.height).toBeLessThan(viewport.height - 90);
  const radius = await workspace.evaluate((element) => getComputedStyle(element).borderTopLeftRadius);
  expect(Number.parseFloat(radius)).toBeGreaterThanOrEqual(18);
  const minimumTouchTarget = await page.locator('.bottom-dock button').first().evaluate((element) => element.getBoundingClientRect().height);
  expect(minimumTouchTarget).toBeGreaterThanOrEqual(44);
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});
