import { ChartRenderer } from './chart-renderer.js';
import { downloadText, formatTime } from './utils.js';

const MODE_LABELS = {
  studio: 'Studio',
  technical: 'Technical',
  cfd: 'CFD',
  thermal: 'Thermal',
  dynamics: 'Dynamics'
};

const LIGHT_LABELS = {
  studio: 'Neutral studio',
  technical: 'Technical white',
  night: 'Night garage',
  inspection: 'Inspection bay'
};

export class FallbackUI extends EventTarget {
  constructor({ state, telemetry, canvas, fallback }) {
    super();
    this.state = state;
    this.telemetry = telemetry;
    this.canvas = canvas;
    this.fallback = fallback;
    this.workspace = document.querySelector('[data-workspace]');
    this.heroCopy = document.querySelector('[data-hero-copy]');
    this.helpDialog = document.querySelector('[data-help-dialog]');
    this.toastStack = document.querySelector('[data-toast-stack]');
    this.chart = null;
    this.compareLap = false;
    this.frameHandle = 0;
    this.lastTime = performance.now();
    this.active = false;
    this.clickHandler = (event) => this.handleClick(event);
    this.timelineHandler = (event) => this.telemetry.setIndex(Number(event.target.value));
    this.telemetryHandler = (event) => this.updateTelemetry(event.detail);
    this.stateHandler = (event) => this.onStateChange(event.detail);
    this.visibilityHandler = () => {
      if (document.hidden) this.stop();
      else this.start();
    };
  }

  initialize(message = 'WebGL2 is unavailable on this device.') {
    this.fallback.hidden = false;
    this.canvas.hidden = true;
    this.fallback.querySelector('p').textContent = message;
    document.documentElement.dataset.quality = 'mobile';
    document.querySelector('[data-performance-label]').textContent = 'Lightweight · telemetry active';
    document.querySelector('[data-fps]').textContent = 'Paused';
    document.querySelector('[data-fps-state]').textContent = '3D renderer disabled';
    document.querySelector('[data-draw-calls]').textContent = '0';
    document.querySelector('[data-triangles]').textContent = '0';
    document.querySelector('[data-quality-tier]').textContent = 'Fallback';
    document.querySelector('[data-device-class]').textContent = navigator.userAgentData?.mobile ? 'Mobile fallback' : 'CPU-only mode';
    document.querySelector('[data-action="quality"]').textContent = 'LITE';

    const runtimeItems = [...document.querySelectorAll('[data-runtime-status] li')];
    const statuses = ['Protected', 'Disabled', 'Deterministic', 'Enabled'];
    runtimeItems.forEach((item, index) => {
      const strong = item.querySelector('strong');
      if (strong) strong.textContent = statuses[index] || 'Ready';
    });

    const chartCanvas = document.querySelector('[data-telemetry-chart]');
    if (chartCanvas) this.chart = new ChartRenderer(chartCanvas, this.telemetry);

    document.addEventListener('click', this.clickHandler);
    document.querySelector('[data-timeline]')?.addEventListener('input', this.timelineHandler);
    this.telemetry.addEventListener('frame', this.telemetryHandler);
    this.state.addEventListener('change', this.stateHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.syncMode(this.state.get('mode'));
    this.syncLight(this.state.get('lightPreset'));
    this.telemetry.emit();
    this.start();
  }

  handleClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const { action, mode, camera, light, workspaceTab, dock, quality, playback } = button.dataset;

    if (workspaceTab) this.openWorkspace(workspaceTab);
    if (dock === 'vehicle') this.openWorkspace('control');
    if (dock === 'diagnostics') this.openWorkspace('diagnostics');
    if (dock === 'analysis') this.openWorkspace('analysis');
    if (mode) this.state.set('mode', mode, 'fallback-ui');
    if (light) this.state.set('lightPreset', light, 'fallback-ui');
    if (camera) {
      document.querySelectorAll('[data-camera]').forEach((candidate) => candidate.classList.toggle('is-active', candidate.dataset.camera === camera));
      this.toast('Camera preset', '3D camera controls require WebGL2. Telemetry and analysis remain available.');
    }
    if (quality) {
      document.querySelectorAll('[data-quality]').forEach((candidate) => candidate.classList.toggle('is-active', candidate.dataset.quality === quality));
    }
    if (playback) {
      this.telemetry.setSpeed(Number(playback));
      document.querySelectorAll('[data-playback]').forEach((candidate) => candidate.classList.toggle('is-active', Number(candidate.dataset.playback) === Number(playback)));
    }

    if (action === 'enter') this.openWorkspace('control');
    if (action === 'close-workspace') this.closeWorkspace();
    if (action === 'help') this.helpDialog?.showModal();
    if (action === 'fullscreen') this.toggleFullscreen();
    if (action === 'quality') this.openWorkspace('diagnostics');
    if (action === 'play') {
      this.telemetry.setPlaying(!this.telemetry.playing);
      document.querySelector('[data-play-icon]').textContent = this.telemetry.playing ? 'Ⅱ' : '▶';
    }
    if (action === 'compare-lap') {
      this.compareLap = !this.compareLap;
      button.classList.toggle('is-active', this.compareLap);
      this.chart?.setCompare(this.compareLap);
      this.telemetry.emit();
    }
    if (action === 'export-csv') downloadText('ri60x-telemetry.csv', this.telemetry.exportCSV(), 'text/csv');
    if (action === 'export-json') downloadText('ri60x-telemetry.json', this.telemetry.exportJSON(), 'application/json');
    if (action === 'reset-scene') this.reset();
    if (action === 'cinematic' || action === 'reset-camera' || action === 'auto-orbit') {
      this.toast('3D control unavailable', 'This control is disabled in lightweight mode.');
    }
  }

