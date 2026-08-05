export const CHAPTERS = ['command','twin','race','strategy','pit','operations','evidence','final'];

export const COMPONENTS = [
  { id:'front-wing', name:'Front Wing', type:'Aerodynamic', health:98.9, channels:62, copy:'Multi-element front aero platform controlling front load, tyre wake and downstream flow quality.' },
  { id:'front-suspension', name:'Front Suspension', type:'Mechanical', health:99.3, channels:88, copy:'Pushrod geometry translating tyre contact loads into a stable aerodynamic platform.' },
  { id:'front-brakes', name:'Front Brakes', type:'Thermal', health:97.8, channels:54, copy:'Carbon brake assemblies operating inside a narrow temperature and energy window.' },
  { id:'nose', name:'Nose Structure', type:'Structural', health:99.7, channels:21, copy:'Crash structure and primary front-load transfer path into the monocoque.' },
  { id:'monocoque', name:'Monocoque', type:'Structural', health:99.8, channels:186, copy:'The structural reference frame connecting driver cell, suspension loads and power-unit package.' },
  { id:'cockpit', name:'Cockpit & Halo', type:'Safety', health:100, channels:42, copy:'Driver survival cell, halo structure, steering controls and biometric instrumentation.' },
  { id:'sidepods', name:'Sidepods', type:'Cooling', health:98.6, channels:112, copy:'Cooling inlet and bodywork package balancing heat rejection against aerodynamic efficiency.' },
  { id:'floor', name:'Floor & Venturi', type:'Aerodynamic', health:97.4, channels:144, copy:'Primary ground-effect system generating load through controlled underfloor pressure.' },
  { id:'power-unit', name:'Power Unit', type:'Energy', health:98.1, channels:224, copy:'Combustion, electrical deployment, recovery and thermal systems operating as one energy package.' },
  { id:'rear-suspension', name:'Rear Suspension', type:'Mechanical', health:99.1, channels:84, copy:'Rear platform control connecting traction, tyre state and diffuser stability.' },
  { id:'diffuser', name:'Diffuser', type:'Aerodynamic', health:97.9, channels:68, copy:'Expands underfloor flow to recover pressure while protecting rear load consistency.' },
  { id:'rear-wing', name:'Rear Wing & DRS', type:'Aerodynamic', health:99.0, channels:73, copy:'Rear load and drag-control assembly with monitored DRS actuation and pressure state.' },
  { id:'data-network', name:'Data Network', type:'Systems', health:99.94, channels:1248, copy:'Distributed sensing, edge acquisition and governed data paths forming the shared race state.' }
];

export const NETWORK_NODES = [
  { id:'car', label:'CAR', x:12, y:50, location:'CIRCUIT / MOVING EDGE', latency:2, quality:99.8, apps:['ECU','Sensor gateway'], copy:'Originates high-frequency vehicle state and receives approved control instructions.' },
  { id:'garage', label:'GARAGE', x:30, y:28, location:'CIRCUIT / EXECUTION', latency:5, quality:99.7, apps:['Telemetry','Setup tools'], copy:'Executes mechanical changes and validates the physical state of the car.' },
  { id:'pit-wall', label:'PIT WALL', x:42, y:53, location:'CIRCUIT / PRIMARY DECISION', latency:7, quality:99.9, apps:['Strategy','Timing','Radio'], copy:'Combines live evidence, model recommendations and human judgment into the operational call.' },
  { id:'trackside', label:'TRACKSIDE ENG', x:55, y:24, location:'CIRCUIT / ANALYSIS', latency:8, quality:99.5, apps:['Telemetry','Simulation client'], copy:'Interprets car behavior and maintains the engineering model during the session.' },
  { id:'factory', label:'FACTORY SIM', x:70, y:52, location:'FACTORY / COMPUTE', latency:11, quality:99.6, apps:['Driver-in-loop','CFD cache','Race model'], copy:'Runs specialist simulation and comparison workloads against the synchronized race state.' },
  { id:'strategy', label:'STRATEGY GROUP', x:84, y:27, location:'FACTORY / DECISION SUPPORT', latency:12, quality:99.4, apps:['Monte Carlo','Competitor model'], copy:'Tests alternative decisions and quantifies expected time, confidence and risk.' },
  { id:'specialist', label:'SPECIALIST', x:86, y:70, location:'REMOTE / DOMAIN EXPERT', latency:16, quality:98.9, apps:['CAD viewer','Thermal analysis'], copy:'Provides expert intervention without moving governed applications or datasets outside the controlled environment.' },
  { id:'governed', label:'GOVERNED ENV', x:61, y:78, location:'CENTRAL / CONTROLLED', latency:10, quality:99.99, apps:['Access control','Session brokering','Audit'], copy:'Hosts sensitive engineering applications, identities and datasets under central control.' }
];

