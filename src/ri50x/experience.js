const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const html=document.documentElement;
html.dataset.riVersion='50';
html.dataset.ri50Intro='active';

document.title='Race Intelligence OS — RI-50X';
$$('.brand small').forEach((node)=>node.textContent='OPERATING SYSTEM · RI–50X');
$$('.boot__mark span').forEach((node)=>node.textContent='RI–50X');

const systemDefinitions=[
  ['VEHICLE TWIN','GEOMETRY LINK'],
  ['RACE MODEL','DETERMINISTIC'],
  ['STRATEGY CORE','1,200 OUTCOMES'],
  ['OPERATIONS GRID','SYNCHRONIZED']
];

const intro=document.createElement('section');
intro.className='ri50-intro';
intro.setAttribute('aria-label','RI-50X command center introduction');
intro.innerHTML=`
  <div class="ri50-intro__grid" aria-hidden="true"></div>
  <div class="ri50-intro__scan" aria-hidden="true"></div>
  <div class="ri50-intro__copy">
    <p class="ri50-intro__eyebrow">RACE INTELLIGENCE / NEXT GENERATION</p>
    <h1>COMMAND<span>THE RACE.</span></h1>
    <p class="ri50-intro__lead">A synchronized engineering environment for the car, race state, strategy, pit execution and distributed decision-making.</p>
    <div class="ri50-intro__systems">
      ${systemDefinitions.map(([label,status])=>`<div class="ri50-intro__system" style="--value:0%"><span>${label}</span><strong>${status}</strong></div>`).join('')}
    </div>
    <div class="ri50-intro__actions">
      <button class="ri50-intro__enter" type="button">ENTER COMMAND CENTER</button>
      <button class="ri50-intro__skip" type="button">SKIP CINEMATIC</button>
    </div>
  </div>
  <div class="ri50-intro__visual" aria-hidden="true">
    <div class="ri50-intro__wirecar">
      <i class="ri50-intro__wheel ri50-intro__wheel--fl"></i>
      <i class="ri50-intro__wheel ri50-intro__wheel--fr"></i>
      <i class="ri50-intro__wheel ri50-intro__wheel--rl"></i>
      <i class="ri50-intro__wheel ri50-intro__wheel--rr"></i>
    </div>
    <div class="ri50-intro__telemetry">
      <div><span>SESSION</span><strong>SIMULATION LIVE</strong></div>
      <div><span>LATENCY</span><strong>11 MS</strong></div>
      <div><span>MODEL</span><strong>98.4%</strong></div>
      <div><span>CHANNELS</span><strong>1,248</strong></div>
    </div>
  </div>`;
document.body.prepend(intro);

const introSystems=$$('.ri50-intro__system',intro);
let introComplete=false;
const finishIntro=()=>{
  if(introComplete)return;
  introComplete=true;
  intro.classList.add('is-leaving');
  html.dataset.ri50Intro='complete';
  dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'hero',rotation:[-0.075,-0.54,0.012],duration:1800}}));
  setTimeout(()=>intro.remove(),reduced?20:950);
};

intro.querySelector('.ri50-intro__enter').addEventListener('click',finishIntro);
intro.querySelector('.ri50-intro__skip').addEventListener('click',finishIntro);
introSystems.forEach((node,index)=>setTimeout(()=>node.style.setProperty('--value','100%'),240+index*260));
setTimeout(()=>intro.querySelector('.ri50-intro__enter')?.focus(),reduced?20:1150);

