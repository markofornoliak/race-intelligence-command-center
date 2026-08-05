import { access, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { promisify } from 'node:util';
import { TelemetryEngine, FRAME_COUNT } from '../src/ri60x/modules/telemetry-engine.js';

const execFileAsync = promisify(execFile);
const root = 'src/ri60x';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(root);
const textFiles = files.filter((file) => /\.(?:html|css|js|webmanifest)$/.test(file));
const source = Object.fromEntries(await Promise.all(textFiles.map(async (file) => [relative(root, file), await readFile(file, 'utf8')])));
const html = source['index.html'];
const css = source['styles.css'];
const app = source['app.js'];
const bootstrap = source['bootstrap.js'];
const vehicle = source['modules/vehicle-controller.js'];
const overlays = source['modules/overlay-manager.js'];
const camera = source['modules/camera-controller.js'];
const quality = source['modules/quality-manager.js'];
const telemetrySource = source['modules/telemetry-engine.js'];

for (const token of ['RI-60X / UNIFIED VEHICLE RUNTIME', 'Enter Command Center', 'data-mode="studio"', 'data-mode="cfd"', 'data-mode="dynamics"', 'data-camera="cockpit"', 'data-camera="floor"', 'data-action="export-csv"', 'data-action="export-json"']) {
  if (!html.includes(token)) throw new Error(`Interface capability missing: ${token}`);
}
if ((html.match(/<h1/g) || []).length !== 1) throw new Error('Exactly one primary h1 is required.');
for (const token of ['viewport-fit=cover', 'aria-label', '<dialog', 'safe-area-inset-bottom']) if (!(html + css).includes(token)) throw new Error(`Accessibility/mobile token missing: ${token}`);
for (const token of ['@media(max-width:760px)', '@media(max-width:480px)', 'orientation:landscape', 'prefers-reduced-motion', ':focus-visible']) if (!css.includes(token)) throw new Error(`Responsive rule missing: ${token}`);

for (const token of ['class VehicleController', 'FRONT_WING_ASSEMBLY', 'REAR_WING_ASSEMBLY', 'DIFFUSER', 'HALO_ASSEMBLY', 'Ground-effect floor', 'brakeDiscs', 'assertAuthoredTransforms', 'lockAuthoredTransforms']) if (!vehicle.includes(token)) throw new Error(`Vehicle system missing: ${token}`);
for (const token of ['class OverlayManager', 'frontWing', 'tyres', 'floor', 'diffuser', 'CatmullRomCurve3', 'ArrowHelper', 'ANALYTIC_VEHICLE_FRAME', 'setZone', 'setRecording']) if (!overlays.includes(token)) throw new Error(`Overlay system missing: ${token}`);
for (const token of ['class CameraController', 'cockpit', 'suspension', 'floor', 'minDistance', 'maxDistance', 'dblclick', 'startCinematic', 'localStorage']) if (!camera.includes(token)) throw new Error(`Camera system missing: ${token}`);
for (const token of ['class QualityManager', 'pixelRatio', 'shadow', 'observeFrame', 'visibility', 'mobile']) if (!(quality + app).includes(token)) throw new Error(`Performance system missing: ${token}`);
for (const token of ['GEAR_RATIOS', 'brakeTemp', 'tyreTemp', 'ersDeploy', 'exportCSV', 'exportJSON', 'wheelLoads']) if (!telemetrySource.includes(token)) throw new Error(`Telemetry relationship missing: ${token}`);

const forbiddenOverlayMutation = /vehicle\.(?:root|wheels).*\.(?:position|rotation|quaternion|scale)\s*(?:=|\.|\[)/;
if (forbiddenOverlayMutation.test(overlays)) throw new Error('Analytic overlays must not mutate authored vehicle transforms.');
if (/src\/ri(?:20|30|50|51)x/.test(await readFile('scripts/build.mjs', 'utf8'))) throw new Error('Build must not layer previous RI generations.');
if (!bootstrap.includes("await import('./app.js')") || !app.includes('document.addEventListener(\'visibilitychange\'') || (app.match(/requestAnimationFrame\(animate\)/g) || []).length > 3) throw new Error('Rendering lifecycle is not centralized.');

const syntaxDirectory = await mkdtemp(join(tmpdir(), 'ri60x-syntax-'));
try {
  for (const file of files.filter((path) => path.endsWith('.js'))) {
    const temp = join(syntaxDirectory, relative(root, file).replaceAll('/', '__').replace(/\.js$/, '.mjs'));
    await writeFile(temp, await readFile(file, 'utf8'));
    await execFileAsync(process.execPath, ['--check', temp]);
  }
  await execFileAsync(process.execPath, ['--check', 'scripts/build.mjs']);
} finally {
  await rm(syntaxDirectory, { recursive: true, force: true });
}

const a = new TelemetryEngine(20260805);
const b = new TelemetryEngine(20260805);
if (a.frames.length !== FRAME_COUNT || JSON.stringify(a.frames) !== JSON.stringify(b.frames)) throw new Error('Telemetry must be deterministic and complete.');
for (const frame of [a.frames[0], a.frames[240], a.frames[600], a.frames.at(-1)]) {
  if (frame.rpm < 5000 || frame.rpm > 15100 || frame.speed < 0 || frame.speed > 351 || frame.gear < 1 || frame.gear > 8) throw new Error('Telemetry frame exceeds physical bounds.');
  if (frame.brakeTemp.some((value) => value < 200 || value > 1150) || frame.tyreTemp.some((value) => value < 60 || value > 135)) throw new Error('Thermal model exceeds declared limits.');
}
if (!a.exportCSV().startsWith('time_s,distance_m') || JSON.parse(a.exportJSON()).frames.length !== FRAME_COUNT) throw new Error('Telemetry export is invalid.');

for (const path of ['assets/favicon.svg', '.github/workflows/deploy-pages.yml', '.github/workflows/browser-quality.yml', 'tests/command-center.spec.js', 'playwright.config.js']) await access(path);
const bytes = (await Promise.all(textFiles.map((file) => stat(file)))).reduce((sum, info) => sum + info.size, 0);
if (bytes > 950000) throw new Error(`RI-60X source budget exceeded: ${bytes} bytes.`);
console.log(`RI-60X validation passed. Modules: ${files.filter((file) => file.endsWith('.js')).length}. Telemetry: ${FRAME_COUNT} deterministic frames. Source: ${bytes} bytes. Authored hierarchy: protected.`);
