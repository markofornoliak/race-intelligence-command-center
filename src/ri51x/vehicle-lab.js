const ri51$=(selector,root=document)=>root.querySelector(selector);
const ri51$$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const ri51Reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ri51Html=document.documentElement;

ri51Html.dataset.riVersion='51';
ri51Html.dataset.ri51Mode='overview';
document.title='Race Intelligence OS — RI-51X';
ri51$$('.brand small').forEach((node)=>node.textContent='OPERATING SYSTEM · RI–51X');
ri51$$('.boot__mark span').forEach((node)=>node.textContent='RI–51X');

const ri51Defaults={
  rideHeight:36,
  damping:6.4,
  aeroBalance:46.5,
  flowDensity:72,
  cooling:68,
  showVectors:true,
  showPressure:true,
  showWake:true,
  showSuspension:true,
  freeze:false
};
const ri51Config=(()=>{
  try{return {...ri51Defaults,...JSON.parse(localStorage.getItem('ri51x-lab')||'{}')};}
  catch{return {...ri51Defaults};}
})();

const ri51Persist=()=>{
  try{localStorage.setItem('ri51x-lab',JSON.stringify(ri51Config));}catch{}
};
const ri51Dispatch=(reason='configuration')=>dispatchEvent(new CustomEvent('ri:vehicle-lab-config',{detail:{...ri51Config,reason}}));

const ri51Dock=ri51$('.ri50-command-dock');
if(ri51Dock&&!ri51$('[data-ri51-mode]',ri51Dock)){
  ri51Dock.insertAdjacentHTML('beforeend',`
    <button type="button" data-ri51-mode="dynamics"><b>08</b><span>DYNAMICS<small>Suspension and load</small></span></button>
    <button type="button" data-ri51-mode="cfd"><b>09</b><span>CFD LIVE<small>Pressure and wake</small></span></button>`);
}

const ri51Toggle=document.createElement('button');
ri51Toggle.type='button';
ri51Toggle.className='ri51-lab-toggle';
ri51Toggle.setAttribute('aria-expanded','false');
ri51Toggle.innerHTML='<i></i><span>VEHICLE DYNAMICS LAB</span>';
document.body.append(ri51Toggle);

