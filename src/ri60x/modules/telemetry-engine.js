import { clamp, lerp, seededNoise } from './utils.js';

const SAMPLE_RATE = 30;
const FRAME_COUNT = 900;
const GEAR_RATIOS = [0, 3.15, 2.48, 1.98, 1.63, 1.38, 1.19, 1.04, .92];

function speedProfile(t) {
  const brakingOne = Math.exp(-Math.pow((t - .18) / .035, 2));
  const brakingTwo = Math.exp(-Math.pow((t - .48) / .05, 2));
  const brakingThree = Math.exp(-Math.pow((t - .74) / .042, 2));
  const acceleration = 245 + 62 * Math.sin(t * Math.PI * 2 - .8) + 34 * Math.sin(t * Math.PI * 6 + .4);
  return clamp(acceleration - brakingOne * 145 - brakingTwo * 102 - brakingThree * 128, 76, 332);
}

function selectGear(speed) {
  if (speed < 95) return 2;
  if (speed < 128) return 3;
  if (speed < 165) return 4;
  if (speed < 205) return 5;
  if (speed < 245) return 6;
  if (speed < 285) return 7;
  return 8;
}

export class TelemetryEngine extends EventTarget {
  constructor(seed = 20260805) {
    super();
    this.frames = this.buildLap(seed, 0);
    this.compareFrames = this.buildLap(seed + 17, -.42);
    this.index = 0;
    this.playing = false;
    this.playbackSpeed = 1;
    this.accumulator = 0;
  }

  buildLap(seed, lapOffset) {
    const random = seededNoise(seed);
    const frames = [];
    let brakeTemp = [390, 392, 360, 362];
    let tyreTemp = [87, 88, 89, 89];
    let ers = 82;
    let distance = 0;
    let previousSpeed = speedProfile(0);
    for (let i = 0; i < FRAME_COUNT; i += 1) {
      const t = i / (FRAME_COUNT - 1);
      const seconds = i / SAMPLE_RATE;
      const rawSpeed = speedProfile(t);
      const speed = clamp(rawSpeed + (random() - .5) * 1.2 + lapOffset * .8, 0, 350);
      const acceleration = (speed - previousSpeed) * SAMPLE_RATE / 3.6;
      const brake = clamp(-acceleration / 24, 0, 1);
      const throttle = clamp(.18 + acceleration / 13 + (1 - brake) * .62, 0, 1);
      const gear = selectGear(speed);
      const wheelRpm = speed / 3.6 / (2 * Math.PI * .36) * 60;
      const rpm = clamp(wheelRpm * GEAR_RATIOS[gear] * 3.35, 5800, 15000);
      const lateral = 2.2 * Math.sin(t * Math.PI * 5.7) + .9 * Math.sin(t * Math.PI * 13.2);
      const loadTransfer = clamp(lateral / 4.4, -1, 1);
      brakeTemp = brakeTemp.map((temp, corner) => {
        const frontBias = corner < 2 ? 1.18 : .82;
        return clamp(temp + brake * 32 * frontBias - (temp - 320) * .008 - speed * .0014, 260, 1100);
      });
      tyreTemp = tyreTemp.map((temp, corner) => {
        const side = corner % 2 === 0 ? -1 : 1;
        const load = 1 + loadTransfer * side * .17 + brake * (corner < 2 ? .12 : -.05);
        return clamp(temp + load * speed * .00062 + Math.abs(lateral) * .012 - (temp - 78) * .012, 72, 128);
      });
      const ersDeploy = throttle * clamp(speed / 260, .25, 1) * 1.35;
      const ersHarvest = brake * 2.1;
      ers = clamp(ers + (ersHarvest - ersDeploy) * .12, 5, 100);
      const drs = speed > 282 && throttle > .88 && Math.abs(lateral) < .8 ? 1 : 0;
      distance += speed / 3.6 / SAMPLE_RATE;
      const sector = t < .335 ? 1 : t < .67 ? 2 : 3;
      const referenceDelta = lapOffset + Math.sin(t * Math.PI * 3.4) * .09 + (random() - .5) * .008;
      const suspension = {
        fl: clamp(-acceleration * .9 - lateral * 3.3 + Math.sin(t * 90) * 1.1, -24, 30),
        fr: clamp(-acceleration * .9 + lateral * 3.3 + Math.sin(t * 88 + .4) * 1.1, -24, 30),
        rl: clamp(acceleration * .35 - lateral * 2.4 + Math.sin(t * 82 + .8), -20, 23),
        rr: clamp(acceleration * .35 + lateral * 2.4 + Math.sin(t * 84 + 1.2), -20, 23)
      };
      const wheelLoads = {
        fl: clamp(6.0 + brake * 2.4 - loadTransfer * 1.55, 3.5, 10.6),
        fr: clamp(6.0 + brake * 2.4 + loadTransfer * 1.55, 3.5, 10.6),
        rl: clamp(6.8 - brake * 1.4 - loadTransfer * 1.75, 3.5, 10.8),
        rr: clamp(6.8 - brake * 1.4 + loadTransfer * 1.75, 3.5, 10.8)
      };
      frames.push({
        index: i,
        time: seconds,
        progress: t,
        distance,
        sector,
        speed,
        acceleration,
        rpm,
        gear,
        throttle,
        brake,
        steering: lateral * 3.4,
        lateralG: lateral,
        brakeTemp: [...brakeTemp],
        tyreTemp: [...tyreTemp],
        ers,
        drs,
        delta: referenceDelta,
        suspension,
        wheelLoads
      });
      previousSpeed = speed;
    }
    return frames;
  }

