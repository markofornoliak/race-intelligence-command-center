import {
  COMPONENTS,
  SCENARIOS,
  computeStrategy,
  decodeShareState,
  defaultScenarioInputs,
  encodeShareState,
  generateTelemetry,
  round
} from './core.mjs';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const telemetry = generateTelemetry();

function createStore(initialState) {
  let state = structuredClone(initialState);
  const listeners = new Set();
  return {
    get: () => state,
    set(patch, source = 'app') {
      const nextPatch = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...nextPatch };
      listeners.forEach((listener) => listener(state, source));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const shareState = decodeShareState(location.hash);
const initialScenario = shareState?.scenario && SCENARIOS[shareState.scenario] ? shareState.scenario : 'undercut';
const store = createStore({
  chapter: shareState?.chapter || 'command',
  mode: shareState?.mode || 'explore',
  componentId: 'floor',
  view: 'studio',
  camera: 'hero',
  explode: 0,
  timeline: 39,
  compare: false,
  scenario: initialScenario,
  strategyInputs: shareState?.inputs || defaultScenarioInputs(initialScenario),
  committed: false,
  networkNode: 'factory',
  networkMode: 'normal',
  sound: false,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  quality: 'auto'
});

const boot = $('[data-boot]');
const bootProgress = $('[data-boot-progress]');
const bootModel = $('[data-boot-model]');
const bootGraphics = $('[data-boot-graphics]');
let bootStage = 1;
function updateBoot(stage, label) {
  bootStage = Math.max(bootStage, stage);
  if (bootProgress) bootProgress.style.width = `${Math.min(100, bootStage * 33.333)}%`;
  if (label && bootGraphics) bootGraphics.textContent = label;
  if (bootStage >= 3) requestAnimationFrame(() => boot?.classList.add('is-complete'));
}
updateBoot(2, 'READY');
window.addEventListener('ri10x:scene-ready', () => {
  if (bootModel) bootModel.textContent = 'READY';
  $('[data-scene-status]').textContent = 'LIVE / 60 FPS TARGET';
  updateBoot(3, 'WEBGL');
}, { once: true });
window.addEventListener('ri10x:scene-fallback', () => {
  if (bootModel) bootModel.textContent = 'LIGHTWEIGHT';
  $('[data-scene-status]').textContent = 'LIGHTWEIGHT MODE';
  updateBoot(3, 'FALLBACK');
}, { once: true });
window.setTimeout(() => {
  const sceneStatus = $('[data-scene-status]');
  if (sceneStatus?.textContent === 'INITIALIZING') {
    const fallback = $('[data-scene-fallback]');
    const canvas = $('#carScene');
    if (fallback) fallback.hidden = false;
    if (canvas) canvas.hidden = true;
    if (bootModel) bootModel.textContent = 'LIGHTWEIGHT';
    sceneStatus.textContent = 'LIGHTWEIGHT MODE';
  }
  updateBoot(3, 'READY');
}, 2400);

function dispatchScene(type, detail = {}) {
  window.dispatchEvent(new CustomEvent(`ri10x:${type}`, { detail }));
}

function selectComponent(componentId, source = 'ui') {
  const component = COMPONENTS.find((item) => item.id === componentId) || COMPONENTS[0];
  store.set({ componentId: component.id }, source);
  dispatchScene('select-component', { componentId: component.id, source });
}

function renderComponentInspector(state) {
  const component = COMPONENTS.find((item) => item.id === state.componentId) || COMPONENTS[0];
  const index = COMPONENTS.indexOf(component) + 1;
  $('[data-component-index]').textContent = `${String(index).padStart(2, '0')} / ${String(COMPONENTS.length).padStart(2, '0')}`;
  $('[data-component-name]').textContent = component.name;
  $('[data-component-fact]').textContent = component.fact;
  $('[data-component-system]').textContent = component.system.toUpperCase();
  $('[data-component-health]').textContent = `${component.health}%`;
  $('[data-component-channels]').textContent = String(component.channels);
  $$('[data-component-id]').forEach((button) => button.classList.toggle('is-active', button.dataset.componentId === component.id));
}

function buildComponentControls() {
  const list = $('[data-component-list]');
  const matrix = $('[data-system-matrix]');
  COMPONENTS.forEach((component, index) => {
    const listButton = document.createElement('button');
    listButton.type = 'button';
    listButton.dataset.componentId = component.id;
    listButton.innerHTML = `<span>${component.name}</span><b>${String(index + 1).padStart(2, '0')}</b>`;
    listButton.addEventListener('click', () => selectComponent(component.id));
    list.append(listButton);

    const matrixButton = document.createElement('button');
    matrixButton.type = 'button';
    matrixButton.dataset.componentId = component.id;
    matrixButton.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><b>${component.name}</b><small>${component.system} / ${component.channels} channels</small>`;
    matrixButton.addEventListener('click', () => {
      selectComponent(component.id);
      location.hash = '#command';
    });
    matrix.append(matrixButton);
  });
}
buildComponentControls();

window.addEventListener('ri10x:component-selected', (event) => {
  if (event.detail?.componentId) store.set({ componentId: event.detail.componentId }, 'scene');
});

$$('[data-view]').forEach((button) => button.addEventListener('click', () => {
  store.set({ view: button.dataset.view });
  dispatchScene('set-view', { view: button.dataset.view });
}));
$$('[data-camera]').forEach((button) => button.addEventListener('click', () => {
  store.set({ camera: button.dataset.camera });
  dispatchScene('set-camera', { camera: button.dataset.camera });
}));
$('[data-explode]').addEventListener('input', (event) => {
  const explode = Number(event.target.value);
  store.set({ explode });
  dispatchScene('set-explode', { explode });
});

const scenarioInputsNode = $('[data-strategy-inputs]');
function renderScenarioInputs(state) {
  const scenario = SCENARIOS[state.scenario];
  $('[data-scenario-title]').textContent = scenario.label;
  $('[data-scenario-description]').textContent = scenario.description;
  scenarioInputsNode.replaceChildren();
  scenario.inputs.forEach((definition) => {
    const value = state.strategyInputs[definition.key] ?? definition.value;
    const row = document.createElement('div');
    row.className = 'strategy-input';
    row.innerHTML = `<label for="strategy-${definition.key}"><span>${definition.label}</span><b data-input-value>${value}${definition.unit ? ` ${definition.unit}` : ''}</b></label><input id="strategy-${definition.key}" type="range" min="${definition.min}" max="${definition.max}" step="${definition.step}" value="${value}" />`;
    const input = $('input', row);
    const output = $('[data-input-value]', row);
    input.addEventListener('input', () => {
      const nextValue = Number(input.value);
      output.textContent = `${nextValue}${definition.unit ? ` ${definition.unit}` : ''}`;
      store.set((current) => ({
        strategyInputs: { ...current.strategyInputs, [definition.key]: nextValue },
        committed: false
      }));
    });
    scenarioInputsNode.append(row);
  });
}

function formatImpact(value) {
  const sign = value < 0 ? '−' : value > 0 ? '+' : '';
  return `${sign}${Math.abs(value).toFixed(2)} S`;
}

function renderStrategy(state) {
  const result = computeStrategy(state.scenario, state.strategyInputs);
  $('[data-recommendation]').textContent = result.recommendation;
  $('[data-confidence]').textContent = String(result.confidence);
  $('[data-confidence-ring]').style.setProperty('--confidence', result.confidence);
  $('[data-time-impact]').textContent = formatImpact(result.timeImpact);
  $('[data-risk]').textContent = result.risk;
  $('[data-outcome-status]').textContent = state.committed ? 'COMMITTED / REPLAY' : 'PREVIEW';
  const rationale = $('[data-rationale]');
  rationale.innerHTML = result.rationale.map((item) => `<li>${item}</li>`).join('');
  $('[data-action-sequence]').innerHTML = result.actionSequence.map((step, index) => `<span><b>${String(index + 1).padStart(2, '0')}</b>${step}</span>`).join('');
  $('[data-ranked-options]').innerHTML = result.ranked.map((option, index) => `<span><small>${String(index + 1).padStart(2, '0')} / ${option.label}</small><b>${option.score.toFixed(1)} SCORE · ${formatImpact(option.impact)}</b></span>`).join('');
  drawOutcomeChart(result, state.committed);
}

$$('[data-scenario]').forEach((button) => button.addEventListener('click', () => {
  const scenario = button.dataset.scenario;
  store.set({ scenario, strategyInputs: defaultScenarioInputs(scenario), committed: false });
  renderScenarioInputs(store.get());
}));
$('[data-commit-decision]').addEventListener('click', () => {
  store.set({ committed: true });
  $('[data-outcome-status]').scrollIntoView({ behavior: store.get().reducedMotion ? 'auto' : 'smooth', block: 'center' });
});

const chart = $('[data-telemetry-chart]');
const chartContext = chart.getContext('2d');
const outcomeCanvas = $('[data-outcome-chart]');
const outcomeContext = outcomeCanvas.getContext('2d');
function fitCanvas(canvas, context) {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width * ratio));
  const height = Math.max(160, Math.floor(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width: rect.width, height: rect.height };
}
function drawLine(context, points, color, width = 1.5) {
  context.beginPath();
  points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
}
function drawTelemetryChart(state) {
  const { width, height } = fitCanvas(chart, chartContext);
  const ctx = chartContext;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,.025)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(181,207,228,.1)';
  ctx.lineWidth = 1;
  for (let row = 1; row < 5; row += 1) {
    const y = (height / 5) * row;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  const start = Math.max(0, state.timeline - 29);
  const windowData = telemetry.slice(start, start + 30);
  const speedPoints = windowData.map((item, index) => [index / 29 * width, height - ((item.speed - 220) / 110) * height * .78 - 20]);
  const deltaPoints = windowData.map((item, index) => [index / 29 * width, height - (item.delta / 1.2) * height * .72 - 18]);
  drawLine(ctx, speedPoints, '#64d9ff', 1.8);
  drawLine(ctx, deltaPoints, '#ff4a55', 1.4);
  if (state.compare) {
    const compareData = telemetry.slice(Math.max(0, start - 18), Math.max(0, start - 18) + 30);
    const comparePoints = compareData.map((item, index) => [index / 29 * width, height - ((item.speed - 220) / 110) * height * .78 - 20]);
    ctx.setLineDash([5, 6]);
    drawLine(ctx, comparePoints, 'rgba(225,236,242,.42)', 1);
    ctx.setLineDash([]);
  }
  const cursorX = ((state.timeline - start) / 29) * width;
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.moveTo(cursorX, 0); ctx.lineTo(cursorX, height); ctx.stroke();
  ctx.fillStyle = '#dfeaf0';
  ctx.font = '10px monospace';
  ctx.fillText('SPEED', 10, 18);
  ctx.fillStyle = '#ff5963';
  ctx.fillText('LAP DELTA', 66, 18);
}
function drawOutcomeChart(result, committed) {
  const { width, height } = fitCanvas(outcomeCanvas, outcomeContext);
  const ctx = outcomeContext;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,.02)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(181,207,228,.1)';
  for (let row = 1; row < 4; row += 1) {
    const y = row / 4 * height;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  result.ranked.forEach((option, optionIndex) => {
    const points = Array.from({ length: 12 }, (_, index) => {
      const trajectory = option.impact * (index / 11) + optionIndex * .22 + Math.sin(index * .72 + optionIndex) * .06;
      return [index / 11 * width, height * .5 + trajectory * height * .16];
    });
    const colors = ['#64d9ff', '#dce9f1', '#ff5863'];
    ctx.globalAlpha = committed || optionIndex === 0 ? 1 : .45;
    drawLine(ctx, points, colors[optionIndex], optionIndex === 0 ? 2 : 1);
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#6d7d89';
  ctx.font = '9px monospace';
  ctx.fillText('NOW', 8, height - 9);
  ctx.fillText('+ 6 LAPS', Math.max(10, width - 70), height - 9);
}

const eventDefinitions = [
  ['AERO BALANCE', 'Front balance moved inside target window.', 'floor'],
  ['ENERGY RELEASE', 'Deployment profile adjusted for the next straight.', 'power-unit'],
  ['TYRE MODEL', 'Rear-left surface temperature approaching upper band.', 'brakes'],
  ['TRAFFIC GAP', 'Pit exit gap increased by 0.8 seconds.', 'telemetry'],
  ['FORECAST CELL', 'Light rain probability rising at sector three.', 'sidepods'],
  ['NETWORK', 'Factory simulation synchronized to current setup state.', 'telemetry']
];
function renderRaceState(state) {
  const current = telemetry[state.timeline];
  $('[data-replay-time]').textContent = `${String(Math.floor(current.time / 60)).padStart(2, '0')}:${String(current.time % 60).padStart(2, '0')}`;
  $('[data-lap-readout]').textContent = `LAP ${current.lap} / S${current.sector}`;
  $('[data-hero-confidence]').textContent = `${current.confidence}%`;
  $('[data-footer-lap]').textContent = `${current.lap} / 57`;
  $('[data-footer-tyre]').textContent = `${round((current.tyreFL + current.tyreFR + current.tyreRL + current.tyreRR) / 4, 1)}°C`;
  $('[data-footer-energy]').textContent = `${current.energy}%`;
  $('[data-footer-latency]').textContent = `${current.latency} MS`;
  $('[data-footer-confidence]').textContent = `${current.confidence}%`;
  $$('[data-metric]').forEach((node) => {
    const key = node.dataset.metric;
    const suffix = key === 'trackTemp' || key === 'brakeTemp' ? '°' : key === 'rainfall' ? ' MM/H' : '';
    node.textContent = `${current[key]}${suffix}`;
  });
  $$('[data-tyre]').forEach((node) => node.textContent = `${current[node.dataset.tyre]}°`);
  const angle = ((state.timeline / (telemetry.length - 1)) * Math.PI * 2) - Math.PI / 2;
  const cx = 270 + Math.cos(angle) * 160;
  const cy = 190 + Math.sin(angle) * 115;
  $('[data-car-marker]').setAttribute('cx', cx.toFixed(1));
  $('[data-car-marker]').setAttribute('cy', cy.toFixed(1));
  const stream = $('[data-event-stream]');
  const start = Math.max(0, state.timeline - 2);
  stream.innerHTML = eventDefinitions.slice(start % 4, (start % 4) + 3).map((event, index) => `<li data-event-component="${event[2]}"><span>${String(current.time - index * 5).padStart(3, '0')} S</span><b>${event[0]}</b><small>${event[1]}</small></li>`).join('');
  $$('[data-event-component]').forEach((item) => item.addEventListener('click', () => selectComponent(item.dataset.eventComponent)));
  drawTelemetryChart(state);
  dispatchScene('telemetry', current);
}
$('[data-timeline]').addEventListener('input', (event) => store.set({ timeline: Number(event.target.value) }));
$('[data-compare]').addEventListener('click', (event) => {
  const compare = !store.get().compare;
  event.currentTarget.setAttribute('aria-pressed', String(compare));
  store.set({ compare });
});

const networkNodes = [
  { id: 'car', index: 1, name: 'Car', x: 13, y: 55, apps: 1, signals: 64, latency: 0.4, description: 'The originating sensor and control system for the live race state.' },
  { id: 'garage', index: 2, name: 'Garage', x: 32, y: 34, apps: 4, signals: 42, latency: 2.1, description: 'Trackside engineering receives telemetry, controls setup actions and executes operational decisions.' },
  { id: 'pitwall', index: 3, name: 'Pit wall', x: 34, y: 72, apps: 5, signals: 35, latency: 2.5, description: 'Strategy, sporting and race engineering coordinate the decision under time pressure.' },
  { id: 'state', index: 4, name: 'Governed race state', x: 52, y: 52, apps: 7, signals: 76, latency: 4.2, description: 'The synchronized operational truth used by every connected role and application.' },
  { id: 'factory', index: 5, name: 'Factory simulation', x: 72, y: 26, apps: 3, signals: 18, latency: 11.4, description: 'Runs high-value simulation workloads against the same governed race state used at the circuit.' },
  { id: 'strategy', index: 6, name: 'Strategy group', x: 74, y: 54, apps: 4, signals: 22, latency: 10.8, description: 'Combines race models, competitor state and scenario logic into a clear recommendation.' },
  { id: 'specialist', index: 7, name: 'Specialist workstation', x: 76, y: 80, apps: 6, signals: 16, latency: 12.6, description: 'Remote experts inspect high-fidelity applications without moving governed datasets.' },
  { id: 'environment', index: 8, name: 'Application environment', x: 92, y: 53, apps: 11, signals: 88, latency: 9.9, description: 'Centralized applications, graphics and data services delivered through the secure experience layer.' }
];
const networkEdges = [['car','garage'],['car','pitwall'],['garage','state'],['pitwall','state'],['state','factory'],['state','strategy'],['state','specialist'],['factory','environment'],['strategy','environment'],['specialist','environment']];
function buildNetwork() {
  const map = $('[data-network-map]');
  const byId = Object.fromEntries(networkNodes.map((node) => [node.id, node]));
  networkEdges.forEach(([fromId, toId], index) => {
    const from = byId[fromId]; const to = byId[toId];
    const dx = to.x - from.x; const dy = to.y - from.y;
    const edge = document.createElement('i');
    edge.className = 'network-edge';
    edge.style.left = `${from.x}%`; edge.style.top = `${from.y}%`;
    edge.style.width = `${Math.hypot(dx, dy)}%`;
    edge.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    edge.style.animationDelay = `${index * -.21}s`;
    map.append(edge);
  });
  networkNodes.forEach((node) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'network-node'; button.dataset.networkNode = node.id;
    button.style.left = `${node.x}%`; button.style.top = `${node.y}%`;
    button.innerHTML = `<span>${String(node.index).padStart(2,'0')} / ${node.latency} MS</span><b>${node.name}</b>`;
    button.addEventListener('click', () => store.set({ networkNode: node.id }));
    map.append(button);
  });
}
buildNetwork();
function renderNetwork(state) {
  const node = networkNodes.find((item) => item.id === state.networkNode) || networkNodes[0];
  $('[data-node-index]').textContent = `${String(node.index).padStart(2,'0')} / ${String(networkNodes.length).padStart(2,'0')}`;
  $('[data-node-name]').textContent = node.name;
  $('[data-node-description]').textContent = node.description;
  $('[data-node-apps]').textContent = node.apps;
  $('[data-node-signals]').textContent = node.signals;
  $('[data-node-state]').textContent = state.networkMode === 'normal' ? 'SYNCED' : 'ADAPTIVE';
  $('[data-network-latency]').textContent = `${state.networkMode === 'normal' ? node.latency : round(node.latency * 3.8, 1)} MS`;
  $$('[data-network-node]').forEach((button) => button.classList.toggle('is-active', button.dataset.networkNode === node.id));
}

$$('[data-network-mode]').forEach((button) => button.addEventListener('click', () => store.set({ networkMode: button.dataset.networkMode })));
function renderSecure(state) {
  const degraded = state.networkMode === 'degraded';
  $('[data-transport-state]').textContent = degraded ? 'ADAPTIVE / DEGRADED' : 'OPTIMAL';
  $('[data-secure-latency]').textContent = degraded ? '43.8 MS' : '11.4 MS';
  $('[data-packet-loss]').textContent = degraded ? '1.8%' : '0.1%';
  $('[data-experience-state]').textContent = degraded ? 'ADAPTIVE QUALITY' : 'HIGH FIDELITY';
  $$('[data-network-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.networkMode === state.networkMode));
}

const chapterSections = $$('[data-chapter]');
const chapterOrder = chapterSections.map((section) => section.dataset.chapter);
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) store.set({ chapter: visible.target.dataset.chapter }, 'scroll');
}, { threshold: [0.25, 0.5, 0.72], rootMargin: '-12% 0px -35% 0px' });
chapterSections.forEach((section) => observer.observe(section));

function renderNavigation(state, source) {
  $$('[data-chapter-link]').forEach((link) => link.classList.toggle('is-active', link.dataset.chapterLink === state.chapter));
  const index = chapterOrder.indexOf(state.chapter);
  $('[data-progress-bar]').style.width = `${((index + 1) / chapterOrder.length) * 100}%`;
  if (source === 'scroll' && state.chapter && location.hash !== `#${state.chapter}`) {
    history.replaceState(null, '', `#${state.chapter}`);
  }
  if (source === 'hash' && state.chapter) {
    const target = document.getElementById(state.chapter);
    target?.scrollIntoView({ behavior: state.reducedMotion ? 'auto' : 'smooth' });
  }
}

$$('[data-mode-switch]').forEach((button) => button.addEventListener('click', () => {
  const mode = button.dataset.modeSwitch;
  store.set({ mode }, 'mode');
  if (mode === 'strategy') location.hash = '#strategy';
  if (mode === 'guided') location.hash = '#command';
}));
$('[data-start-briefing]').addEventListener('click', () => {
  store.set({ mode: 'guided', chapter: 'command' }, 'guided');
  const sequence = ['command','twin','race-state','strategy','network','secure','evidence','final'];
  let index = 0;
  const advance = () => {
    if (store.get().mode !== 'guided' || index >= sequence.length) return;
    document.getElementById(sequence[index])?.scrollIntoView({ behavior: store.get().reducedMotion ? 'auto' : 'smooth' });
    index += 1;
    if (index < sequence.length) window.setTimeout(advance, store.get().reducedMotion ? 250 : 2200);
  };
  advance();
});

const menuButton = $('[data-menu-toggle]');
const mobileNav = $('[data-mobile-nav]');
menuButton.addEventListener('click', () => {
  const open = !mobileNav.classList.contains('is-open');
  mobileNav.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
$$('a', mobileNav).forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false');
}));

$('[data-sound]').addEventListener('click', () => store.set((state) => ({ sound: !state.sound })));
$('[data-motion]').addEventListener('click', () => store.set((state) => ({ reducedMotion: !state.reducedMotion })));
$('[data-quality]').addEventListener('click', () => {
  const order = ['auto','high','balanced','lightweight'];
  const next = order[(order.indexOf(store.get().quality) + 1) % order.length];
  store.set({ quality: next });
  dispatchScene('set-quality', { quality: next });
});
const helpDialog = $('[data-help-dialog]');
$('[data-help]').addEventListener('click', () => helpDialog.showModal());
$('[data-help-close]').addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('click', (event) => { if (event.target === helpDialog) helpDialog.close(); });
$('[data-reset-session]').addEventListener('click', () => {
  localStorage.removeItem('ri10x-session');
  location.hash = '#command';
  location.reload();
});

window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#%7B')) return;
  const chapter = location.hash.slice(1);
  if (chapterOrder.includes(chapter)) store.set({ chapter }, 'hash');
});