const ri51Panel=document.createElement('aside');
ri51Panel.className='ri51-lab';
ri51Panel.setAttribute('aria-label','RI-51X vehicle dynamics lab');
ri51Panel.innerHTML=`
  <header class="ri51-lab__header">
    <div><p>RI-51X / ENGINEERING WORKBENCH</p><h3>Vehicle Dynamics<span>& CFD Lab</span></h3></div>
    <button type="button" class="ri51-lab__close" aria-label="Close vehicle dynamics lab">×</button>
  </header>
  <nav class="ri51-lab__tabs" aria-label="Vehicle lab views">
    <button type="button" data-ri51-tab="live" class="is-active">LIVE STATE</button>
    <button type="button" data-ri51-tab="suspension">SUSPENSION</button>
    <button type="button" data-ri51-tab="aero">AERO / CFD</button>
    <button type="button" data-ri51-tab="setup">SETUP</button>
  </nav>
  <div class="ri51-lab__scroll">
    <section class="ri51-lab__page is-active" data-ri51-page="live">
      <article class="ri51-section">
        <header><span>DYNAMIC LOAD STATE</span><strong data-ri51-status>MODEL SYNCHRONIZED</strong></header>
        <div class="ri51-section__body">
          <div class="ri51-metric-grid">
            <div class="ri51-metric" data-ri51-metric="downforce" style="--accent:var(--ri51-violet)"><span>TOTAL DOWNFORCE</span><strong>0 N</strong><small>ESTIMATED FROM SPEED</small></div>
            <div class="ri51-metric" data-ri51-metric="drag" style="--accent:var(--ri51-red)"><span>AERO DRAG</span><strong>0 N</strong><small>LIVE MODEL LOAD</small></div>
            <div class="ri51-metric" data-ri51-metric="ride" style="--accent:var(--ri51-cyan)"><span>PLATFORM HEIGHT</span><strong>36 MM</strong><small>FRONT REFERENCE</small></div>
            <div class="ri51-metric" data-ri51-metric="brake-energy" style="--accent:var(--ri51-orange)"><span>BRAKE ENERGY</span><strong>0 KW</strong><small>THERMAL INPUT</small></div>
          </div>
        </div>
      </article>
      <article class="ri51-section">
        <header><span>AERODYNAMIC LOAD MAP</span><strong data-ri51-aero-balance>46.5% FRONT</strong></header>
        <div class="ri51-section__body">
          <div class="ri51-load-map" data-ri51-load-map style="--cop:49%">
            <i class="ri51-load-map__car"></i><i class="ri51-load-map__cop"></i>
            <i class="ri51-load-map__vector ri51-load-map__vector--front"></i>
            <i class="ri51-load-map__vector ri51-load-map__vector--floor"></i>
            <i class="ri51-load-map__vector ri51-load-map__vector--rear"></i>
            <div class="ri51-load-map__legend"><span>FRONT WING</span><span>FLOOR / VENTURI</span><span>REAR WING</span></div>
          </div>
        </div>
      </article>
      <article class="ri51-section">
        <header><span>LOAD HISTORY</span><strong>LAST 36 FRAMES</strong></header>
        <div class="ri51-section__body"><canvas class="ri51-chart" data-ri51-chart width="720" height="250"></canvas></div>
      </article>
      <article class="ri51-section">
        <header><span>ENGINEERING EVENTS</span><strong>LIVE</strong></header>
        <div class="ri51-section__body"><div class="ri51-event-log" data-ri51-events></div></div>
      </article>
    </section>

    <section class="ri51-lab__page" data-ri51-page="suspension">
      <article class="ri51-section">
        <header><span>CORNER TRAVEL</span><strong data-ri51-heave>HEAVE 0.0 MM</strong></header>
        <div class="ri51-section__body">
          <div class="ri51-corner-grid">
            ${['FL','FR','RL','RR'].map((corner,index)=>`<div class="ri51-corner" data-ri51-corner="${corner}"><header><strong>${corner}</strong><span>0.0 MM</span></header><div class="ri51-corner__travel"><i style="--accent:${index<2?'var(--ri51-cyan)':'var(--ri51-violet)'};--travel:50%"></i></div><small>WHEEL TRAVEL</small></div>`).join('')}
          </div>
        </div>
      </article>
      <article class="ri51-section">
        <header><span>PLATFORM CONTROL</span><strong>ACTIVE MODEL</strong></header>
        <div class="ri51-section__body">
          <div class="ri51-control"><label>Reference ride height<small>Static chassis datum above floor</small></label><output data-ri51-output="rideHeight">${ri51Config.rideHeight} mm</output><input type="range" min="24" max="55" step="1" value="${ri51Config.rideHeight}" data-ri51-control="rideHeight"></div>
          <div class="ri51-control"><label>Damper response<small>Visual damping and transient control</small></label><output data-ri51-output="damping">${ri51Config.damping.toFixed(1)}</output><input type="range" min="1" max="10" step="0.1" value="${ri51Config.damping}" data-ri51-control="damping"></div>
        </div>
      </article>
      <article class="ri51-section">
        <header><span>KINEMATIC OVERLAYS</span><strong>VISIBILITY</strong></header>
        <div class="ri51-section__body"><div class="ri51-switch-row">
          <button class="ri51-switch ${ri51Config.showSuspension?'is-active':''}" type="button" data-ri51-switch="showSuspension">SUSPENSION LINKS<i></i></button>
          <button class="ri51-switch ${ri51Config.showVectors?'is-active':''}" type="button" data-ri51-switch="showVectors">LOAD VECTORS<i></i></button>
        </div></div>
      </article>
    </section>

    <section class="ri51-lab__page" data-ri51-page="aero">
      <article class="ri51-section">
        <header><span>CFD PARTICLE FIELD</span><strong data-ri51-flow-count>0 STREAM ELEMENTS</strong></header>
        <div class="ri51-section__body">
          <div class="ri51-control"><label>Flow-field density<small>Particle and streamline resolution</small></label><output data-ri51-output="flowDensity">${ri51Config.flowDensity}%</output><input type="range" min="20" max="100" step="1" value="${ri51Config.flowDensity}" data-ri51-control="flowDensity"></div>
          <div class="ri51-control"><label>Aerodynamic balance<small>Front share of total vertical load</small></label><output data-ri51-output="aeroBalance">${ri51Config.aeroBalance.toFixed(1)}%</output><input type="range" min="42" max="51" step="0.1" value="${ri51Config.aeroBalance}" data-ri51-control="aeroBalance"></div>
          <div class="ri51-pressure-scale"><span>LOW P</span><i></i><span>HIGH P</span></div>
        </div>
      </article>
      <article class="ri51-section">
        <header><span>FLOW QUALITY</span><strong>MODEL OUTPUT</strong></header>
        <div class="ri51-section__body"><div class="ri51-flow-quality">
          <div><span>FLOOR SEAL</span><strong data-ri51-quality="floor">94%</strong></div>
          <div><span>REAR WAKE</span><strong data-ri51-quality="wake">88%</strong></div>
          <div><span>COOLING</span><strong data-ri51-quality="cooling">91%</strong></div>
        </div></div>
      </article>
      <article class="ri51-section">
        <header><span>VISUALIZATION LAYERS</span><strong>CFD VIEW</strong></header>
        <div class="ri51-section__body"><div class="ri51-switch-row">
          <button class="ri51-switch ${ri51Config.showPressure?'is-active':''}" type="button" data-ri51-switch="showPressure">PRESSURE FIELD<i></i></button>
          <button class="ri51-switch ${ri51Config.showWake?'is-active':''}" type="button" data-ri51-switch="showWake">VORTEX WAKE<i></i></button>
        </div></div>
      </article>
    </section>

    <section class="ri51-lab__page" data-ri51-page="setup">
      <article class="ri51-section">
        <header><span>VEHICLE SETUP</span><strong>SESSION LAYER</strong></header>
        <div class="ri51-section__body">
          <div class="ri51-control"><label>Brake cooling aperture<small>Visual airflow and thermal decay</small></label><output data-ri51-output="cooling">${ri51Config.cooling}%</output><input type="range" min="30" max="100" step="1" value="${ri51Config.cooling}" data-ri51-control="cooling"></div>
        </div>
      </article>
      <article class="ri51-section">
        <header><span>SIMULATION STATE</span><strong>CONTROL</strong></header>
        <div class="ri51-section__body"><div class="ri51-switch-row">
          <button class="ri51-switch ${ri51Config.freeze?'is-active':''}" type="button" data-ri51-switch="freeze">FREEZE DYNAMICS<i></i></button>
          <button class="ri51-switch" type="button" data-ri51-reset>RESET SETUP<i></i></button>
        </div></div>
      </article>
      <article class="ri51-section">
        <header><span>MODEL NOTES</span><strong>RI-51X</strong></header>
        <div class="ri51-section__body"><p style="margin:0;color:#8fa0ac;font-size:12px;line-height:1.7">The browser model visualizes deterministic telemetry-derived loads. It is an engineering communication layer, not a homologated vehicle simulation or validated CFD solver.</p></div>
      </article>
    </section>
  </div>
  <footer class="ri51-lab__footer"><button type="button" data-ri51-run>RUN DYNAMIC PASS</button><button type="button" data-ri51-export>EXPORT SETUP</button></footer>`;
