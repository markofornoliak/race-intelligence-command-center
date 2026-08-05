export class StateManager extends EventTarget {
  constructor(initialState) {
    super();
    this.state = structuredClone(initialState);
  }

  get(path) {
    if (!path) return this.state;
    return path.split('.').reduce((value, key) => value?.[key], this.state);
  }

  set(path, value, source = 'runtime') {
    const keys = path.split('.');
    const leaf = keys.pop();
    let cursor = this.state;
    for (const key of keys) {
      cursor[key] ??= {};
      cursor = cursor[key];
    }
    const previous = cursor[leaf];
    if (Object.is(previous, value)) return;
    cursor[leaf] = value;
    this.dispatchEvent(new CustomEvent('change', { detail: { path, value, previous, source } }));
    this.dispatchEvent(new CustomEvent(`change:${path}`, { detail: { value, previous, source } }));
  }

  patch(values, source = 'runtime') {
    for (const [path, value] of Object.entries(values)) this.set(path, value, source);
  }

  reset(nextState) {
    this.state = structuredClone(nextState);
    this.dispatchEvent(new CustomEvent('reset', { detail: { state: this.state } }));
  }
}

export const INITIAL_STATE = Object.freeze({
  mode: 'studio',
  workspace: 'control',
  workspaceOpen: false,
  lightPreset: 'studio',
  cameraPreset: 'hero',
  quality: 'auto',
  autoOrbit: false,
  cinematic: false,
  compareLap: false,
  playback: { playing: false, index: 0, speed: 1 },
  cfd: {
    flowSpeed: 1,
    vehicleSpeed: 260,
    zones: { frontWing: true, tyres: true, floor: true, diffuser: true }
  },
  dynamics: { event: 'neutral', recording: false }
});
