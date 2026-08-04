export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const round = (value, digits = 1) => Number(value.toFixed(digits));

export const COMPONENTS = [
  { id: 'front-wing', name: 'Front wing', system: 'Aero', health: 98, channels: 12, fact: 'Balances front axle load and conditions flow around the front tyres.' },
  { id: 'front-suspension', name: 'Front suspension', system: 'Mechanical', health: 97, channels: 18, fact: 'Controls platform attitude while preserving tyre contact and aero stability.' },
  { id: 'brakes', name: 'Brake assemblies', system: 'Thermal', health: 94, channels: 16, fact: 'Converts kinetic energy while remaining inside a narrow temperature window.' },
  { id: 'monocoque', name: 'Monocoque', system: 'Structure', health: 100, channels: 9, fact: 'The survival cell and structural reference for every major load path.' },
  { id: 'cockpit', name: 'Cockpit + halo', system: 'Driver', health: 100, channels: 7, fact: 'Driver environment, controls and protected human interface to the car.' },
  { id: 'sidepods', name: 'Sidepods', system: 'Cooling', health: 96, channels: 14, fact: 'Feeds cooling architecture while sculpting the airflow toward the floor and rear body.' },
  { id: 'floor', name: 'Floor + tunnels', system: 'Aero', health: 95, channels: 21, fact: 'Generates the majority of downforce through controlled underfloor pressure.' },
  { id: 'power-unit', name: 'Power unit', system: 'Energy', health: 93, channels: 28, fact: 'Coordinates combustion, electrical deployment, recovery and thermal limits.' },
  { id: 'rear-suspension', name: 'Rear suspension', system: 'Mechanical', health: 97, channels: 17, fact: 'Supports traction and protects the rear aerodynamic platform.' },
  { id: 'rear-wing', name: 'Rear wing + DRS', system: 'Aero', health: 99, channels: 11, fact: 'Sets rear load and provides controlled drag reduction on permitted zones.' },
  { id: 'telemetry', name: 'Telemetry network', system: 'Data', health: 99, channels: 64, fact: 'Synchronizes the car, garage, pit wall, factory and specialists into one race state.' }
];

const wave = (step, period, phase = 0) => Math.sin((step / period) * Math.PI * 2 + phase);

export function generateTelemetry(length = 72) {
  return Array.from({ length }, (_, index) => {
    const lap = 18 + Math.floor(index / 6);
    const tyreAge = 7 + index / 6;
    const degradation = 0.065 * tyreAge + 0.22 * Math.max(0, wave(index, 19));
    const rainPulse = index > 42 ? clamp((index - 42) / 20, 0, 1) : 0;
    return {
      index,
      time: index * 5,
      lap,
      sector: (index % 3) + 1,
      speed: round(273 + 34 * wave(index, 12) + 7 * wave(index, 5, 1.4), 0),
      throttle: round(clamp(72 + 27 * wave(index, 9, 0.5), 0, 100), 0),
      brake: round(clamp(18 + 34 * wave(index, 8, 2.7), 0, 100), 0),
      tyreFL: round(92 + degradation * 8 + 3 * wave(index, 13), 1),
      tyreFR: round(93 + degradation * 8.5 + 2.4 * wave(index, 11, 0.4), 1),
      tyreRL: round(96 + degradation * 7 + 2 * wave(index, 15, 1.1), 1),
      tyreRR: round(97 + degradation * 7.5 + 2.6 * wave(index, 14, 0.8), 1),
      brakeTemp: round(625 + 145 * Math.max(0, wave(index, 8, 2.6)), 0),
      energy: round(clamp(68 - index * 0.17 + 8 * wave(index, 18), 22, 100), 0),
      fuelDelta: round(-0.15 + 0.32 * wave(index, 24, 0.2), 2),
      aeroBalance: round(46.8 + 1.1 * wave(index, 17, 0.9), 1),
      latency: round(10.2 + 1.8 * Math.abs(wave(index, 21)), 1),
      trackTemp: round(31.4 - rainPulse * 5.8 + 0.8 * wave(index, 28), 1),
      rainfall: round(rainPulse * (1.2 + 0.8 * Math.max(0, wave(index, 10))), 1),
      confidence: round(clamp(98.8 - rainPulse * 5.5 + 0.8 * wave(index, 16), 82, 99.7), 1),
      delta: round(0.12 + degradation * 0.18 + rainPulse * 0.42 + 0.08 * wave(index, 7), 3)
    };
  });
}

