import { access, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { SCENARIOS, computeStrategy, defaultScenarioInputs, generateTelemetry } from '../src/ri10x/core.mjs';

const execFileAsync = promisify(execFile);
const sourceRoot = 'src/ri10x';
const files = ['index.html', 'styles.css', 'app.js', 'scene.js', 'core.mjs'];
for (const file of files) await access(`${sourceRoot}/${file}`);

const html = await readFile(`${sourceRoot}/index.html`, 'utf8');
const css = await readFile(`${sourceRoot}/styles.css`, 'utf8');
const app = await readFile(`${sourceRoot}/app.js`, 'utf8');
const scene = await readFile(`${sourceRoot}/scene.js`, 'utf8');

for (const copy of [
  'RACE INTELLIGENCE OS',
  'ONE RACE STATE.',
  'EVERY SPECIALIST.',
  'STRATEGY LAB',
  'OPERATIONS NETWORK',
  'SECURE EXPERIENCE LAYER',
  'PERFORMANCE EVIDENCE'
]) {
  if (!html.includes(copy)) throw new Error(`Required RI-10X copy missing: ${copy}`);
}

if ((html.match(/<h1/g) || []).length !== 1) throw new Error('RI-10X must contain exactly one h1.');
if ((html.match(/data-chapter=/g) || []).length !== 8) throw new Error('RI-10X must expose eight application chapters.');
if (!html.includes('type="importmap"')) throw new Error('Pinned Three.js import map is missing.');
if (!html.includes('<dialog')) throw new Error('Control help dialog is missing.');
if (!html.includes('data-timeline')) throw new Error('Race-state timeline is missing.');
if (!html.includes('data-strategy-inputs')) throw new Error('Strategy input surface is missing.');
if (!html.includes('data-network-map')) throw new Error('Operations network is missing.');
if (!html.includes('aria-label')) throw new Error('Accessible labels are missing.');

for (const token of [':focus-visible', 'prefers-reduced-motion', '@media (max-width: 820px)', '.command-deck', '.strategy-workbench', '.network-map', '.telemetry-rail']) {
  if (!css.includes(token)) throw new Error(`Visual-system capability missing: ${token}`);
}
for (const token of ['createStore', 'IntersectionObserver', 'generateTelemetry', 'computeStrategy', 'drawTelemetryChart', 'drawOutcomeChart', 'localStorage', 'encodeShareState']) {
  if (!app.includes(token)) throw new Error(`Application capability missing: ${token}`);
}
for (const token of ['WebGLRenderer', 'loftGeometry', 'Raycaster', 'setExplode', 'setView', 'setCameraPreset', 'ResizeObserver', 'requestAnimationFrame']) {
  if (!scene.includes(token)) throw new Error(`Digital-twin capability missing: ${token}`);
}

const replayA = generateTelemetry();
const replayB = generateTelemetry();
if (JSON.stringify(replayA) !== JSON.stringify(replayB)) throw new Error('Telemetry replay is not deterministic.');
if (replayA.length !== 72 || replayA.some((item) => !Number.isFinite(item.speed) || !Number.isFinite(item.latency))) throw new Error('Telemetry replay is invalid.');

for (const scenarioId of Object.keys(SCENARIOS)) {
  const inputs = defaultScenarioInputs(scenarioId);
  const first = computeStrategy(scenarioId, inputs);
  const second = computeStrategy(scenarioId, inputs);
  if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error(`${scenarioId} strategy is not deterministic.`);
  if (!first.recommendation || first.confidence < 0 || first.confidence > 100 || first.ranked.length !== 3) throw new Error(`${scenarioId} strategy output is invalid.`);
}

for (const file of ['assets/favicon.svg', '.github/workflows/deploy-pages.yml', '.github/workflows/validate-pr.yml']) await access(file);

const validationDir = await mkdtemp(join(tmpdir(), 'ri10x-check-'));
try {
  for (const file of ['app.js', 'scene.js', 'core.mjs']) {
    const source = await readFile(`${sourceRoot}/${file}`, 'utf8');
    const target = join(validationDir, file.endsWith('.mjs') ? file : `${file}.mjs`);
    await writeFile(target, source);
    await execFileAsync(process.execPath, ['--check', target]);
  }
} finally {
  await rm(validationDir, { recursive: true, force: true });
}

const totalBytes = (await Promise.all(files.map(async (file) => (await stat(`${sourceRoot}/${file}`)).size))).reduce((sum, value) => sum + value, 0);
if (totalBytes > 520_000) throw new Error(`RI-10X source budget exceeded: ${totalBytes} bytes.`);

console.log(`RI-10X validation passed. Deterministic telemetry: ${replayA.length} frames. Strategy scenarios: ${Object.keys(SCENARIOS).length}. Source: ${totalBytes} bytes.`);