document.body.append(ri51Panel);

const ri51Badge=document.createElement('div');
ri51Badge.className='ri51-mode-badge';
ri51Badge.innerHTML='<i></i><span data-ri51-badge>RI-51X / VEHICLE DYNAMICS</span>';
ri51$('.command-viewport')?.append(ri51Badge);

const ri51Open=(open=true)=>{
  ri51Panel.classList.toggle('is-open',open);
  ri51Toggle.classList.toggle('is-active',open);
  ri51Toggle.setAttribute('aria-expanded',String(open));
};
ri51Toggle.addEventListener('click',()=>ri51Open(!ri51Panel.classList.contains('is-open')));
ri51$('.ri51-lab__close',ri51Panel).addEventListener('click',()=>ri51Open(false));

document.addEventListener('keydown',(event)=>{
  if(event.key.toLowerCase()==='v'&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))ri51Open(!ri51Panel.classList.contains('is-open'));
  if(event.key==='Escape'&&ri51Panel.classList.contains('is-open'))ri51Open(false);
});

ri51$$('[data-ri51-tab]',ri51Panel).forEach((button)=>button.addEventListener('click',()=>{
  ri51$$('[data-ri51-tab]',ri51Panel).forEach((node)=>node.classList.toggle('is-active',node===button));
  ri51$$('[data-ri51-page]',ri51Panel).forEach((page)=>page.classList.toggle('is-active',page.dataset.ri51Page===button.dataset.ri51Tab));
}));

