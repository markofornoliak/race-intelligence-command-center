import {
  CHAPTERS, COMPONENTS, NETWORK_NODES, PIT_STEPS, SCENARIOS,
  buildTelemetry, createStore, decodeState, encodeState, formatTime,
  runStrategy, sessionId
} from './core.mjs';
import {
  createNetworkSvg, drawCircuit, drawDistribution, drawTelemetry, observeCanvases
} from './visuals.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const data = buildTelemetry(180, 20260805);
const shared = new URLSearchParams(location.search).get('state');
const restored = shared ? decodeState(shared) : null;
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saved = (() => { try { return JSON.parse(sessionStorage.getItem('ri20x-state') || 'null'); } catch { return null; } })();
const initialScenario = restored?.scenario || saved?.scenario || 'undercut';

const initialState = {
  chapter: restored?.chapter || location.hash.replace('#','') || 'command',
  experience: saved?.experience || 'explore',
  frame: Number(restored?.frame ?? saved?.frame ?? 0),
  playing: false,
  replaySpeed: 1,
  compare: false,
  view: restored?.view || saved?.view || 'studio',
  camera: restored?.camera || saved?.camera || 'hero',
  explode: 0,
  selectedComponent: restored?.selectedComponent || saved?.selectedComponent || 'monocoque',
  isolated: false,
  scenario: initialScenario,
  scenarioValues: restored?.scenarioValues || saved?.scenarioValues || { ...SCENARIOS[initialScenario].defaults },
  strategyResult: runStrategy(initialScenario, restored?.scenarioValues || saved?.scenarioValues || SCENARIOS[initialScenario].defaults),
  committedDecisions: saved?.committedDecisions || [],
  networkNode: 'pit-wall',
  networkMode: restored?.networkMode || saved?.networkMode || 'normal',
  quality: saved?.quality || 'auto',
  sound: false,
  pitTime: 0,
  pitPlaying: false,
  pitSpeed: 1,
  sessionId: saved?.sessionId || sessionId(20260805),
  sceneReady: false,
  fps: 60
};

const store = createStore(initialState);
window.RI20X = { store, data, COMPONENTS };
let replayRaf = 0;
let replayLast = performance.now();
let pitRaf = 0;
let pitLast = performance.now();
let briefingTimer = 0;
let audioContext = null;