const buildHud=()=>{
  const viewport=$('.command-viewport');
  if(!viewport||$('.ri50-hud',viewport))return;
  const hud=document.createElement('div');
  hud.className='ri50-hud';
  hud.setAttribute('aria-hidden','true');
  hud.innerHTML=`
    <i class="ri50-hud__corner ri50-hud__corner--tl"></i><i class="ri50-hud__corner ri50-hud__corner--tr"></i>
    <i class="ri50-hud__corner ri50-hud__corner--bl"></i><i class="ri50-hud__corner ri50-hud__corner--br"></i>
    <div class="ri50-hud__scanline"></div><div class="ri50-hud__reticle"></div>
    <div class="ri50-hud__left">
      <div class="ri50-hud__module" style="--accent:var(--ri50-cyan)"><span>VEHICLE STATE</span><strong data-ri50-hud-speed>312 KM/H</strong><small data-ri50-hud-gear>GEAR 8 · 11,420 RPM</small></div>
      <div class="ri50-hud__module" style="--accent:var(--ri50-red)"><span>BRAKE SYSTEM</span><strong data-ri50-hud-brake>728 °C</strong><small data-ri50-hud-bias>BIAS 56.2% FRONT</small></div>
      <div class="ri50-hud__module" style="--accent:var(--ri50-amber)"><span>TYRE STATE</span><strong data-ri50-hud-tyre>96 °C</strong><small data-ri50-hud-deg>DEG 18.4%</small></div>
      <div class="ri50-hud__module" style="--accent:var(--ri50-green)"><span>ENERGY STORE</span><strong data-ri50-hud-ers>72%</strong><small>DEPLOYMENT OPTIMAL</small></div>
    </div>
    <div class="ri50-hud__right">
      <div class="ri50-hud__status"><span>DIGITAL TWIN</span><strong>LOCKED</strong><i></i></div>
      <div class="ri50-hud__status"><span>RACE STATE</span><strong>SYNCED</strong><i></i></div>
      <div class="ri50-hud__status"><span>FACTORY LINK</span><strong data-ri50-link>11 MS</strong><i></i></div>
      <div class="ri50-hud__status"><span>MODEL CONF.</span><strong data-ri50-confidence>98.4%</strong><i></i></div>
    </div>
    <div class="ri50-hud__tag"><i></i><span data-ri50-hud-mode>RI-50X / PHOTOREAL STUDIO</span></div>`;
  viewport.append(hud);
};
buildHud();

const modeCard=document.createElement('div');
modeCard.className='ri50-mode-card';
modeCard.innerHTML='<b>50</b><span data-ri50-mode-title>COMMAND OVERVIEW</span><small data-ri50-mode-copy>Unified vehicle and race state</small>';
$('.command-viewport')?.append(modeCard);

const dock=document.createElement('nav');
dock.className='ri50-command-dock';
dock.setAttribute('aria-label','RI-50X quick controls');
dock.innerHTML=`
  <button type="button" data-ri50-mode="overview" class="is-active"><b>01</b><span>OVERVIEW<small>Hero command view</small></span></button>
  <button type="button" data-ri50-mode="aero"><b>02</b><span>AERO<small>Pressure and wake</small></span></button>
  <button type="button" data-ri50-mode="thermal"><b>03</b><span>THERMAL<small>Tyres and brakes</small></span></button>
  <button type="button" data-ri50-mode="systems"><b>04</b><span>SYSTEMS<small>Sensor network</small></span></button>
  <button type="button" data-ri50-mode="explode"><b>05</b><span>EXPLODE<small>Engineering layers</small></span></button>
  <button type="button" data-ri50-mode="focus"><b>06</b><span>FOCUS<small>Cinematic viewport</small></span></button>
  <button type="button" data-ri50-mode="brief"><b>07</b><span>BRIEF<small>Decision summary</small></span></button>`;
document.body.append(dock);

const ribbon=document.createElement('aside');
ribbon.className='ri50-telemetry-ribbon';
ribbon.setAttribute('aria-label','Live telemetry ribbon');
ribbon.innerHTML=`
  <div class="ri50-telemetry-ribbon__label"><i></i>LIVE RACE STATE</div>
  <div class="ri50-telemetry-ribbon__metric"><span>SPEED</span><strong data-ri50-ribbon="speed">312 <em>KM/H</em></strong></div>
  <div class="ri50-telemetry-ribbon__metric"><span>GEAR / RPM</span><strong data-ri50-ribbon="gear">8 <em>/ 11,420</em></strong></div>
  <div class="ri50-telemetry-ribbon__metric"><span>TYRE CORE</span><strong data-ri50-ribbon="tyre">96.0 <em>°C</em></strong></div>
  <div class="ri50-telemetry-ribbon__metric"><span>BRAKE TEMP</span><strong data-ri50-ribbon="brake">728 <em>°C</em></strong></div>
  <div class="ri50-telemetry-ribbon__metric"><span>ERS STORE</span><strong data-ri50-ribbon="ers">72 <em>%</em></strong></div>
  <div class="ri50-telemetry-ribbon__metric"><span>LAP DELTA</span><strong data-ri50-ribbon="delta">-0.184 <em>S</em></strong></div>`;