const ri51OutputFormat=(key,value)=>{
  if(key==='rideHeight')return `${Math.round(value)} mm`;
  if(key==='aeroBalance')return `${Number(value).toFixed(1)}%`;
  if(key==='flowDensity'||key==='cooling')return `${Math.round(value)}%`;
  return Number(value).toFixed(1);
};

ri51$$('[data-ri51-control]',ri51Panel).forEach((input)=>input.addEventListener('input',()=>{
  const key=input.dataset.ri51Control;
  ri51Config[key]=Number(input.value);
  const output=ri51$(`[data-ri51-output="${key}"]`,ri51Panel);
  if(output)output.textContent=ri51OutputFormat(key,ri51Config[key]);
  ri51Persist();ri51Dispatch(`control:${key}`);
}));

ri51$$('[data-ri51-switch]',ri51Panel).forEach((button)=>button.addEventListener('click',()=>{
  const key=button.dataset.ri51Switch;
  ri51Config[key]=!ri51Config[key];
  button.classList.toggle('is-active',ri51Config[key]);
  ri51Persist();ri51Dispatch(`switch:${key}`);
}));

ri51$('[data-ri51-reset]',ri51Panel).addEventListener('click',()=>{
  Object.assign(ri51Config,ri51Defaults);
  ri51$$('[data-ri51-control]',ri51Panel).forEach((input)=>{
    const key=input.dataset.ri51Control;input.value=String(ri51Config[key]);
    const output=ri51$(`[data-ri51-output="${key}"]`,ri51Panel);if(output)output.textContent=ri51OutputFormat(key,ri51Config[key]);
  });
  ri51$$('[data-ri51-switch]',ri51Panel).forEach((button)=>button.classList.toggle('is-active',Boolean(ri51Config[button.dataset.ri51Switch])));
  ri51Persist();ri51Dispatch('reset');
});

ri51$('[data-ri51-run]',ri51Panel).addEventListener('click',()=>{
  ri51Config.freeze=false;
  ri51$('[data-ri51-switch="freeze"]',ri51Panel)?.classList.remove('is-active');
  ri51Dispatch('dynamic-pass');
  dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'side',rotation:[-0.04,-1.4,0],duration:1100}}));
});

ri51$('[data-ri51-export]',ri51Panel).addEventListener('click',()=>{
  const payload={version:'RI-51X',exportedAt:new Date().toISOString(),configuration:ri51Config,state:window.RI20X?.store?.getState?.()||null};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='ri51x-vehicle-setup.json';anchor.click();URL.revokeObjectURL(url);
});

const ri51EnsureEngineering=()=>ri51$('[data-ri40x-mode="engineering"]')?.click();
const ri51OpenTwin=()=>document.getElementById('twin')?.scrollIntoView({behavior:ri51Reduced?'auto':'smooth',block:'start'});
const ri51Click=(selector)=>ri51$(selector)?.click();
const ri51SetExplode=(value)=>{
  const input=ri51$('[data-explode]');if(!input)return;input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));
};

const ri51ActivateMode=(mode)=>{
  ri51Html.dataset.ri51Mode=mode;
  ri51$$('[data-ri51-mode]',ri51Dock).forEach((button)=>button.classList.toggle('is-active',button.dataset.ri51Mode===mode));
  ri51$$('[data-ri50-mode]',ri51Dock).forEach((button)=>button.classList.remove('is-active'));
  ri51EnsureEngineering();ri51OpenTwin();ri51Open(true);
  const tab=mode==='cfd'?'aero':'suspension';
  setTimeout(()=>{
    ri51$(`[data-ri51-tab="${tab}"]`,ri51Panel)?.click();
    if(mode==='cfd'){ri51Click('[data-view="aero"]');ri51Click('[data-camera="side"]');ri51SetExplode(0);}
    else{ri51Click('[data-view="technical"]');ri51Click('[data-camera="front"]');ri51SetExplode(18);}
    dispatchEvent(new CustomEvent('ri:vehicle-lab-mode',{detail:{mode}}));
  },260);
  const badge=ri51$('[data-ri51-badge]');if(badge)badge.textContent=mode==='cfd'?'RI-51X / LIVE CFD FIELD':'RI-51X / VEHICLE DYNAMICS';
};

