import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const assemble = async (directory) => {
  const files = (await readdir(directory)).filter((file) => file.endsWith('.part')).sort();
  if (!files.length) throw new Error(`No source parts found in ${directory}.`);
  return (await Promise.all(files.map((file) => readFile(join(directory, file), 'utf8')))).join('');
};

const html = await assemble('src/index');
const css = await assemble('src/styles');
const scene = await assemble('src/scene');
const ui = await assemble('src/ui');

const copyChecks = [
  'DRIVING PERFORMANCE WITH',
  'EFFICIENT',
  'DATA ACCESS',
  'PLAY BRIEFING',
  'EXPLORE CITRIX HDX',
  'Speed is an information problem already solved.',
  'ONE LAP.',
  'MOVE THE'
];
for (const copy of copyChecks) {
  if (!html.includes(copy)) throw new Error(`Required campaign copy missing: ${copy}`);
}

if ((html.match(/<h1/g) || []).length !== 1) throw new Error('The page must contain exactly one h1.');
if (!html.includes('type="importmap"')) throw new Error('Three.js import map is missing.');
if (!html.includes('<dialog')) throw new Error('Briefing dialog is missing.');
if (!html.includes('aria-label')) throw new Error('Accessible labels are incomplete.');
if (!html.includes('data-menu-toggle')) throw new Error('Responsive navigation is missing.');
if (!html.includes('data-chapter')) throw new Error('Chapter tracking is missing.');
if (!css.includes('@media (max-width:760px)')) throw new Error('Mobile layout breakpoint is missing.');
if (!css.includes('prefers-reduced-motion')) throw new Error('Reduced-motion support is missing.');
if (!css.includes(':focus-visible')) throw new Error('Keyboard focus styling is missing.');

for (const token of [
  'RI–05 / DIGITAL TWIN',
  '.scene-readout::before',
  '.operations__board::before',
  '@media (max-width: 900px)'
]) {
  if (!css.includes(token)) throw new Error(`RI-05 visual layer missing: ${token}`);
}

const threeImportPattern = /import\s*\*\s*as\s+THREE\s*from\s*['"]three['"]/;
if (!threeImportPattern.test(scene)) throw new Error('Three.js namespace import is missing.');

for (const token of [
  'WebGLRenderer',
  'CapsuleGeometry',
  'TubeGeometry',
  'CatmullRomCurve3',
  'setMode',
  'pointerdown',
  'ResizeObserver',
  'IntersectionObserver',
  'requestAnimationFrame',
  'ri05Loft',
  'ri05WheelSpecs',
  'MeshPhysicalMaterial',
  'TorusGeometry',
  'CircleGeometry',
  "modelReadout.textContent = 'RI–05'"
]) {
  if (!scene.includes(token)) throw new Error(`3D scene capability missing: ${token}`);
}

for (const token of ['showModal', 'is-complete', 'IntersectionObserver', 'data-progress-bar', 'aria-expanded']) {
  if (!ui.includes(token)) throw new Error(`Core UI behavior missing: ${token}`);
}

for (const file of ['assets/favicon.svg', '.github/workflows/deploy-pages.yml']) {
  await access(file);
}

const validationDir = await mkdtemp(join(tmpdir(), 'race-intelligence-'));
try {
  const scenePath = join(validationDir, 'scene.mjs');
  const uiPath = join(validationDir, 'ui.js');
  await writeFile(scenePath, scene);
  await writeFile(uiPath, ui);
  await execFileAsync(process.execPath, ['--check', scenePath]);
  await execFileAsync(process.execPath, ['--check', uiPath]);
} finally {
  await rm(validationDir, { recursive: true, force: true });
}

console.log('Race Intelligence RI-05 integrity checks passed.');