let persistFrame = 0;
store.subscribe((state, source) => {
  renderComponentInspector(state);
  renderRaceState(state);
  renderStrategy(state);
  renderNetwork(state);
  renderSecure(state);
  renderNavigation(state, source);
  $$('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === state.view));
  $$('[data-camera]').forEach((button) => button.classList.toggle('is-active', button.dataset.camera === state.camera));
  $$('[data-scenario]').forEach((button) => button.classList.toggle('is-active', button.dataset.scenario === state.scenario));
  $$('[data-mode-switch]').forEach((button) => button.classList.toggle('is-active', button.dataset.modeSwitch === state.mode));
  $('[data-explode-value]').textContent = `${state.explode}%`;
  $('[data-sound]').setAttribute('aria-pressed', String(state.sound));
  $('[data-sound] b').textContent = state.sound ? 'ON' : 'MUTED';
  $('[data-motion]').setAttribute('aria-pressed', String(state.reducedMotion));
  $('[data-motion] b').textContent = state.reducedMotion ? 'REDUCED' : 'FULL';
  document.body.classList.toggle('motion-reduced', state.reducedMotion);
  $('[data-quality] b').textContent = state.quality.toUpperCase();
  cancelAnimationFrame(persistFrame);
  persistFrame = requestAnimationFrame(() => {
    localStorage.setItem('ri10x-session', JSON.stringify({
      mode: state.mode,
      componentId: state.componentId,
      view: state.view,
      camera: state.camera,
      scenario: state.scenario,
      strategyInputs: state.strategyInputs,
      quality: state.quality
    }));
  });
});

const saved = (() => { try { return JSON.parse(localStorage.getItem('ri10x-session')); } catch { return null; } })();
if (saved && !shareState) store.set(saved, 'restore');
renderScenarioInputs(store.get());
renderComponentInspector(store.get());
renderRaceState(store.get());
renderStrategy(store.get());
renderNetwork(store.get());
renderSecure(store.get());
renderNavigation(store.get(), 'initial');

window.addEventListener('resize', () => {
  drawTelemetryChart(store.get());
  renderStrategy(store.get());
});

window.addEventListener('keydown', (event) => {
  if (event.target.matches('input,button,a,dialog *')) return;
  const index = chapterOrder.indexOf(store.get().chapter);
  if (event.key === 'PageDown') {
    event.preventDefault();
    document.getElementById(chapterOrder[Math.min(index + 1, chapterOrder.length - 1)])?.scrollIntoView({ behavior: store.get().reducedMotion ? 'auto' : 'smooth' });
  }
  if (event.key === 'PageUp') {
    event.preventDefault();
    document.getElementById(chapterOrder[Math.max(index - 1, 0)])?.scrollIntoView({ behavior: store.get().reducedMotion ? 'auto' : 'smooth' });
  }
  if (event.key.toLowerCase() === 'h') helpDialog.showModal();
});

window.RI10X = {
  getState: store.get,
  share: () => `${location.origin}${location.pathname}${encodeShareState(store.get())}`,
  setScenario: (scenario) => SCENARIOS[scenario] && store.set({ scenario, strategyInputs: defaultScenarioInputs(scenario) })
};