ri51Dock?.addEventListener('click',(event)=>{
  const button=event.target.closest('[data-ri51-mode]');if(button)ri51ActivateMode(button.dataset.ri51Mode);
  if(event.target.closest('[data-ri50-mode]')){ri51Html.dataset.ri51Mode='overview';ri51$$('[data-ri51-mode]',ri51Dock).forEach((node)=>node.classList.remove('is-active'));}
});

const ri51Clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const ri51LoadState=(frame)=>{
  const speedMs=(frame?.speed||0)/3.6;
  const dynamicPressure=.5*1.225*speedMs*speedMs;
  const downforce=dynamicPressure*3.55;
  const drag=dynamicPressure*.91;
  const braking=ri51Clamp(((frame?.brake||430)-420)/430,0,1);
  const phase=(frame?.progress||0)*Math.PI*12;
  const pitch=Math.sin(phase+1.1)*2.6-braking*6.5;
  const roll=Math.sin(phase*.63)*4.2;
  const heave=Math.sin(phase*1.8)*1.8+downforce/5200*4.2;
  const frontShare=ri51Config.aeroBalance/100;
  return{speedMs,dynamicPressure,downforce,drag,braking,pitch,roll,heave,frontShare};
};

const ri51History=[];
const ri51SetMetric=(name,value,level)=>{
  const metric=ri51$(`[data-ri51-metric="${name}"]`,ri51Panel);if(!metric)return;
  metric.querySelector('strong').textContent=value;metric.style.setProperty('--level',`${ri51Clamp(level,0,100)}%`);
};