document.body.append(ribbon);

const brief=document.createElement('aside');
brief.className='ri50-brief-panel';
brief.setAttribute('aria-label','Race intelligence brief');
brief.innerHTML=`
  <div class="ri50-brief-panel__header"><div><p>RI-50X DECISION BRIEF</p><h3>Next best action</h3></div><button type="button" class="ri50-brief-panel__close" aria-label="Close brief">×</button></div>
  <div class="ri50-brief-panel__body">
    <div class="ri50-brief-panel__row"><span>STRATEGY</span><strong data-ri50-brief="strategy">UNDERCUT WINDOW</strong></div>
    <div class="ri50-brief-panel__row"><span>CONFIDENCE</span><strong data-ri50-brief="confidence">84.2%</strong></div>
    <div class="ri50-brief-panel__row"><span>DECISION LATENCY</span><strong data-ri50-brief="latency">11 MS</strong></div>
    <div class="ri50-brief-panel__row"><span>RISK EXPOSURE</span><strong data-ri50-brief="risk">CONTROLLED</strong></div>
    <p class="ri50-brief-panel__copy" data-ri50-brief="copy">The undercut remains open. Commit before traffic density closes the tyre-temperature advantage.</p>
    <div class="ri50-brief-panel__actions"><button type="button" data-ri50-open-strategy>OPEN STRATEGY</button><button type="button" data-ri50-run-briefing>GUIDED BRIEFING</button></div>
  </div>`;
document.body.append(brief);
brief.querySelector('.ri50-brief-panel__close').addEventListener('click',()=>brief.classList.remove('is-open'));
brief.querySelector('[data-ri50-open-strategy]').addEventListener('click',()=>{
  brief.classList.remove('is-open');
  $('[data-jump-strategy]')?.click();
});
brief.querySelector('[data-ri50-run-briefing]').addEventListener('click',()=>{
  brief.classList.remove('is-open');
  $('[data-start-briefing]')?.click();
});

const modeMeta={
  overview:['COMMAND OVERVIEW','Unified vehicle and race state'],
  aero:['AERODYNAMIC LENS','Pressure structures, wake and floor flow'],
  thermal:['THERMAL LENS','Tyre core, brakes and cooling state'],
  systems:['DATA NETWORK','Sensors, buses and packet flow'],
  explode:['ENGINEERING EXPLODE','Physical systems separated for inspection'],
  focus:['CINEMATIC FOCUS','Distraction-free vehicle viewport'],
  brief:['DECISION BRIEF','Current recommendation and risk posture']
};
let currentMode='overview';
let focusMode=false;
let cardTimer=0;

const showModeCard=(mode)=>{
  const [title,copy]=modeMeta[mode]||modeMeta.overview;
  modeCard.querySelector('[data-ri50-mode-title]').textContent=title;
  modeCard.querySelector('[data-ri50-mode-copy]').textContent=copy;
  modeCard.classList.add('is-visible');
  clearTimeout(cardTimer);
  cardTimer=setTimeout(()=>modeCard.classList.remove('is-visible'),1800);
};

const clickView=(view)=>$(`[data-view="${view}"]`)?.click();
const clickCamera=(camera)=>$(`[data-camera="${camera}"]`)?.click();
const setExplode=(value)=>{
  const input=$('[data-explode]');
  if(!input)return;
  input.value=String(value);
  input.dispatchEvent(new Event('input',{bubbles:true}));
};
const openTwin=()=>document.getElementById('twin')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});

