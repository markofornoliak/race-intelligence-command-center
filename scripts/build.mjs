import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const sourceRoot = 'src/ri60x';
const outputRoot = 'dist';
const required = [
  'index.html', 'styles.css', 'bootstrap.js', 'app.js', 'manifest.webmanifest', 'sw.js',
  'modules/state-manager.js', 'modules/asset-manager.js', 'modules/quality-manager.js',
  'modules/scene-runtime.js', 'modules/material-factory.js', 'modules/vehicle-controller.js',
  'modules/camera-controller.js', 'modules/overlay-manager.js', 'modules/telemetry-engine.js',
  'modules/chart-renderer.js', 'modules/ui-controller.js', 'modules/utils.js'
];

for (const file of required) await readFile(join(sourceRoot, file), 'utf8');
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(sourceRoot, outputRoot, { recursive: true });
await mkdir(join(outputRoot, 'assets'), { recursive: true });
await cp('assets/favicon.svg', join(outputRoot, 'assets/favicon.svg'));
await writeFile(join(outputRoot, '.nojekyll'), '');

const index = await readFile(join(outputRoot, 'index.html'), 'utf8');
if (!index.includes('RI-60X') || !index.includes('Enter Command Center')) throw new Error('RI-60X entry surface is incomplete.');
console.log(`RI-60X unified production build complete: ${required.length} application files plus assets written to ${outputRoot}/.`);
console.log('Architecture: one source root, explicit modules, immutable authored vehicle hierarchy, lazy analytic overlays.');