export const PIT_STEPS = [
  { t:0.00, label:'CAR ENTERS BOX', owner:'DRIVER', status:'APPROACH SPEED CONTROLLED' },
  { t:0.18, label:'FRONT JACK ENGAGED', owner:'FRONT JACK', status:'FRONT AXLE LIFTING' },
  { t:0.24, label:'REAR JACK ENGAGED', owner:'REAR JACK', status:'CAR FULLY SUPPORTED' },
  { t:0.36, label:'WHEEL GUNS RELEASE', owner:'4 GUNNERS', status:'NUT TORQUE RELEASED' },
  { t:0.58, label:'USED TYRES CLEAR', owner:'4 REMOVERS', status:'OLD SET REMOVED' },
  { t:0.84, label:'NEW TYRES PRESENTED', owner:'4 FITTERS', status:'NEW SET ALIGNED' },
  { t:1.16, label:'WHEEL NUTS TORQUED', owner:'4 GUNNERS', status:'TORQUE CONFIRMED' },
  { t:1.42, label:'FRONT JACK DROPS', owner:'FRONT JACK', status:'FRONT AXLE RELEASED' },
  { t:1.54, label:'REAR JACK DROPS', owner:'REAR JACK', status:'CAR ON GROUND' },
  { t:1.72, label:'ALL CORNERS GREEN', owner:'SYSTEM', status:'RELEASE CONDITIONS MET' },
  { t:1.94, label:'RELEASE SIGNAL', owner:'LOLLIPOP / LIGHT', status:'PIT LANE CLEAR' },
  { t:2.18, label:'CAR EXITS BOX', owner:'DRIVER', status:'STOP COMPLETE' }
];

export const SCENARIOS = {
  undercut: {
    title:'UNDERCUT WINDOW',
    subtitle:'Protect track position before tyre warm-up advantage closes.',
    defaults:{ degradation:0.18, pitLoss:21.4, traffic:28, warmup:1.35, gap:1.8 },
    fields:[
      { key:'degradation', label:'TYRE DEGRADATION', min:0.05, max:0.35, step:0.01, unit:'s/lap' },
      { key:'pitLoss', label:'PIT-LOSS ESTIMATE', min:18, max:28, step:0.1, unit:'s' },
      { key:'traffic', label:'TRAFFIC PROBABILITY', min:0, max:100, step:1, unit:'%' },
      { key:'warmup', label:'WARM-UP DELTA', min:0.4, max:2.8, step:0.05, unit:'s' },
      { key:'gap', label:'GAP TO RIVAL', min:-1, max:5, step:0.1, unit:'s' }
    ],
    decisions:['PIT NOW','EXTEND','COVER RIVAL']
  },
  safety: {
    title:'SAFETY CAR',
    subtitle:'Trade track position against discounted pit loss and restart tyre state.',
    defaults:{ pitDiscount:8.6, tyreAge:18, trackCost:4, restartGrip:72, fieldCompression:86 },
    fields:[
      { key:'pitDiscount', label:'PIT-LOSS DISCOUNT', min:2, max:14, step:0.1, unit:'s' },
      { key:'tyreAge', label:'CURRENT TYRE AGE', min:0, max:38, step:1, unit:'laps' },
      { key:'trackCost', label:'TRACK POSITIONS LOST', min:0, max:10, step:1, unit:'cars' },
      { key:'restartGrip', label:'RESTART GRIP INDEX', min:45, max:100, step:1, unit:'idx' },
      { key:'fieldCompression', label:'FIELD COMPRESSION', min:20, max:100, step:1, unit:'%' }
    ],
    decisions:['PIT UNDER SC','STAY OUT','SPLIT STRATEGY']
  },
  rain: {
    title:'RAIN TRANSITION',
    subtitle:'Choose the crossover lap while rainfall confidence and tyre temperature evolve.',
    defaults:{ rainfall:1.8, trackTemp:24, crossover:2.4, radarConfidence:78, tyreTemp:91 },
    fields:[
      { key:'rainfall', label:'RAINFALL INTENSITY', min:0, max:5, step:0.1, unit:'mm/h' },
      { key:'trackTemp', label:'TRACK TEMPERATURE', min:10, max:42, step:1, unit:'°C' },
      { key:'crossover', label:'CROSSOVER FORECAST', min:0, max:8, step:0.1, unit:'laps' },
      { key:'radarConfidence', label:'RADAR CONFIDENCE', min:20, max:100, step:1, unit:'%' },
      { key:'tyreTemp', label:'SLICK TYRE TEMP', min:55, max:110, step:1, unit:'°C' }
    ],
    decisions:['STAY SLICK','INTERMEDIATE','FULL WET']
  }
};