const setMode=(mode)=>{
  currentMode=mode;
  $$('[data-ri50-mode]',dock).forEach((button)=>button.classList.toggle('is-active',button.dataset.ri50Mode===mode));
  showModeCard(mode);
  if(mode==='overview'){
    clickView('studio');clickCamera('hero');setExplode(0);
    document.getElementById('command')?.scrollIntoView({behavior:reduced?'auto':'smooth'});
    dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'hero',rotation:[-0.075,-0.54,0.012],duration:1300}}));
  }
  if(mode==='aero'){
    openTwin();setTimeout(()=>{clickView('aero');clickCamera('side');setExplode(0);dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'side',rotation:[-0.03,-1.52,0],duration:1200}}));},260);
  }
  if(mode==='thermal'){
    openTwin();setTimeout(()=>{clickView('thermal');clickCamera('front');setExplode(0);dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'front',rotation:[-0.02,-0.04,0],duration:1100}}));},260);
  }
  if(mode==='systems'){
    openTwin();setTimeout(()=>{clickView('data');clickCamera('top');setExplode(20);dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'top',rotation:[-0.18,-.35,0],duration:1200}}));},260);
  }
  if(mode==='explode'){
    openTwin();setTimeout(()=>{clickView('technical');clickCamera('hero');setExplode(72);dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'hero',rotation:[-0.06,-.62,0],duration:1300}}));},260);
  }
  if(mode==='focus'){
    focusMode=!focusMode;
    html.dataset.ri50Focus=String(focusMode);
    if(focusMode){document.getElementById('command')?.scrollIntoView({behavior:reduced?'auto':'smooth'});clickView('studio');clickCamera('hero');setExplode(0);}
    else html.dataset.ri50Focus='false';
  }
  if(mode==='brief')brief.classList.toggle('is-open');
};

dock.addEventListener('click',(event)=>{
  const button=event.target.closest('[data-ri50-mode]');
  if(button)setMode(button.dataset.ri50Mode);
});

document.addEventListener('keydown',(event)=>{
  if(event.key.toLowerCase()==='f'&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))setMode('focus');
  if(event.key==='Escape'){
    brief.classList.remove('is-open');
    if(focusMode){focusMode=false;html.dataset.ri50Focus='false';}
  }
});

let fps=60;
let modelParts=0;
let lastState=null;
const resolveFrame=(state)=>{
  const frames=window.RI20X?.data?.frames;
  if(!frames?.length)return null;
  const index=Math.max(0,Math.min(frames.length-1,Number(state?.frame||0)));
  return frames[index];
};
const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