  onStateChange({ path, value }) {
    if (path === 'mode') this.syncMode(value);
    if (path === 'lightPreset') this.syncLight(value);
  }

  syncMode(mode) {
    document.documentElement.dataset.mode = mode;
    document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.mode === mode));
    const label = MODE_LABELS[mode] || mode;
    document.querySelector('[data-view-label]').textContent = label;
    document.querySelector('[data-panel-title]').textContent = label;
    document.querySelector('[data-session-label]').textContent = `${label} session`;
    document.querySelector('[data-cfd-controls]').hidden = mode !== 'cfd';
    document.querySelector('[data-dynamics-controls]').hidden = mode !== 'dynamics';
  }

  syncLight(name) {
    document.querySelectorAll('[data-light]').forEach((button) => button.classList.toggle('is-active', button.dataset.light === name));
    document.querySelector('[data-light-label]').textContent = LIGHT_LABELS[name] || name;
  }

  openWorkspace(tab = 'control') {
    this.workspace.hidden = false;
    this.heroCopy.classList.add('is-hidden');
    document.querySelectorAll('[data-workspace-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.workspaceTab === tab));
    document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== tab; });
    document.querySelectorAll('[data-dock]').forEach((button) => button.classList.toggle('is-active', (tab === 'control' && button.dataset.dock === 'vehicle') || button.dataset.dock === tab));
    setTimeout(() => this.chart?.draw(), 80);
  }

  closeWorkspace() {
    this.workspace.hidden = true;
    this.heroCopy.classList.remove('is-hidden');
  }

  updateTelemetry({ frame, compare, index }) {
    const timeline = document.querySelector('[data-timeline]');
    if (timeline && document.activeElement !== timeline) timeline.value = index;
    document.querySelector('[data-timeline-time]').textContent = formatTime(frame.time);
    document.querySelector('[data-session-time]').textContent = formatTime(frame.time);
    document.querySelector('[data-tel-speed]').textContent = Math.round(frame.speed);
    document.querySelector('[data-tel-rpm]').textContent = Math.round(frame.rpm).toLocaleString('en-US');
    document.querySelector('[data-tel-gear]').textContent = frame.gear;
    const delta = this.compareLap ? frame.delta - compare.delta : frame.delta;
    const deltaElement = document.querySelector('[data-tel-delta]');
    deltaElement.textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`;
    deltaElement.style.color = delta <= 0 ? 'var(--success)' : 'var(--danger)';
    this.chart?.setIndex(index);
    this.updateWheelMetrics(frame.suspension, frame.wheelLoads);
  }

  updateWheelMetrics(travel, loads) {
    for (const key of Object.keys(travel)) {
      const element = document.querySelector(`[data-wheel="${key}"]`);
      if (!element) continue;
      element.querySelector('[data-travel]').textContent = `${travel[key] >= 0 ? '+' : ''}${travel[key].toFixed(1)} mm`;
      element.querySelector('[data-load]').textContent = `${loads[key].toFixed(2)} kN`;
      element.querySelector('b').style.width = `${Math.min(100, loads[key] / 11 * 100)}%`;
      element.querySelector('b').style.background = travel[key] >= 0 ? 'var(--danger)' : 'var(--success)';
    }
  }

  reset() {
    this.telemetry.setPlaying(false);
    this.telemetry.setSpeed(1);
    this.telemetry.setIndex(0);
    this.compareLap = false;
    this.state.patch({ mode: 'studio', lightPreset: 'studio' }, 'fallback-reset');
    document.querySelector('[data-play-icon]').textContent = '▶';
    document.querySelectorAll('[data-playback]').forEach((button) => button.classList.toggle('is-active', Number(button.dataset.playback) === 1));
    document.querySelector('[data-action="compare-lap"]')?.classList.remove('is-active');
    this.chart?.setCompare(false);
    this.toast('Lightweight state restored', 'Telemetry, workspace navigation and UI state were reset.');
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.lastTime = performance.now();
    const tick = (now) => {
      if (!this.active) return;
      const delta = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.telemetry.update(delta);
      this.frameHandle = requestAnimationFrame(tick);
    };
    this.frameHandle = requestAnimationFrame(tick);
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = 0;
  }

  toast(title, message, duration = 2400) {
    const element = document.createElement('div');
    element.className = 'toast';
    element.innerHTML = '<strong></strong><span></span>';
    element.querySelector('strong').textContent = title;
    element.querySelector('span').textContent = message;
    this.toastStack.append(element);
    setTimeout(() => element.remove(), duration);
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      this.toast('Fullscreen unavailable', 'This browser did not allow the fullscreen request.');
    }
  }

  diagnostics() {
    return {
      tier: 'fallback',
      fps: 0,
      calls: 0,
      triangles: 0,
      telemetry: true,
      telemetryFrames: this.telemetry.frames.length,
      webgl: false
    };
  }

  dispose() {
    this.stop();
    document.removeEventListener('click', this.clickHandler);
    document.querySelector('[data-timeline]')?.removeEventListener('input', this.timelineHandler);
    this.telemetry.removeEventListener('frame', this.telemetryHandler);
    this.state.removeEventListener('change', this.stateHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.chart?.dispose();
  }
}