export function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function hashValues(values) {
  const text = JSON.stringify(values);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const smooth = (v) => v * v * (3 - 2 * v);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round = (v, precision = 2) => Number(v.toFixed(precision));

export function buildCircuit(samples = 220) {
  const points = [];
  for (let i = 0; i < samples; i += 1) {
    const t = (i / samples) * Math.PI * 2;
    const radial = 1 + Math.sin(t * 3 + 0.6) * 0.13 + Math.sin(t * 5 - 0.4) * 0.07;
    const x = Math.cos(t) * radial * 0.47 + Math.sin(t * 2) * 0.06;
    const y = Math.sin(t) * (0.34 + Math.cos(t * 4) * 0.025) + Math.cos(t * 3) * 0.045;
    points.push({ x: round(x, 5), y: round(y, 5) });
  }
  return points;
}

export function buildTelemetry(frameCount = 180, seed = 20260805) {
  const rand = seededRandom(seed);
  const frames = [];
  const events = [
    { frame:8, type:'INFO', label:'DRS detection line crossed' },
    { frame:31, type:'MODEL', label:'Rear tyre degradation above baseline' },
    { frame:54, type:'RIVAL', label:'Car 14 enters predicted undercut window' },
    { frame:76, type:'ALERT', label:'Brake temperature peak at Turn 11' },
    { frame:101, type:'STRATEGY', label:'Pit-now recommendation confidence exceeds 80%' },
    { frame:128, type:'WEATHER', label:'Sector 3 wind direction changes 14°' },
    { frame:151, type:'SYSTEM', label:'Factory comparison lap synchronized' },
    { frame:172, type:'RADIO', label:'Driver reports rear instability on entry' }
  ];

  for (let i = 0; i < frameCount; i += 1) {
    const phase = i / (frameCount - 1);
    const cornerWave = Math.sin(phase * Math.PI * 14) * 0.5 + Math.sin(phase * Math.PI * 31) * 0.22;
    const braking = Math.max(0, Math.sin(phase * Math.PI * 14 + 1.15));
    const speed = 238 + cornerWave * 91 - braking * 72 + (rand() - 0.5) * 4;
    const tyre = 91 + Math.sin(phase * Math.PI * 5) * 3.2 + phase * 5.4 + (rand() - 0.5) * 0.8;
    const brake = 430 + braking * 405 + Math.sin(phase * Math.PI * 22) * 38;
    const ers = 81 - phase * 28 + Math.sin(phase * Math.PI * 8) * 8;
    const fuel = -0.16 - phase * 0.62 + Math.sin(phase * Math.PI * 2) * 0.05;
    const balance = 0.2 + Math.sin(phase * Math.PI * 6) * 1.1 + phase * 0.5;
    const latency = 10.3 + Math.sin(phase * Math.PI * 4) * 1.2 + rand() * 1.1;
    const pressure = [22.1,22.0,20.2,20.3].map((base, index) => base + phase * 0.52 + Math.sin(phase * Math.PI * (4 + index)) * 0.12);
    frames.push({
      index:i,
      time:round(i * 0.418, 3),
      lap:31 + Math.floor(phase * 2),
      sector:phase < 0.33 ? 1 : phase < 0.67 ? 2 : 3,
      progress:round(phase, 5),
      speed:round(clamp(speed, 82, 342), 1),
      tyre:round(tyre, 1),
      brake:round(brake, 0),
      ers:round(clamp(ers, 18, 100), 1),
      fuel:round(fuel, 2),
      balance:round(balance, 1),
      latency:round(latency, 1),
      confidence:round(92 + smooth(phase) * 6.2, 1),
      channels:1248 + Math.round(Math.sin(phase * Math.PI * 3) * 16),
      compound:phase > 0.68 ? 'HARD' : 'MEDIUM',
      pressure:pressure.map((v) => round(v, 2)),
      tyreZones:[
        round(tyre + 1.4, 1), round(tyre + 0.5, 1), round(tyre - 0.8, 1),
        round(tyre + 2.0, 1), round(tyre + 0.8, 1), round(tyre - 0.3, 1),
        round(tyre + 1.0, 1), round(tyre + 0.2, 1), round(tyre - 1.2, 1),
        round(tyre + 1.7, 1), round(tyre + 0.7, 1), round(tyre - 0.5, 1)
      ],
      activeEvents:events.filter((event) => event.frame <= i).slice(-5)
    });
  }
  return { frames, events, circuit:buildCircuit() };
}

function scenarioScores(scenario, values) {
  if (scenario === 'undercut') {
    const pitNow = values.degradation * 26 + values.warmup * 2.4 + values.gap * 1.4 - values.traffic * 0.045 - (values.pitLoss - 21) * 0.65;
    const extend = (values.pitLoss - 20) * 0.85 + values.traffic * 0.035 - values.degradation * 19 - values.warmup * 0.9;
    const cover = values.gap * 1.7 + values.degradation * 13 + values.traffic * 0.016 - Math.abs(values.warmup - 1.4) * 0.6;
    return [pitNow, extend, cover];
  }
  if (scenario === 'safety') {
    const pit = values.pitDiscount * 1.25 + values.tyreAge * 0.31 + values.restartGrip * 0.055 - values.trackCost * 1.45;
    const stay = values.trackCost * 1.8 + (100 - values.fieldCompression) * 0.05 - values.tyreAge * 0.38 - values.pitDiscount * 0.55;
    const split = values.fieldCompression * 0.07 + values.trackCost * 0.5 + values.pitDiscount * 0.45 - Math.abs(values.restartGrip - 76) * 0.08;
    return [pit, stay, split];
  }
  const slick = (2.3 - values.rainfall) * 2.4 + values.trackTemp * 0.08 + values.tyreTemp * 0.045 - values.radarConfidence * 0.025;
  const inter = values.rainfall * 1.75 + values.radarConfidence * 0.055 - Math.abs(values.crossover - 2.1) * 0.7 + (95 - values.tyreTemp) * 0.03;
  const wet = values.rainfall * 1.18 + values.radarConfidence * 0.03 - values.trackTemp * 0.035 - Math.abs(values.crossover - 0.7) * 0.6;
  return [slick, inter, wet];
}

function deltaForScenario(scenario, score, index, rand) {
  const noise = (rand() + rand() + rand() - 1.5) * 1.25;
  const bias = scenario === 'undercut' ? [-1.4,0.5,-0.4][index] : scenario === 'safety' ? [-0.9,0.4,-0.2][index] : [0.2,-1.1,-0.45][index];
  return bias - score * 0.12 + noise;
}

export function runStrategy(scenarioKey, values, runs = 1200) {
  const scenario = SCENARIOS[scenarioKey] ?? SCENARIOS.undercut;
  const normalized = { ...scenario.defaults, ...values };
  const scores = scenarioScores(scenarioKey, normalized);
  const bestIndex = scores.indexOf(Math.max(...scores));
  const seed = hashValues({ scenarioKey, normalized, runs });
  const rand = seededRandom(seed);
  const outcomes = [];
  let wins = 0;

  for (let i = 0; i < runs; i += 1) {
    const candidateDeltas = scores.map((score, index) => deltaForScenario(scenarioKey, score, index, rand));
    const chosen = candidateDeltas[bestIndex];
    outcomes.push(round(chosen, 3));
    if (chosen === Math.min(...candidateDeltas)) wins += 1;
  }

  outcomes.sort((a,b) => a - b);
  const mean = outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length;
  const p10 = outcomes[Math.floor(outcomes.length * 0.1)];
  const p90 = outcomes[Math.floor(outcomes.length * 0.9)];
  const confidence = clamp(Math.round((wins / runs) * 100), 51, 96);
  const spread = p90 - p10;
  const risk = spread < 1.55 ? 'CONTROLLED' : spread < 2.45 ? 'MODERATE' : 'HIGH';
  const recommendation = scenario.decisions[bestIndex];

  const rationales = scenario.fields
    .map((field) => ({ key:field.key, label:field.label, value:normalized[field.key], impact:Math.abs(scores[bestIndex]) / scenario.fields.length + Number(normalized[field.key]) * 0.01 }))
    .sort((a,b) => b.impact - a.impact)
    .slice(0,3)
    .map((item, index) => ({ rank:index + 1, label:item.label, value:item.value }));

  const copy = scenarioKey === 'undercut'
    ? recommendation === 'PIT NOW' ? 'Protect the undercut while warm-up and traffic remain inside the target window.' : recommendation === 'EXTEND' ? 'Preserve track position and exploit current tyre life before committing the stop.' : 'Mirror the rival to neutralize the highest-probability track-position loss.'
    : scenarioKey === 'safety'
      ? recommendation === 'PIT UNDER SC' ? 'Use the discounted pit loss to reset tyre state before the compressed restart.' : recommendation === 'STAY OUT' ? 'Retain track position because the tyre advantage does not offset the positions surrendered.' : 'Split the cars to protect both track position and fresh-tyre upside.'
      : recommendation === 'STAY SLICK' ? 'Maintain slicks while the crossover forecast remains beyond the current grip window.' : recommendation === 'INTERMEDIATE' ? 'Move to intermediates at the modeled crossover before slick temperature collapses.' : 'Commit to full wets because rainfall intensity and confidence exceed the intermediate operating window.';

  return {
    scenario:scenarioKey,
    recommendation,
    decisionIndex:bestIndex,
    confidence,
    mean:round(mean,2),
    p10:round(p10,2),
    p90:round(p90,2),
    risk,
    outcomes,
    scores:scores.map((v) => round(v,3)),
    rationale:rationales,
    copy,
    seed
  };
}

export function createStore(initialState) {
  let state = structuredClone(initialState);
  const listeners = new Set();
  return {
    getState:() => state,
    setState(patch, reason='update') {
      const nextPatch = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...nextPatch };
      listeners.forEach((listener) => listener(state, reason));
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

export function encodeState(state) {
  const shareable = {
    chapter:state.chapter,
    frame:state.frame,
    scenario:state.scenario,
    scenarioValues:state.scenarioValues,
    view:state.view,
    camera:state.camera,
    selectedComponent:state.selectedComponent,
    networkMode:state.networkMode
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(shareable))));
}

export function decodeState(value) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(value))));
  } catch {
    return null;
  }
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  return `${String(minutes).padStart(2,'0')}:${remaining.toFixed(3).padStart(6,'0')}`;
}

export function sessionId(seed = Date.now()) {
  return `RI20X-${Math.abs(seed % 65535).toString(16).toUpperCase().padStart(4,'0')}`;
}