function announce(message) {
  const toast = $('[data-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function sound(frequency=520, duration=.045) {
  if (!store.getState().sound) return;
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine'; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.025, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
}

function persist(state) {
  const safe = {
    experience:state.experience, frame:state.frame, view:state.view, camera:state.camera,
    selectedComponent:state.selectedComponent, scenario:state.scenario,
    scenarioValues:state.scenarioValues, committedDecisions:state.committedDecisions,
    networkMode:state.networkMode, quality:state.quality, sessionId:state.sessionId
  };
  try { sessionStorage.setItem('ri20x-state', JSON.stringify(safe)); } catch {}
}

function setState(patch, reason) { return store.setState(patch, reason); }

function componentById(id) { return COMPONENTS.find((component) => component.id === id) || COMPONENTS[4]; }

function buildStaticUi() {
  const componentList = $('[data-component-list]');
  if (componentList) componentList.innerHTML = COMPONENTS.map((component,index) => `
    <button type="button" data-component="${component.id}">
      <span>${String(index+1).padStart(2,'0')}</span><strong>${component.name}</strong><small>${component.type}</small>
    </button>`).join('');

  const scenarioList = $('[data-scenario-list]');
  if (scenarioList) scenarioList.innerHTML = Object.entries(SCENARIOS).map(([key,scenario],index) => `
    <button type="button" data-scenario="${key}">
      <span>${String(index+1).padStart(2,'0')}</span><strong>${scenario.title}</strong><small>${scenario.subtitle}</small>
    </button>`).join('');

  const networkNodes = $('[data-network-nodes]');
  if (networkNodes) networkNodes.innerHTML = NETWORK_NODES.map((node) => `
    <button type="button" class="network-node" data-network-node="${node.id}" style="--x:${node.x}%;--y:${node.y}%">
      <i></i><span>${node.label}</span><small>${node.latency} MS</small>
    </button>`).join('');

  const pitSteps = $('[data-pit-steps]');
  if (pitSteps) pitSteps.innerHTML = PIT_STEPS.map((step,index) => `
    <li data-pit-step="${index}"><span>${step.t.toFixed(2)}</span><strong>${step.label}</strong><small>${step.owner}</small></li>`).join('');

  const pitCrew = $('[data-pit-crew]');
  if (pitCrew) pitCrew.innerHTML = Array.from({length:16},(_,index)=>`<i style="--i:${index}"></i>`).join('');
}

function renderScenarioForm(state) {
  const scenario = SCENARIOS[state.scenario];
  const form = $('[data-strategy-form]');
  if (!form) return;
  form.innerHTML = scenario.fields.map((field) => {
    const value = state.scenarioValues[field.key] ?? scenario.defaults[field.key];
    return `<label class="strategy-field">
      <span>${field.label}<small>${field.min}–${field.max} ${field.unit}</small></span>
      <div><input type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${value}" data-strategy-input="${field.key}" /><output data-strategy-output="${field.key}">${value} ${field.unit}</output></div>
    </label>`;
  }).join('');
  $$('[data-strategy-input]',form).forEach((input) => input.addEventListener('input', () => {
    const field = scenario.fields.find((item) => item.key === input.dataset.strategyInput);
    const value = Number(input.value);
    $(`[data-strategy-output="${field.key}"]`, form).textContent = `${value} ${field.unit}`;
    setState({ scenarioValues:{ ...store.getState().scenarioValues, [field.key]:value } }, 'strategy-input');
  }));
}

function renderTyres(frame) {
  const matrix = $('[data-tyre-matrix]');
  if (!matrix) return;
  const labels = ['FL','FR','RL','RR'];
  matrix.innerHTML = labels.map((label,wheel) => {
    const zones = frame.tyreZones.slice(wheel*3,wheel*3+3);
    return `<div class="tyre-card"><header><strong>${label}</strong><span>${frame.pressure[wheel]} PSI</span></header><div class="tyre-zones">${zones.map((temperature,index)=>`<i style="--heat:${Math.max(0,Math.min(1,(temperature-80)/25))}" title="${temperature}°C"><b>${temperature}</b><small>${['IN','MID','OUT'][index]}</small></i>`).join('')}</div></div>`;
  }).join('');
}

function renderEvents(frame) {
  const stream = $('[data-event-stream]');
  if (!stream) return;
  const visible = data.events.filter((event) => event.frame <= frame.index).slice(-6).reverse();
  stream.innerHTML = visible.map((event) => `<li data-event-frame="${event.frame}"><span>${formatTime(data.frames[event.frame].time)}</span><i class="is-${event.type.toLowerCase()}">${event.type}</i><strong>${event.label}</strong></li>`).join('') || '<li class="is-empty">Awaiting first synchronized event…</li>';
  $$('[data-event-frame]',stream).forEach((item) => item.addEventListener('click', () => setState({ frame:Number(item.dataset.eventFrame) }, 'event-jump')));
}

function renderStrategy(state) {
  const scenario = SCENARIOS[state.scenario];
  const result = state.strategyResult;
  $('[data-scenario-title]').textContent = scenario.title;
  $$('[data-scenario]').forEach((button) => button.classList.toggle('is-active', button.dataset.scenario === state.scenario));
  $('[data-recommendation]').textContent = result.recommendation;
  $('[data-recommendation-copy]').textContent = result.copy;
  $('[data-strategy-confidence]').textContent = `${result.confidence}%`;
  $('[data-strategy-delta]').textContent = `${result.mean > 0 ? '+' : '−'}${Math.abs(result.mean).toFixed(2)} s`;
  $('[data-strategy-risk]').textContent = result.risk;
  $('[data-sim-count]').textContent = `${result.outcomes.length.toLocaleString()} RUNS`;
  const rationale = $('[data-rationale]');
  if (rationale) rationale.innerHTML = `<header><span>RATIONALE TREE</span><strong>TOP DRIVERS</strong></header>${result.rationale.map((item) => `<div><span>0${item.rank}</span><strong>${item.label}</strong><small>${item.value}</small></div>`).join('')}`;
  drawDistribution($('[data-strategy-chart]'), result.outcomes, result.mean, result.p10, result.p90);
}

function renderNetwork(state) {
  const node = NETWORK_NODES.find((item) => item.id === state.networkNode) || NETWORK_NODES[2];
  $('[data-network-title]').textContent = node.label;
  $('[data-network-location]').textContent = node.location;
  $('[data-network-copy]').textContent = node.copy;
  const metrics = $('[data-network-metrics]');
  const latency = state.networkMode === 'degraded' ? Math.round(node.latency * 2.6 + 8) : node.latency;
  const quality = state.networkMode === 'degraded' ? Math.max(82.4,node.quality-8.7) : node.quality;
  if (metrics) metrics.innerHTML = `<div><dt>LATENCY</dt><dd>${latency} MS</dd></div><div><dt>SESSION QUALITY</dt><dd>${quality.toFixed(1)}%</dd></div><div><dt>ACTIVE APPS</dt><dd>${node.apps.length}</dd></div>`;
  const apps = $('[data-network-apps]');
  if (apps) apps.innerHTML = `<span>ACTIVE APPLICATIONS</span>${node.apps.map((app) => `<i>${app}</i>`).join('')}`;
  $$('[data-network-node]').forEach((button) => button.classList.toggle('is-active', button.dataset.networkNode === node.id));
  $$('[data-network-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.networkMode === state.networkMode));
  createNetworkSvg($('[data-network-lines]'), NETWORK_NODES, state.networkMode);
}

function renderPit(state) {
  const time = state.pitTime;
  $('[data-pit-clock]').textContent = time.toFixed(3);
  const currentIndex = Math.max(0, PIT_STEPS.findLastIndex((step) => step.t <= time));
  const current = PIT_STEPS[currentIndex];
  $('[data-pit-status]').textContent = current?.status || 'CAR APPROACHING BOX';
  $$('[data-pit-step]').forEach((step,index) => {
    step.classList.toggle('is-active', index === currentIndex);
    step.classList.toggle('is-complete', PIT_STEPS[index].t <= time);
  });
  const stage = $('.pit-stage');
  if (stage) stage.style.setProperty('--pit-progress', Math.min(1,time/2.18));
  $('[data-pit-play]').textContent = state.pitPlaying ? 'PAUSE PIT SEQUENCE' : time >= 2.18 ? 'RUN AGAIN' : 'RUN PIT SEQUENCE';
}

function renderFrame(state) {
  const frame = data.frames[Math.max(0,Math.min(data.frames.length-1,state.frame))];
  const set = (selector,value) => { const node=$(selector); if (node) node.textContent=value; };
  set('[data-strip-speed]',Math.round(frame.speed)); set('[data-strip-tyre]',frame.tyre.toFixed(0));
  set('[data-strip-brake]',frame.brake); set('[data-strip-ers]',frame.ers.toFixed(0));
  set('[data-strip-fuel]',`${frame.fuel>0?'+':'−'}${Math.abs(frame.fuel).toFixed(2)}`);
  set('[data-strip-balance]',`${frame.balance>0?'+':''}${frame.balance.toFixed(1)}`); set('[data-strip-latency]',frame.latency.toFixed(0));
  set('[data-kpi-latency]',`${frame.latency.toFixed(0)} ms`); set('[data-kpi-confidence]',`${frame.confidence.toFixed(1)}%`); set('[data-kpi-channels]',frame.channels.toLocaleString());
  set('[data-lap-label]',`LAP ${frame.lap} / 57`); set('[data-compound-label]',frame.compound); set('[data-replay-time]',formatTime(frame.time)); set('[data-sector-label]',`SECTOR ${frame.sector}`);
  const range=$('[data-replay-range]'); if(range && Number(range.value)!==state.frame) range.value=String(state.frame);
  const strip=$('[data-strip-progress]'); if(strip) strip.style.width=`${frame.progress*100}%`;
  renderTyres(frame); renderEvents(frame);
  drawTelemetry($('[data-telemetry-chart]'),data.frames,state.frame,state.compare);
  drawCircuit($('[data-circuit-canvas]'),data.circuit,frame.progress,frame.activeEvents);
  window.dispatchEvent(new CustomEvent('ri:state',{detail:{frame,view:state.view,camera:state.camera,explode:state.explode,selectedComponent:state.selectedComponent,isolated:state.isolated,quality:state.quality}}));
}

function renderInspector(state) {
  const component = componentById(state.selectedComponent);
  $('[data-inspector-name]').textContent = component.name.toUpperCase();
  $('[data-inspector-status]').textContent = `${component.health >= 99 ? 'NOMINAL' : 'WATCH'} · ${component.type.toUpperCase()}`;
  $('[data-inspector-health]').textContent = `${component.health.toFixed(1)}%`;
  $('[data-inspector-channels]').textContent = component.channels.toLocaleString();
  $('[data-inspector-copy]').textContent = component.copy;
  $('[data-inspector-health-bar]').style.width = `${component.health}%`;
  $('[data-inspector-channel-bar]').style.width = `${Math.min(100,component.channels/2.4)}%`;
  $('[data-scene-component]').textContent = `${component.name.toUpperCase()} / ${component.health >= 99 ? 'NOMINAL' : 'WATCH'}`;
  $$('[data-component]').forEach((button) => button.classList.toggle('is-active',button.dataset.component===component.id));
  $('[data-isolate-component]').textContent = state.isolated ? 'SHOW ALL' : 'ISOLATE';
}

function renderGlobal(state,reason) {
  persist(state);
  document.documentElement.dataset.quality=state.quality;
  document.body.dataset.chapter=state.chapter;
  $$('[data-chapter-link]').forEach((link)=>link.classList.toggle('is-active',link.dataset.chapterLink===state.chapter));
  $$('[data-experience]').forEach((button)=>button.classList.toggle('is-active',button.dataset.experience===state.experience));
  $$('[data-view]').forEach((button)=>button.classList.toggle('is-active',button.dataset.view===state.view));
  $$('[data-camera]').forEach((button)=>button.classList.toggle('is-active',button.dataset.camera===state.camera));
  $$('[data-replay-speed]').forEach((button)=>button.classList.toggle('is-active',Number(button.dataset.replaySpeed)===state.replaySpeed));
  $('[data-quality]').value=state.quality;
  $('[data-sound-toggle]').classList.toggle('is-active',state.sound); $('[data-sound-toggle]').setAttribute('aria-pressed',String(state.sound));
  $('[data-replay-icon]').textContent=state.playing?'Ⅱ':'▶';
  $('[data-compare-toggle]').classList.toggle('is-active',state.compare); $('[data-compare-toggle]').setAttribute('aria-pressed',String(state.compare));
  $('[data-twin-view]').textContent=state.view.toUpperCase(); $('[data-twin-camera]').textContent=state.camera.toUpperCase(); $('[data-twin-explode]').textContent=`${state.explode}%`;
  $('[data-scene-mode]').textContent=state.view.toUpperCase();
  $('[data-explode]').value=String(state.explode); $('[data-explode-output]').textContent=`${state.explode}%`;
  $('[data-health-value]').textContent=state.networkMode==='degraded'?'91.20%':'99.94%'; $('[data-health-indicator]').classList.toggle('is-warning',state.networkMode==='degraded');
  $('[data-fps-readout]').textContent=state.quality==='lightweight'?'LIGHTWEIGHT':`${Math.round(state.fps)} FPS`;
  $('[data-decision-count]').textContent=state.committedDecisions.length; $('[data-session-id]').textContent=state.sessionId;
  $('[data-final-state]').textContent=state.networkMode==='degraded'?'ADAPTIVE':'SYNCHRONIZED';
  const progress=$('[data-global-progress]'); if(progress) progress.style.height=`${((CHAPTERS.indexOf(state.chapter)+1)/CHAPTERS.length)*100}%`;
  renderFrame(state); renderInspector(state); renderStrategy(state); renderNetwork(state); renderPit(state);
  if(reason==='scenario-change') renderScenarioForm(state);
}

function replayLoop(now) {
  const state=store.getState();
  if(!state.playing){replayRaf=0;return;}
  const elapsed=now-replayLast; const interval=420/state.replaySpeed;
  if(elapsed>=interval){
    replayLast=now;
    const next=state.frame>=data.frames.length-1?0:state.frame+1;
    setState({frame:next},'replay-tick');
  }
  replayRaf=requestAnimationFrame(replayLoop);
}

function toggleReplay(force) {
  const playing=force ?? !store.getState().playing;
  setState({playing},'replay-toggle');
  replayLast=performance.now();
  if(playing&&!replayRaf) replayRaf=requestAnimationFrame(replayLoop);
}

function pitLoop(now) {
  const state=store.getState();
  if(!state.pitPlaying){pitRaf=0;return;}
  const delta=((now-pitLast)/1000)*state.pitSpeed; pitLast=now;
  const next=Math.min(2.18,state.pitTime+delta);
  setState({pitTime:next,pitPlaying:next<2.18},'pit-tick');
  if(next<2.18) pitRaf=requestAnimationFrame(pitLoop); else {sound(880,.12);announce('Pit stop complete: 2.18 seconds');}
}

function togglePit() {
  const state=store.getState();
  const restart=state.pitTime>=2.18;
  const pitPlaying=!state.pitPlaying;
  setState({pitTime:restart?0:state.pitTime,pitPlaying},'pit-toggle');
  pitLast=performance.now();
  if(pitPlaying&&!pitRaf) pitRaf=requestAnimationFrame(pitLoop);
}

function navigate(chapter,{scroll=true}={}) {
  if(!CHAPTERS.includes(chapter)) chapter='command';
  setState({chapter},'navigate');
  history.replaceState(null,'',`#${chapter}`);
  if(scroll) document.getElementById(chapter)?.scrollIntoView({behavior:prefersReduced?'auto':'smooth',block:'start'});
}

function runGuidedBriefing() {
  clearTimeout(briefingTimer);
  setState({experience:'briefing'},'briefing-start');
  let index=0;
  const advance=()=>{
    if(index>=CHAPTERS.length){setState({experience:'explore'},'briefing-end');announce('Guided briefing complete');return;}
    navigate(CHAPTERS[index]); index+=1; briefingTimer=setTimeout(advance,index===1?6500:5200);
  };
  advance(); announce('Guided briefing started. Any manual navigation stops autoplay.');
}

function stopBriefing() {
  clearTimeout(briefingTimer);
  if(store.getState().experience==='briefing') setState({experience:'explore'},'briefing-interrupt');
}

function initCommandPalette() {
  const dialog=$('[data-command-dialog]'); const input=$('[data-command-input]'); const results=$('[data-command-results]');
  if(!dialog||!input||!results) return;
  const commands=[
    ...CHAPTERS.map((chapter,index)=>({label:`Open ${chapter.replace('-',' ')}`,hint:String(index+1),run:()=>navigate(chapter)})),
    {label:'Run undercut strategy',hint:'SIM',run:()=>{setState({scenario:'undercut',scenarioValues:{...SCENARIOS.undercut.defaults},strategyResult:runStrategy('undercut',SCENARIOS.undercut.defaults),experience:'strategy'},'scenario-change');navigate('strategy');}},
    {label:'Run safety car strategy',hint:'SIM',run:()=>{setState({scenario:'safety',scenarioValues:{...SCENARIOS.safety.defaults},strategyResult:runStrategy('safety',SCENARIOS.safety.defaults),experience:'strategy'},'scenario-change');navigate('strategy');}},
    {label:'Run rain transition strategy',hint:'SIM',run:()=>{setState({scenario:'rain',scenarioValues:{...SCENARIOS.rain.defaults},strategyResult:runStrategy('rain',SCENARIOS.rain.defaults),experience:'strategy'},'scenario-change');navigate('strategy');}},
    {label:'Play telemetry replay',hint:'SPACE',run:()=>{navigate('race');toggleReplay(true);}},
    {label:'Run pit sequence',hint:'PIT',run:()=>{navigate('pit');togglePit();}},
    {label:'Explode digital twin',hint:'3D',run:()=>{setState({explode:100},'explode');navigate('twin');}},
    {label:'Reset digital twin',hint:'R',run:()=>setState({view:'studio',camera:'hero',explode:0,isolated:false},'scene-reset')},
    {label:'Toggle degraded network',hint:'NET',run:()=>{setState({networkMode:store.getState().networkMode==='normal'?'degraded':'normal'},'network-mode');navigate('operations');}}
  ];
  const paint=()=>{const query=input.value.trim().toLowerCase();const matches=commands.filter(c=>c.label.toLowerCase().includes(query)).slice(0,12);results.innerHTML=matches.map((command,index)=>`<button type="button" data-command-index="${commands.indexOf(command)}" class="${index===0?'is-active':''}"><span>${command.label}</span><kbd>${command.hint}</kbd></button>`).join('');$$('[data-command-index]',results).forEach(button=>button.addEventListener('click',()=>{commands[Number(button.dataset.commandIndex)].run();dialog.close();sound();}));};
  $('[data-command-open]').addEventListener('click',()=>{dialog.showModal();input.value='';paint();requestAnimationFrame(()=>input.focus());});
  input.addEventListener('input',paint);
  input.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();$('[data-command-index]',results)?.click();}});
  paint();
}