  get current() {
    return this.frames[Math.round(this.index)] || this.frames[0];
  }

  setIndex(index) {
    this.index = clamp(Number(index) || 0, 0, this.frames.length - 1);
    this.emit();
  }

  setPlaying(playing) {
    this.playing = Boolean(playing);
    this.dispatchEvent(new CustomEvent('playback', { detail: { playing: this.playing } }));
  }

  setSpeed(speed) {
    this.playbackSpeed = clamp(Number(speed) || 1, .25, 4);
  }

  update(delta) {
    if (!this.playing) return;
    this.accumulator += delta * SAMPLE_RATE * this.playbackSpeed;
    if (this.accumulator < 1) return;
    const step = Math.floor(this.accumulator);
    this.accumulator -= step;
    this.index += step;
    if (this.index >= this.frames.length - 1) this.index = 0;
    this.emit();
  }

  emit() {
    const frame = this.current;
    const compare = this.compareFrames[Math.round(this.index)] || this.compareFrames[0];
    this.dispatchEvent(new CustomEvent('frame', { detail: { frame, compare, index: Math.round(this.index) } }));
  }

  sample(width) {
    const count = Math.max(60, Math.min(width || 300, this.frames.length));
    const step = (this.frames.length - 1) / (count - 1);
    return Array.from({ length: count }, (_, i) => this.frames[Math.round(i * step)]);
  }

  exportCSV() {
    const header = ['time_s', 'distance_m', 'speed_kmh', 'rpm', 'gear', 'throttle_pct', 'brake_pct', 'steering_deg', 'lateral_g', 'brake_temp_fl_c', 'brake_temp_fr_c', 'brake_temp_rl_c', 'brake_temp_rr_c', 'tyre_temp_fl_c', 'tyre_temp_fr_c', 'tyre_temp_rl_c', 'tyre_temp_rr_c', 'ers_pct', 'drs', 'delta_s'];
    const rows = this.frames.map((frame) => [
      frame.time.toFixed(3), frame.distance.toFixed(2), frame.speed.toFixed(2), Math.round(frame.rpm), frame.gear,
      (frame.throttle * 100).toFixed(1), (frame.brake * 100).toFixed(1), frame.steering.toFixed(2), frame.lateralG.toFixed(3),
      ...frame.brakeTemp.map((value) => value.toFixed(1)), ...frame.tyreTemp.map((value) => value.toFixed(1)),
      frame.ers.toFixed(1), frame.drs, frame.delta.toFixed(3)
    ]);
    return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  exportJSON() {
    return JSON.stringify({
      schema: 'race-intelligence.telemetry.v1',
      sampleRateHz: SAMPLE_RATE,
      generatedAt: new Date().toISOString(),
      units: { speed: 'km/h', rpm: 'rev/min', temperature: 'degC', suspension: 'mm', load: 'kN', time: 's' },
      frames: this.frames
    }, null, 2);
  }
}

export { SAMPLE_RATE, FRAME_COUNT };
