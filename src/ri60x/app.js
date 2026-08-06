import { StateManager, INITIAL_STATE } from './modules/state-manager.js';
import { AssetManager } from './modules/asset-manager.js';
import { QualityManager } from './modules/quality-manager.js';
import { SceneRuntime } from './modules/scene-runtime.js';
import { MaterialFactory } from './modules/material-factory.js';
import { VehicleController } from './modules/vehicle-controller.js';
import { CameraController } from './modules/camera-controller.js';
import { OverlayManager } from './modules/overlay-manager.js';
import { TelemetryEngine } from './modules/telemetry-engine.js';
import { UIController } from './modules/ui-controller.js';
import { FallbackUI } from './modules/fallback-ui.js';

const canvas = document.querySelector('#vehicle-canvas');
const fallback = document.querySelector('[data-webgl-fallback]');
const state = new StateManager(INITIAL_STATE);
const assets = new AssetManager();
const telemetry = new TelemetryEngine();
let runtime;
let materials;
let vehicle;
let cameraController;
let overlayManager;
let qualityManager;
let fallbackUI;
let ui;
let frameHandle = 0;
let lastTime = performance.now();
let elapsed = 0;
let active = true;

function webGLAvailable() {
  try {
    const test = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && test.getContext('webgl2', { failIfMajorPerformanceCaveat: true }));
  } catch {
    return false;
  }
}

function initializeFallback(message = 'WebGL2 is unavailable on this device.') {
  stopLoop();
  fallbackUI = assets.register('fallback-ui', new FallbackUI({ state, telemetry, canvas, fallback }), () => fallbackUI.dispose());
  fallbackUI.initialize(message);
  assets.markReady();
  assets.registerServiceWorker();
  window.RI60X = Object.freeze({
    version: '60.2.0-lite',
    state,
    telemetry,
    reset: () => fallbackUI.reset(),
    diagnostics: () => fallbackUI.diagnostics()
  });
}

function bindRuntimeState() {
  state.addEventListener('change', ({ detail }) => {
    const { path, value, source } = detail;
    if (path === 'mode') {
      vehicle.setMode(value);
      cameraController.setMode(value);
      overlayManager.setMode(value);
      if (value === 'technical' && state.get('lightPreset') === 'studio') state.set('lightPreset', 'technical', 'mode-default');
      if (value === 'studio' && state.get('lightPreset') === 'technical') state.set('lightPreset', 'studio', 'mode-default');
    }
    if (path === 'cameraPreset' && source !== 'camera') cameraController.applyPreset(value);
    if (path === 'lightPreset') runtime.setLightPreset(value);
    if (path === 'quality' && source !== 'quality-manager') qualityManager.set(value);
    if (path === 'autoOrbit') cameraController.setAutoOrbit(value);
  });

  telemetry.addEventListener('frame', ({ detail }) => {
    vehicle.setThermal(detail.frame.brakeTemp);
    vehicle.setDRS(detail.frame.drs);
  });

  ui.addEventListener('reset-scene', () => resetScene());
  assets.addEventListener('warning', ({ detail }) => ui.toast('Runtime notice', detail.message));
}

function resetScene() {
  state.patch({
    mode: 'studio',
    lightPreset: 'studio',
    cameraPreset: 'hero',
    autoOrbit: false,
    cinematic: false,
    compareLap: false,
    'playback.playing': false,
    'playback.index': 0,
    'playback.speed': 1,
    'dynamics.event': 'neutral',
    'dynamics.recording': false,
    'cfd.flowSpeed': 1,
    'cfd.vehicleSpeed': 260
  }, 'reset');
  for (const zone of Object.keys(state.get('cfd.zones'))) state.set(`cfd.zones.${zone}`, true, 'reset');
  telemetry.setPlaying(false);
  telemetry.setIndex(0);
  cameraController.reset();
  vehicle.reset();
  overlayManager.reset();
  const restored = vehicle.assertAuthoredTransforms();
  ui.toast('Scene restored', restored ? `${restored} authored transforms were restored.` : 'Camera, overlays, telemetry and authored vehicle state are nominal.');
}

function animate(now) {
  if (!active) return;
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  elapsed += delta;
  telemetry.update(delta);
  cameraController.update(delta, elapsed);
  const dynamicState = overlayManager.update(delta, elapsed, telemetry.current.brakeTemp);
  if (dynamicState) ui.updateDynamicState(dynamicState);
  qualityManager.observeFrame(delta);
  ui.updateStats(delta);
  runtime.render();
  frameHandle = requestAnimationFrame(animate);
}

function startLoop() {
  if (active && frameHandle) return;
  active = true;
  lastTime = performance.now();
  frameHandle = requestAnimationFrame(animate);
}

function stopLoop() {
  active = false;
  cancelAnimationFrame(frameHandle);
  frameHandle = 0;
}

async function initialize() {
  if (!webGLAvailable()) {
    initializeFallback();
    return;
  }
  try {
    qualityManager = assets.register('quality', new QualityManager(state.get('quality')));
    runtime = assets.register('runtime', new SceneRuntime(canvas, qualityManager), () => runtime.dispose());
    materials = assets.register('materials', new MaterialFactory(runtime.renderer), () => materials.dispose());
    vehicle = assets.register('vehicle', new VehicleController(runtime.scene, materials, qualityManager), () => vehicle.dispose());
    cameraController = assets.register('camera', new CameraController(runtime.camera, runtime.renderer, vehicle), () => cameraController.dispose());
    overlayManager = assets.register('overlays', new OverlayManager(runtime.scene, vehicle, qualityManager), () => overlayManager.dispose());
    ui = assets.register('ui', new UIController({ state, telemetry, qualityManager, cameraController, overlayManager, runtime, vehicle }), () => ui.dispose());
    bindRuntimeState();
    overlayManager.setMode(state.get('mode'));
    runtime.setLightPreset(state.get('lightPreset'));
    telemetry.emit();
    assets.markReady();
    frameHandle = requestAnimationFrame(animate);
    assets.registerServiceWorker();
    window.RI60X = Object.freeze({
      version: '60.2.0',
      state,
      telemetry,
      reset: resetScene,
      diagnostics: () => ({ ...qualityManager.getStats(), authoredTransforms: vehicle.originalTransforms.size, overlays: overlayManager.root.children.length, telemetry: true, webgl: true })
    });
  } catch (error) {
    console.warn('RI-60X initialization failed; switching to lightweight mode.', error);
    stopLoop();
    assets.dispose();
    initializeFallback('The 3D renderer could not be initialized. Telemetry and the engineering workspace remain available in lightweight mode.');
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else if (runtime) startLoop();
});
window.addEventListener('pagehide', () => {
  stopLoop();
  assets.dispose();
}, { once: true });
window.addEventListener('error', (event) => {
  console.error('RI-60X module error', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('RI-60X async error', event.reason);
});

initialize();
