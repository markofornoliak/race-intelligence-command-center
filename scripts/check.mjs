import { access, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const html = await readFile('index.html', 'utf8');
const css = await readFile('styles.css', 'utf8');
const scene = await readFile('scene.js', 'utf8');
const ui = await readFile('ui.js', 'utf8');

const copyChecks = [
  'DRIVING PERFORMANCE WITH',
  'EFFICIENT',
  'DATA ACCESS',
  'PLAY VIDEO',
  'LEARN ABOUT CITRIX HDX TECHNOLOGY',
  '03 / 03',
  'Speed is an information problem already solved.'
];
for (const copy of copyChecks) {
  if (!html.includes(copy)) throw new Error(`Required campaign copy missing: ${copy}`);
}

if ((html.match(/<h1/g) || []).length !== 1) throw new Error('The page must contain exactly one h1.');
if (!html.includes('type="importmap"')) throw new Error('Three.js import map is missing.');
if (!html.includes('<dialog')) throw new Error('Film dialog is missing.');
if (!html.includes('aria-label')) throw new Error('Accessible labels are incomplete.');
if (!css.includes('@media (max-width:760px)')) throw new Error('Mobile layout breakpoint is missing.');
if (!css.includes('prefers-reduced-motion')) throw new Error('Reduced-motion support is missing.');

const threeImportPattern = /import\s*\*\s*as\s+THREE\s*from\s*['"]three['"]/;
if (!threeImportPattern.test(scene)) {
  throw new Error('3D scene capability missing: Three.js namespace import');
}

const sceneChecks = [
  'WebGLRenderer',
  'CapsuleGeometry',
  'TubeGeometry',
  'CatmullRomCurve3',
  'setMode',
  'pointerdown',
  'ResizeObserver',
  'IntersectionObserver'
];
for (const token of sceneChecks) {
  if (!scene.includes(token)) throw new Error(`3D scene capability missing: ${token}`);
}

if (!ui.includes('showModal') || !ui.includes('is-complete')) throw new Error('Core UI behavior is incomplete.');

for (const file of ['assets/favicon.svg', '.github/workflows/deploy-pages.yml']) {
  await access(file);
}

await execFileAsync(process.execPath, ['--check', 'scene.js']);
await execFileAsync(process.execPath, ['--check', 'ui.js']);
console.log('Race Intelligence command-center integrity checks passed.');
