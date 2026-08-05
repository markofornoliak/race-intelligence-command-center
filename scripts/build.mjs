import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const sourceRoot = 'src/ri60x';
const outputRoot = 'dist';
const assembled = new Map([
  ['styles.css', 'styles'],
  ['modules/vehicle-controller.js', 'modules/vehicle-controller'],
  ['modules/overlay-manager.js', 'modules/overlay-manager'],
  ['modules/ui-controller.js', 'modules/ui-controller']
]);
const required = [
  'index.html', 'bootstrap.js', 'app.js', 'manifest.webmanifest', 'sw.js',
  'modules/state-manager.js', 'modules/asset-manager.js', 'modules/quality-manager.js',
  'modules/scene-runtime.js', 'modules/material-factory.js', 'modules/camera-controller.js',
  'modules/telemetry-engine.js', 'modules/chart-renderer.js', 'modules/utils.js'
];

async function readParts(directory) {
  const names = (await readdir(join(sourceRoot, directory))).filter((name) => name.endsWith('.part')).sort();
  if (!names.length) throw new Error(`No source parts found for ${directory}.`);
  return (await Promise.all(names.map((name) => readFile(join(sourceRoot, directory, name), 'utf8')))).join('');
}

for (const file of required) await readFile(join(sourceRoot, file), 'utf8');
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(sourceRoot, outputRoot, { recursive: true });
for (const [file, directory] of assembled) {
  await writeFile(join(outputRoot, file), await readParts(directory));
  await rm(join(outputRoot, directory), { recursive: true, force: true });
}
await mkdir(join(outputRoot, 'assets'), { recursive: true });
await cp('assets/favicon.svg', join(outputRoot, 'assets/favicon.svg'));
await writeFile(join(outputRoot, '.nojekyll'), '');

const index = await readFile(join(outputRoot, 'index.html'), 'utf8');
if (!index.includes('RI-60X') || !index.includes('Enter Command Center')) throw new Error('RI-60X entry surface is incomplete.');
console.log(`RI-60X unified production build complete: ${required.length + assembled.size} application files plus assets written to ${outputRoot}/.`);
console.log('Architecture: one source root, explicit runtime modules, immutable authored vehicle hierarchy, lazy analytic overlays.');