function bindUi() {
  $$('[data-chapter-link]').forEach((link)=>link.addEventListener('click',(event)=>{event.preventDefault();stopBriefing();navigate(link.dataset.chapterLink);sound();}));
  $$('[data-experience]').forEach((button)=>button.addEventListener('click',()=>{const mode=button.dataset.experience;mode==='briefing'?runGuidedBriefing():setState({experience:mode},'experience');if(mode==='strategy')navigate('strategy');sound();}));
  $$('[data-component]').forEach((button)=>button.addEventListener('click',()=>{setState({selectedComponent:button.dataset.component,isolated:false},'component');sound(620);}));
  $$('[data-view]').forEach((button)=>button.addEventListener('click',()=>{setState({view:button.dataset.view},'view');sound();}));
  $$('[data-camera]').forEach((button)=>button.addEventListener('click',()=>{setState({camera:button.dataset.camera},'camera');sound();}));
  $('[data-explode]').addEventListener('input',(event)=>setState({explode:Number(event.target.value)},'explode'));
  $('[data-scene-reset]').addEventListener('click',()=>setState({view:'studio',camera:'hero',explode:0,isolated:false},'scene-reset'));
  $('[data-isolate-component]').addEventListener('click',()=>setState({isolated:!store.getState().isolated},'isolate'));
  $('[data-focus-component]').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('ri:focus-component',{detail:{id:store.getState().selectedComponent}})));
  $('[data-replay-toggle]').addEventListener('click',()=>toggleReplay());
  $('[data-replay-range]').addEventListener('input',(event)=>{toggleReplay(false);setState({frame:Number(event.target.value)},'scrub');});
  $$('[data-replay-speed]').forEach((button)=>button.addEventListener('click',()=>setState({replaySpeed:Number(button.dataset.replaySpeed)},'replay-speed')));
  $('[data-compare-toggle]').addEventListener('click',()=>setState({compare:!store.getState().compare},'compare'));
  $$('[data-scenario]').forEach((button)=>button.addEventListener('click',()=>{const scenario=button.dataset.scenario;setState({scenario,scenarioValues:{...SCENARIOS[scenario].defaults},strategyResult:runStrategy(scenario,SCENARIOS[scenario].defaults)},'scenario-change');sound();}));
  $('[data-run-strategy]').addEventListener('click',()=>{const state=store.getState();setState({strategyResult:runStrategy(state.scenario,state.scenarioValues,1200)},'strategy-run');sound(760,.08);announce('1,200 deterministic outcomes resolved');});
  $('[data-reset-strategy]').addEventListener('click',()=>{const scenario=store.getState().scenario;setState({scenarioValues:{...SCENARIOS[scenario].defaults},strategyResult:runStrategy(scenario,SCENARIOS[scenario].defaults)},'scenario-change');});
  $('[data-commit-decision]').addEventListener('click',()=>{const state=store.getState();const decision={scenario:state.scenario,recommendation:state.strategyResult.recommendation,confidence:state.strategyResult.confidence,frame:state.frame,time:new Date().toISOString()};setState({committedDecisions:[...state.committedDecisions,decision]},'decision-commit');sound(920,.1);announce(`${decision.recommendation} committed to race state`);});
  $$('[data-network-node]').forEach((button)=>button.addEventListener('click',()=>setState({networkNode:button.dataset.networkNode},'network-node')));
  $$('[data-network-mode]').forEach((button)=>button.addEventListener('click',()=>{setState({networkMode:button.dataset.networkMode},'network-mode');announce(button.dataset.networkMode==='degraded'?'Adaptive transport engaged':'Normal transport restored');}));
  $('[data-trace-decision]').addEventListener('click',()=>{$('[data-network-map]').classList.remove('is-tracing');requestAnimationFrame(()=>$('[data-network-map]').classList.add('is-tracing'));sound(700,.1);});
  $('[data-pit-play]').addEventListener('click',togglePit); $('[data-pit-reset]').addEventListener('click',()=>setState({pitTime:0,pitPlaying:false},'pit-reset'));
  $('[data-pit-speed]').addEventListener('input',(event)=>{const speed=Number(event.target.value)/100;setState({pitSpeed:speed},'pit-speed');$('[data-pit-speed-output]').textContent=`${speed.toFixed(2)}×`;});
  $('[data-quality]').addEventListener('change',(event)=>setState({quality:event.target.value},'quality'));
  $('[data-lightweight-entry]').addEventListener('click',()=>{setState({quality:'lightweight'},'quality');$('[data-boot]').classList.add('is-complete');});
  $('[data-sound-toggle]').addEventListener('click',async()=>{const next=!store.getState().sound;setState({sound:next},'sound');if(next){audioContext||=new AudioContext();await audioContext.resume();sound(620,.08);}announce(next?'Interface sound enabled':'Interface sound muted');});
  $('[data-fullscreen]').addEventListener('click',async()=>{if(!document.documentElement.requestFullscreen){announce('Fullscreen is not available in this browser');return;}document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();});
  $('[data-help-open]').addEventListener('click',()=>$('[data-help-dialog]').showModal());
  $('[data-dialog-close]').addEventListener('click',()=>$('[data-help-dialog]').close());
  $('[data-start-briefing]').addEventListener('click',runGuidedBriefing); $('[data-replay-briefing]').addEventListener('click',runGuidedBriefing);
  $('[data-jump-strategy]').addEventListener('click',()=>navigate('strategy'));
  $('[data-export-session]').addEventListener('click',()=>{const state=store.getState();const payload={version:'RI-20X',exportedAt:new Date().toISOString(),sessionId:state.sessionId,state,frame:data.frames[state.frame]};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`${state.sessionId.toLowerCase()}-session.json`;anchor.click();URL.revokeObjectURL(url);announce('Session JSON exported');});
  $('[data-share-session]').addEventListener('click',async()=>{const url=new URL(location.href);url.searchParams.set('state',encodeState(store.getState()));const value=url.toString();try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);else throw new Error('clipboard unavailable');}catch{const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();}announce('Shareable state copied');});

  window.addEventListener('ri:component-selected',(event)=>setState({selectedComponent:event.detail.id,isolated:false},'scene-component'));
  window.addEventListener('ri:scene-ready',(event)=>{setState({sceneReady:true},'scene-ready');$('[data-boot-model]').textContent='READY';$('[data-boot-graphics]').textContent=event.detail.mode.toUpperCase();completeBoot();});
  window.addEventListener('ri:fps',(event)=>setState({fps:event.detail.fps},'fps'));
  window.addEventListener('hashchange',()=>{const chapter=location.hash.replace('#','');if(CHAPTERS.includes(chapter))setState({chapter},'hash');});

  document.addEventListener('keydown',(event)=>{
    const tag=event.target.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag)&&!(event.metaKey||event.ctrlKey))return;
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('[data-command-open]').click();return;}
    if(event.key==='?')$('[data-help-dialog]').showModal();
    if(event.key===' '){event.preventDefault();navigate('race');toggleReplay();}
    if(event.key==='ArrowRight')setState({frame:Math.min(data.frames.length-1,store.getState().frame+1)},'key-step');
    if(event.key==='ArrowLeft')setState({frame:Math.max(0,store.getState().frame-1)},'key-step');
    if(event.key.toLowerCase()==='r')setState({view:'studio',camera:'hero',explode:0,isolated:false},'scene-reset');
    const chapterNumber=Number(event.key);if(chapterNumber>=1&&chapterNumber<=8)navigate(CHAPTERS[chapterNumber-1]);
  });
}