export const SCENARIOS = {
  undercut: {
    label: 'Undercut window',
    description: 'Convert tyre degradation and traffic probability into a pit-window decision.',
    inputs: [
      { key: 'degradation', label: 'Tyre degradation', min: 0.04, max: 0.28, step: 0.01, unit: 's/lap', value: 0.16 },
      { key: 'pitLoss', label: 'Pit-loss estimate', min: 17, max: 27, step: 0.2, unit: 's', value: 21.8 },
      { key: 'traffic', label: 'Traffic probability', min: 0, max: 100, step: 1, unit: '%', value: 28 },
      { key: 'warmup', label: 'Warm-up delta', min: 0.2, max: 2.4, step: 0.1, unit: 's', value: 0.9 }
    ]
  },
  safety: {
    label: 'Safety car',
    description: 'Balance discounted pit loss against track position and restart tyre advantage.',
    inputs: [
      { key: 'sector', label: 'Sector position', min: 1, max: 3, step: 1, unit: '', value: 2 },
      { key: 'pitEntry', label: 'Pit-entry timing', min: 0, max: 12, step: 0.5, unit: 's', value: 4 },
      { key: 'tyreAge', label: 'Tyre age', min: 1, max: 32, step: 1, unit: 'laps', value: 17 },
      { key: 'restartGrip', label: 'Restart grip gain', min: 0.1, max: 2.5, step: 0.1, unit: 's', value: 1.2 },
      { key: 'positionCost', label: 'Track-position cost', min: 0, max: 18, step: 0.5, unit: 's', value: 6 }
    ]
  },
  rain: {
    label: 'Rain transition',
    description: 'Choose the crossover moment using track evolution, radar confidence and tyre availability.',
    inputs: [
      { key: 'rainfall', label: 'Rainfall intensity', min: 0, max: 5, step: 0.1, unit: 'mm/h', value: 1.8 },
      { key: 'trackTemp', label: 'Track temperature', min: 14, max: 42, step: 0.5, unit: '°C', value: 27 },
      { key: 'crossover', label: 'Crossover forecast', min: 0, max: 8, step: 0.2, unit: 'min', value: 2.8 },
      { key: 'radar', label: 'Radar confidence', min: 40, max: 100, step: 1, unit: '%', value: 84 },
      { key: 'interSets', label: 'Intermediate sets', min: 0, max: 4, step: 1, unit: '', value: 2 }
    ]
  }
};

export function defaultScenarioInputs(scenarioId) {
  return Object.fromEntries(SCENARIOS[scenarioId].inputs.map((input) => [input.key, input.value]));
}

