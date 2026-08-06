import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function readParts(directory) {
  const names = (await readdir(directory)).filter((name) => name.endsWith('.part')).sort();
  return (await Promise.all(names.map((name) => readFile(join(directory, name), 'utf8')))).join('');
}

const [vehicle, overlays, ui, styles, camera, materials, scene, app, fallback, serviceWorker, packageSource] = await Promise.all([
  readParts('src/ri60x/modules/vehicle-controller'),
  readParts('src/ri60x/modules/overlay-manager'),
  readParts('src/ri60x/modules/ui-controller'),
  readParts('src/ri60x/styles'),
  readFile('src/ri60x/modules/camera-controller.js', 'utf8'),
  readFile('src/ri60x/modules/material-factory.js', 'utf8'),
  readFile('src/ri60x/modules/scene-runtime.js', 'utf8'),
  readFile('src/ri60x/app.js', 'utf8'),
  readFile('src/ri60x/modules/fallback-ui.js', 'utf8'),
  readFile('src/ri60x/sw.js', 'utf8'),
  readFile('package.json', 'utf8')
]);

const requireTokens = (name, source, tokens) => {
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`${name} regression: missing ${token}`);
  }
};

requireTokens('connected suspension', vehicle, [
  'CORNER_ASSEMBLY_', 'UPRIGHT_', 'coilSpringBetween', 'antiRollLinkEnd',
  'InstancedMesh', 'BRAKE_DUCT_', 'independentThermalMaterial'
]);
requireTokens('analytic dynamics', overlays, [
  'ANALYTIC_CHASSIS_REFERENCE', 'ANALYTIC_WHEEL_MARKER_',
  'Vehicle longitudinal axis is X', 'length = clamp(.22 + normalized * .56, .22, .78)'
]);
requireTokens('camera safety', camera, [
  'MODE_DEFAULTS', 'ri60x-camera-modes', 'enforceSafeCamera',
  'collisionRay', 'TOUCH.DOLLY_ROTATE', 'camera.near = near'
]);
requireTokens('deterministic PBR', materials, [
  'seededRandom', 'carbonNormal', 'metalMap', 'roughnessMap',
  'NoColorSpace', 'clone(name'
]);
if (materials.includes('Math.random')) throw new Error('Materials must not use non-deterministic Math.random.');
requireTokens('neutral lighting', scene, [
  'RectAreaLight', 'Neutral', 'contactShadow', 'ACES',
  'environmentTexture', 'this.platformRing', 'maxblur: .003'
].filter((token) => token !== 'Neutral' && token !== 'ACES'));
requireTokens('mobile bottom sheet', styles, [
  'native mobile workspace', '100dvh', 'ri60x-sheet-in',
  'env(safe-area-inset-bottom)', 'overflow:visible', 'min-height:44px'
]);
requireTokens('UI lifecycle', ui, [
  'AbortController', 'listenerController?.abort', "addEventListener('visibilitychange'",
  "screen.orientation?.addEventListener", 'replaceChildren()'
]);
requireTokens('fallback runtime', fallback, ['Lightweight', 'telemetryFrames', 'openWorkspace', 'exportCSV', 'exportJSON']);
requireTokens('cache invalidation', serviceWorker, ['ri60x-unified-v3', 'networkFirst', 'skipWaiting', 'clients.claim']);
requireTokens('runtime integration', app, ["version: '60.2.0'", 'cameraController.setMode(value)', 'initializeFallback']);
if (JSON.parse(packageSource).version !== '60.2.0') throw new Error('Package version must be 60.2.0.');

console.log('RI-60X 60.2 regression guards passed: connected corners, safe cameras, deterministic PBR, neutral lighting, mobile bottom sheet and abortable lifecycle.');