const ri51DrawChart=()=>{
  const canvas=ri51$('[data-ri51-chart]',ri51Panel);if(!canvas)return;
  const rect=canvas.getBoundingClientRect();const ratio=Math.min(2,devicePixelRatio||1);
  const width=Math.max(300,Math.round(rect.width*ratio));const height=Math.max(130,Math.round(rect.height*ratio));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,width,height);ctx.fillStyle='#03090e';ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='rgba(112,239,255,.08)';ctx.lineWidth=1;
  for(let x=0;x<=width;x+=width/8){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
  for(let y=0;y<=height;y+=height/5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  if(ri51History.length<2)return;
  const draw=(key,color,max)=>{ctx.beginPath();ri51History.forEach((item,index)=>{const x=(index/(ri51History.length-1))*width;const y=height-12-ri51Clamp(item[key]/max,0,1)*(height-28);if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle=color;ctx.lineWidth=2*ratio;ctx.shadowBlur=8*ratio;ctx.shadowColor=color;ctx.stroke();ctx.shadowBlur=0;};
  draw('downforce','#9f7cff',5200);draw('drag','#ff4962',1500);draw('travel','#70efff',14);
};

const ri51UpdateEvents=(frame,load)=>{
  const log=ri51$('[data-ri51-events]',ri51Panel);if(!log)return;
  const entries=[
    [frame?.time||0,'PLATFORM',Math.abs(load.pitch)>5?'PITCH LIMIT APPROACH':'PLATFORM CONTROLLED',Math.abs(load.pitch)>5?'var(--ri51-orange)':'var(--ri51-green)'],
    [Math.max(0,(frame?.time||0)-1.2),'AERO',load.downforce>4200?'HIGH LOAD STATE':'BALANCED LOAD','var(--ri51-violet)'],
    [Math.max(0,(frame?.time||0)-2.4),'BRAKES',(frame?.brake||0)>760?'THERMAL PEAK':'WINDOW NOMINAL',(frame?.brake||0)>760?'var(--ri51-red)':'var(--ri51-cyan)']
  ];
  log.innerHTML=entries.map(([time,type,message,accent])=>`<div style="--accent:${accent}"><time>${Number(time).toFixed(1)} S</time><strong>${message}</strong><span>${type}</span></div>`).join('');
};

const ri51Update=(state)=>{
  const frame=window.RI20X?.data?.frames?.[state?.frame??0];if(!frame)return;
  const load=ri51LoadState(frame);
  const ride=ri51Config.rideHeight-load.downforce/1850-load.braking*2.4;
  const brakePower=load.braking*load.speedMs*10.2;
  ri51SetMetric('downforce',`${Math.round(load.downforce).toLocaleString()} N`,load.downforce/55);
  ri51SetMetric('drag',`${Math.round(load.drag).toLocaleString()} N`,load.drag/16);
  ri51SetMetric('ride',`${ride.toFixed(1)} MM`,ride/55*100);
  ri51SetMetric('brake-energy',`${Math.round(brakePower)} KW`,brakePower/7);
  const aeroLabel=ri51$('[data-ri51-aero-balance]',ri51Panel);if(aeroLabel)aeroLabel.textContent=`${ri51Config.aeroBalance.toFixed(1)}% FRONT`;
  const map=ri51$('[data-ri51-load-map]',ri51Panel);if(map){map.style.setProperty('--cop',`${72-ri51Config.aeroBalance*.48}%`);map.querySelector('.ri51-load-map__vector--front').style.setProperty('--height',`${35+load.downforce*load.frontShare/65}px`);map.querySelector('.ri51-load-map__vector--floor').style.setProperty('--height',`${45+load.downforce*.46/70}px`);map.querySelector('.ri51-load-map__vector--rear').style.setProperty('--height',`${35+load.downforce*(1-load.frontShare)/65}px`);}
  const travels={FL:load.heave-load.pitch*.48-load.roll*.45,FR:load.heave-load.pitch*.48+load.roll*.45,RL:load.heave+load.pitch*.38-load.roll*.38,RR:load.heave+load.pitch*.38+load.roll*.38};
  Object.entries(travels).forEach(([corner,value])=>{const node=ri51$(`[data-ri51-corner="${corner}"]`,ri51Panel);if(!node)return;node.querySelector('span').textContent=`${value>=0?'+':''}${value.toFixed(1)} MM`;node.querySelector('i').style.setProperty('--travel',`${ri51Clamp(50+value*3.2,5,95)}%`);});
  const heave=ri51$('[data-ri51-heave]',ri51Panel);if(heave)heave.textContent=`HEAVE ${load.heave>=0?'+':''}${load.heave.toFixed(1)} MM`;
  const floorQuality=ri51Clamp(96-Math.abs(load.roll)*1.4-Math.max(0,ride-42)*.7,62,99);const wakeQuality=ri51Clamp(92-load.drag/180,65,96);const coolingQuality=ri51Clamp(72+ri51Config.cooling*.24-(frame.brake-600)/45,55,99);
  const floorNode=ri51$('[data-ri51-quality="floor"]',ri51Panel);if(floorNode)floorNode.textContent=`${floorQuality.toFixed(0)}%`;
  const wakeNode=ri51$('[data-ri51-quality="wake"]',ri51Panel);if(wakeNode)wakeNode.textContent=`${wakeQuality.toFixed(0)}%`;
  const coolingNode=ri51$('[data-ri51-quality="cooling"]',ri51Panel);if(coolingNode)coolingNode.textContent=`${coolingQuality.toFixed(0)}%`;
  ri51History.push({downforce:load.downforce,drag:load.drag,travel:Math.abs(load.heave)+Math.abs(load.roll)});if(ri51History.length>36)ri51History.shift();
  ri51DrawChart();ri51UpdateEvents(frame,load);
  const status=ri51$('[data-ri51-status]',ri51Panel);if(status)status.textContent=ri51Config.freeze?'DYNAMICS FROZEN':'MODEL SYNCHRONIZED';
};

window.RI20X?.store?.subscribe?.((state)=>ri51Update(state));
ri51Update(window.RI20X?.store?.getState?.()||{frame:0});
addEventListener('resize',ri51DrawChart,{passive:true});
addEventListener('ri:dynamics-ready',(event)=>{const count=ri51$('[data-ri51-flow-count]',ri51Panel);if(count)count.textContent=`${Number(event.detail?.particles||0).toLocaleString()} STREAM ELEMENTS`;});

ri51Dispatch('initialization');
console.info('RI-51X vehicle dynamics lab initialized.');