const updateTelemetry=(state)=>{
  lastState=state||lastState||window.RI20X?.store?.getState?.()||{};
  const frame=resolveFrame(lastState)||{};
  const speed=Math.round(number(frame.speed,212));
  const gear=Math.max(1,Math.min(8,Math.round(number(frame.gear,speed/42))));
  const rpm=Math.round(number(frame.rpm,6200+speed*17));
  const tyre=number(frame.tyre,88+Math.min(18,speed/28));
  const brake=Math.round(number(frame.brake,430+Math.max(0,speed-150)*2.1));
  const ers=Math.round(number(frame.ers,74));
  const delta=number(frame.delta,-0.184);
  const confidence=number(lastState.strategyResult?.confidence,84.2);
  const recommendation=lastState.strategyResult?.recommendation||'UNDERCUT WINDOW';
  const scenario=String(lastState.scenario||'undercut').toUpperCase();

  $('[data-ri50-hud-speed]')?.replaceChildren(document.createTextNode(`${speed} KM/H`));
  $('[data-ri50-hud-gear]')?.replaceChildren(document.createTextNode(`GEAR ${gear} · ${rpm.toLocaleString()} RPM`));
  $('[data-ri50-hud-brake]')?.replaceChildren(document.createTextNode(`${brake} °C`));
  $('[data-ri50-hud-tyre]')?.replaceChildren(document.createTextNode(`${tyre.toFixed(1)} °C`));
  $('[data-ri50-hud-ers]')?.replaceChildren(document.createTextNode(`${ers}%`));
  $('[data-ri50-confidence]')?.replaceChildren(document.createTextNode(`${confidence.toFixed(1)}%`));
  $('[data-ri50-link]')?.replaceChildren(document.createTextNode(lastState.networkMode==='degraded'?'38 MS':'11 MS'));

  const values={
    speed:`${speed} <em>KM/H</em>`,gear:`${gear} <em>/ ${rpm.toLocaleString()}</em>`,tyre:`${tyre.toFixed(1)} <em>°C</em>`,
    brake:`${brake} <em>°C</em>`,ers:`${ers} <em>%</em>`,delta:`${delta>=0?'+':''}${delta.toFixed(3)} <em>S</em>`
  };
  Object.entries(values).forEach(([key,value])=>{const node=$(`[data-ri50-ribbon="${key}"]`);if(node)node.innerHTML=value;});
  $('[data-ri50-brief="strategy"]')?.replaceChildren(document.createTextNode(recommendation));
  $('[data-ri50-brief="confidence"]')?.replaceChildren(document.createTextNode(`${confidence.toFixed(1)}%`));
  $('[data-ri50-brief="latency"]')?.replaceChildren(document.createTextNode(lastState.networkMode==='degraded'?'38 MS':'11 MS'));
  $('[data-ri50-brief="risk"]')?.replaceChildren(document.createTextNode(confidence>80?'CONTROLLED':confidence>68?'ELEVATED':'HIGH'));
  $('[data-ri50-brief="copy"]')?.replaceChildren(document.createTextNode(`${scenario} model active. ${recommendation} remains the highest-value action across the current deterministic outcome set.`));

  const chapter=String(lastState.chapter||location.hash.slice(1)||'command');
  ribbon.classList.toggle('is-visible',chapter!=='command'||html.dataset.ri50Intro==='complete');
  html.dataset.ri50Mode=currentMode;
  html.dataset.ri50Fps=String(Math.round(fps));
  html.dataset.ri50Parts=String(modelParts);
};

window.addEventListener('ri:fps',(event)=>{fps=number(event.detail?.fps,60);updateTelemetry();});
window.addEventListener('ri:model-upgraded',(event)=>{modelParts=number(event.detail?.addedParts,0);updateTelemetry();});
window.addEventListener('ri:model-renderer',(event)=>{
  const mode=String(event.detail?.mode||'engineering').toUpperCase();
  const tag=$('[data-ri50-hud-mode]');
  if(tag)tag.textContent=`RI-50X / ${mode} ${currentMode.toUpperCase()}`;
});
window.addEventListener('ri:state',(event)=>updateTelemetry(event.detail));

const attachStore=()=>{
  const store=window.RI20X?.store;
  if(!store?.subscribe)return false;
  store.subscribe((state)=>updateTelemetry(state));
  updateTelemetry(store.getState());
  return true;
};
if(!attachStore()){
  let attempts=0;
  const timer=setInterval(()=>{attempts+=1;if(attachStore()||attempts>40)clearInterval(timer);},100);
}

const pointerGlow=document.createElement('div');
pointerGlow.style.cssText='position:fixed;z-index:1;width:520px;height:520px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(80,201,255,.045),transparent 66%);transform:translate(-50%,-50%);transition:opacity .3s;opacity:0';
document.body.append(pointerGlow);
addEventListener('pointermove',(event)=>{
  pointerGlow.style.left=`${event.clientX}px`;
  pointerGlow.style.top=`${event.clientY}px`;
  pointerGlow.style.opacity='1';
},{passive:true});
addEventListener('pointerleave',()=>pointerGlow.style.opacity='0');

setTimeout(()=>{
  dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'hero',rotation:[-0.075,-0.54,0.012],duration:1800}}));
  updateTelemetry();
},450);

console.info('RI-50X immersive experience initialized.');
