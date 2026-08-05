import * as THREE from 'three';
import { clamp } from './utils.js';

const TIERS = Object.freeze({
  high: { pixelRatio: 1.8, shadow: 2048, antialias: true, cfdLines: 36, cfdMarkers: 72, dof: true },
  balanced: { pixelRatio: 1.35, shadow: 1536, antialias: true, cfdLines: 24, cfdMarkers: 40, dof: false },
  mobile: { pixelRatio: 1, shadow: 768, antialias: false, cfdLines: 12, cfdMarkers: 16, dof: false }
});

export class QualityManager extends EventTarget {
  constructor(preference = 'auto') {
    super();
    this.preference = preference;
    this.mobile = matchMedia('(max-width: 760px)').matches || navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 820;
    this.memory = navigator.deviceMemory || 4;
    this.cores = navigator.hardwareConcurrency || 4;
    this.tier = this.resolveTier(preference);
    this.samples = [];
    this.cooldown = 0;
    this.renderer = null;
    this.lights = [];
    document.documentElement.dataset.quality = this.tier;
  }

  resolveTier(preference) {
    if (preference !== 'auto' && TIERS[preference]) return preference;
    if (this.mobile || this.memory <= 4 || this.cores <= 4) return 'mobile';
    if (this.memory >= 8 && this.cores >= 8) return 'high';
    return 'balanced';
  }

  get config() {
    return TIERS[this.tier];
  }

  createRenderer(canvas) {
    const config = this.config;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: config.antialias,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.pixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    this.renderer = renderer;
    return renderer;
  }

  registerShadowLight(light) {
    this.lights.push(light);
    this.apply();
  }

  set(preference, reason = 'user') {
    this.preference = preference;
    const next = this.resolveTier(preference);
    if (next === this.tier) return;
    const previous = this.tier;
    this.tier = next;
    document.documentElement.dataset.quality = next;
    this.apply();
    this.dispatchEvent(new CustomEvent('change', { detail: { tier: next, previous, reason } }));
  }

  apply() {
    if (!this.renderer) return;
    const config = this.config;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.pixelRatio));
    for (const light of this.lights) {
      if (!light.shadow?.mapSize) continue;
      light.shadow.mapSize.set(config.shadow, config.shadow);
      light.shadow.map?.dispose();
      light.shadow.map = null;
    }
  }

  observeFrame(delta) {
    if (delta <= 0 || delta > .5) return;
    this.samples.push(1 / delta);
    if (this.samples.length > 120) this.samples.shift();
    this.cooldown = Math.max(0, this.cooldown - delta);
    if (this.preference !== 'auto' || this.cooldown > 0 || this.samples.length < 90) return;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * .25)];
    if (p25 < 38 && this.tier === 'high') {
      this.tier = 'balanced';
      this.cooldown = 12;
      this.apply();
      document.documentElement.dataset.quality = this.tier;
      this.dispatchEvent(new CustomEvent('change', { detail: { tier: this.tier, previous: 'high', reason: 'fps-drop' } }));
    } else if (p25 < 29 && this.tier === 'balanced') {
      this.tier = 'mobile';
      this.cooldown = 14;
      this.apply();
      document.documentElement.dataset.quality = this.tier;
      this.dispatchEvent(new CustomEvent('change', { detail: { tier: this.tier, previous: 'balanced', reason: 'fps-drop' } }));
    }
  }

  getStats() {
    const fps = this.samples.length ? this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length : 0;
    const info = this.renderer?.info;
    return {
      fps: Math.round(clamp(fps, 0, 240)),
      calls: info?.render.calls ?? 0,
      triangles: info?.render.triangles ?? 0,
      tier: this.tier,
      device: this.mobile ? 'Mobile / touch' : `${this.cores} cores · ${this.memory} GB class`
    };
  }
}