function initChapterObserver() {
  const observer=new IntersectionObserver((entries)=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible&&visible.intersectionRatio>.26){const chapter=visible.target.dataset.chapter;if(chapter!==store.getState().chapter)setState({chapter},'scroll-chapter');}
  },{threshold:[.26,.45,.7],rootMargin:'-12% 0px -20%'});
  $$('[data-chapter]').forEach((chapter)=>observer.observe(chapter));
}

function initBoot() {
  const progress=$('[data-boot-progress]');let value=12;
  const timer=setInterval(()=>{value=Math.min(store.getState().sceneReady?100:88,value+Math.max(2,(92-value)*.12));progress.style.width=`${value}%`;if(value>=88)$('[data-boot-replay]').textContent='READY';if(value>=100){clearInterval(timer);completeBoot();}},90);
  $('[data-boot-core]').textContent='READY';
  setTimeout(()=>{if(!store.getState().sceneReady){setState({quality:'lightweight'},'scene-timeout');$('[data-boot-graphics]').textContent='LIGHTWEIGHT';$('[data-boot-model]').textContent='FALLBACK';completeBoot();}},4200);
}

function completeBoot() {
  const boot=$('[data-boot]');if(!boot||boot.classList.contains('is-complete'))return;
  const progress=$('[data-boot-progress]');progress.style.width='100%';$('[data-boot-replay]').textContent='READY';
  setTimeout(()=>boot.classList.add('is-complete'),prefersReduced?100:420);
}

buildStaticUi();
renderScenarioForm(initialState);
bindUi();
initCommandPalette();
initChapterObserver();
initBoot();
store.subscribe(renderGlobal);
renderGlobal(store.getState(),'initial');
observeCanvases(()=>renderGlobal(store.getState(),'resize'));
if(CHAPTERS.includes(initialState.chapter)&&initialState.chapter!=='command')setTimeout(()=>document.getElementById(initialState.chapter)?.scrollIntoView(),20);
if('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