export function computeStrategy(scenarioId, rawInputs) {
  const inputs = { ...defaultScenarioInputs(scenarioId), ...rawInputs };
  let options;
  let rationale;

  if (scenarioId === 'undercut') {
    const gain = inputs.degradation * 7 + (100 - inputs.traffic) * 0.018 - inputs.warmup * 0.62;
    const risk = inputs.traffic * 0.55 + inputs.warmup * 12 + Math.max(0, inputs.pitLoss - 22) * 4;
    options = [
      { id: 'pit-now', label: 'Pit now', score: 60 + gain * 16 - risk * 0.22, impact: -gain },
      { id: 'extend', label: 'Extend', score: 54 - gain * 10 + inputs.traffic * 0.08, impact: gain * 0.7 },
      { id: 'cover', label: 'Cover competitor', score: 58 + inputs.degradation * 35 - Math.abs(inputs.traffic - 45) * 0.12, impact: -gain * 0.55 }
    ];
    rationale = [
      `Current degradation projects ${round(inputs.degradation * 7, 2)} s of cumulative loss across the next seven laps.`,
      `Traffic risk is ${round(inputs.traffic, 0)}%, with a ${round(inputs.warmup, 1)} s warm-up penalty.`,
      `Pit-loss assumption is ${round(inputs.pitLoss, 1)} s and remains inside the modeled decision window.`
    ];
  } else if (scenarioId === 'safety') {
    const discountedLoss = 12.8 + inputs.pitEntry * 0.35 + inputs.positionCost * 0.38;
    const tyreBenefit = inputs.tyreAge * 0.19 + inputs.restartGrip * 4.5;
    options = [
      { id: 'pit-sc', label: 'Pit under safety car', score: 57 + tyreBenefit * 2.1 - discountedLoss * 0.65, impact: discountedLoss - tyreBenefit },
      { id: 'stay-out', label: 'Remain out', score: 61 + inputs.positionCost * 0.85 - inputs.tyreAge * 0.62, impact: tyreBenefit * 0.58 },
      { id: 'split', label: 'Split strategy', score: 59 + Math.min(8, tyreBenefit) - Math.abs(inputs.sector - 2) * 2.2, impact: (discountedLoss - tyreBenefit) * 0.42 }
    ];
    rationale = [
      `Safety-car pit loss is modeled at ${round(discountedLoss, 1)} s after entry timing and position cost.`,
      `Fresh-tyre restart benefit is valued at ${round(tyreBenefit, 1)} s over the modeled horizon.`,
      `Sector ${inputs.sector} position changes the probability of reaching pit entry before the field compresses.`
    ];
  } else {
    const wetness = inputs.rainfall * 1.8 + Math.max(0, 30 - inputs.trackTemp) * 0.12;
    const urgency = wetness + (8 - inputs.crossover) * 0.75 + inputs.radar * 0.025;
    options = [
      { id: 'slick', label: 'Remain on slicks', score: 76 - urgency * 4.2 + (100 - inputs.radar) * 0.08, impact: Math.max(0, urgency - 7) * 0.42 },
      { id: 'inter', label: 'Fit intermediates', score: 45 + urgency * 4.8 + inputs.interSets * 1.6, impact: -Math.max(0, urgency - 5) * 0.35 },
      { id: 'wet', label: 'Fit full wets', score: 22 + wetness * 5.4 + Math.max(0, inputs.rainfall - 3) * 8, impact: 0.9 - wetness * 0.08 }
    ];
    rationale = [
      `Surface wetness index is ${round(wetness, 1)} from ${round(inputs.rainfall, 1)} mm/h rainfall and ${round(inputs.trackTemp, 1)}°C track temperature.`,
      `Forecast crossover is ${round(inputs.crossover, 1)} min at ${round(inputs.radar, 0)}% radar confidence.`,
      `${inputs.interSets} intermediate set${inputs.interSets === 1 ? '' : 's'} remain available for the session.`
    ];
  }

  const ranked = options
    .map((option) => ({ ...option, score: clamp(option.score, 1, 99) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  const confidence = clamp(58 + (best.score - second.score) * 2.4, 52, 96);
  const risk = confidence > 82 ? 'LOW' : confidence > 68 ? 'CONTROLLED' : 'ELEVATED';

  return {
    scenarioId,
    recommendation: best.label,
    recommendationId: best.id,
    confidence: round(confidence, 0),
    timeImpact: round(best.impact, 2),
    risk,
    ranked: ranked.map((option) => ({ ...option, score: round(option.score, 1), impact: round(option.impact, 2) })),
    rationale,
    actionSequence: scenarioId === 'rain'
      ? ['Confirm radar cell', 'Notify driver', 'Prepare compound', 'Commit at pit entry']
      : scenarioId === 'safety'
        ? ['Freeze field model', 'Confirm pit entry', 'Prepare tyres', 'Release decision']
        : ['Validate traffic gap', 'Call tyre set', 'Issue pit instruction', 'Track out-lap delta']
  };
}

export function encodeShareState(state) {
  const payload = {
    chapter: state.chapter,
    mode: state.mode,
    scenario: state.scenario,
    inputs: state.strategyInputs
  };
  return `#${encodeURIComponent(JSON.stringify(payload))}`;
}

export function decodeShareState(hash) {
  if (!hash || hash.length < 2 || !hash.startsWith('#%7B')) return null;
  try {
    return JSON.parse(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}
