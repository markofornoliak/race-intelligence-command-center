const ri51$=(selector,root=document)=>root.querySelector(selector);
const ri51$$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const ri51Reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ri51Html=document.documentElement;

ri51Html.dataset.riVersion='51';
ri51Html.dataset.ri51Mode='overview';
ri51Html.dataset.ri51Revision='precision';
document.title='Race Intelligence — Vehicle Performance';
ri51$$('.brand small').forEach((node)=>node.textContent='VEHICLE PERFORMANCE SYSTEM · RI–51X');
ri51$$('.boot__mark span').forEach((node)=>node.textContent='RI–51X');

const ri51Defaults={
  rideHeight:36,
  damping:6.4,
  aeroBalance:46.5,
  flowDensity:58,
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
const ri51Persist=()=>{try{localStorage.setItem('ri51x-lab',JSON.stringify(ri51Config));}catch{}};
const ri51Dispatch=(reason='configuration')=>dispatchEvent(new CustomEvent('ri:vehicle-lab-config',{detail:{...ri51Config,reason}}));

const ri51Dock=ri51$('.ri50-command-dock');
if(ri51Dock&&!ri51$('[data-ri51-mode]',ri51Dock)){
  ri51Dock.insertAdjacentHTML('beforeend',`
    <button type="button" data-ri51-mode="dynamics"><b>08</b><span>DYNAMICS<small>Chassis state</small></span></button>
    <button type="button" data-ri51-mode="cfd"><b>09</b><span>FLOW<small>Aero field</small></span></button>`);
}

const ri51Toggle=document.createElement('button');
ri51Toggle.type='button';
ri51Toggle.className='ri51-lab-toggle';
ri51Toggle.setAttribute('aria-expanded','false');
ri51Toggle.innerHTML='<i></i><span>VEHICLE LAB</span><kbd>V</kbd>';
document.body.append(ri51Toggle);

const metric=(key,label,unit,caption)=>`
  <div class="ri51-metric" data-ri51-metric="${key}">
    <span>${label}</span><strong>—</strong><small>${unit} · ${caption}</small>
  </div>`;
const control=(key,label,copy,min,max,step,value)=>`
  <label class="ri51-control">
    <span><b>${label}</b><small>${copy}</small></span>
    <output data-ri51-output="${key}">${value}</output>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${ri51Config[key]}" data-ri51-control="${key}">
  </label>`;
const toggle=(key,label)=>`<button class="ri51-switch ${ri51Config[key]?'is-active':''}" type="button" data-ri51-switch="${key}"><span>${label}</span><i></i></button>`;

const ri51Panel=document.createElement('aside');
ri51Panel.className='ri51-lab';
ri51Panel.setAttribute('aria-label','RI-51X vehicle dynamics lab');
ri51Panel.innerHTML=`
  <header class="ri51-lab__header">
    <div class="ri51-lab__identity">
      <span class="ri51-lab__status"><i></i>LIVE MODEL</span>
      <div><p>RI-51X / VEHICLE PERFORMANCE</p><h3>Engineering workbench</h3></div>
    </div>
    <div class="ri51-lab__header-actions">
      <button type="button" data-ri51-run>RUN DYNAMIC PASS</button>
      <button type="button" class="ri51-lab__close" aria-label="Close vehicle dynamics lab">×</button>
    </div>
  </header>

  <nav class="ri51-lab__tabs" aria-label="Vehicle lab views">
    <button type="button" data-ri51-tab="live" class="is-active">LIVE STATE</button>
    <button type="button" data-ri51-tab="chassis">CHASSIS</button>
    <button type="button" data-ri51-tab="aero">AERODYNAMICS</button>
    <button type="button" data-ri51-tab="setup">SETUP</button>
  </nav>

  <div class="ri51-lab__body">
    <section class="ri51-lab__page is-active" data-ri51-page="live">
      <div class="ri51-live-grid">
        <div class="ri51-metric-grid">
          ${metric('downforce','DOWNFORCE','N','VERTICAL LOAD')}
          ${metric('drag','DRAG','N','AERO RESISTANCE')}
          ${metric('ride','RIDE HEIGHT','MM','FRONT DATUM')}
          ${metric('brake-energy','BRAKE POWER','KW','ESTIMATED INPUT')}
        </div>
        <article class="ri51-primary-visual">
          <header><span>LOAD DISTRIBUTION</span><strong data-ri51-aero-balance>46.5% FRONT</strong></header>
          <div class="ri51-load-map" data-ri51-load-map style="--cop:50%">
            <i class="ri51-load-map__car"></i>
            <i class="ri51-load-map__cop"></i>
            <i class="ri51-load-map__vector ri51-load-map__vector--front"></i>
            <i class="ri51-load-map__vector ri51-load-map__vector--floor"></i>
            <i class="ri51-load-map__vector ri51-load-map__vector--rear"></i>
            <div class="ri51-load-map__legend"><span>FRONT</span><span>FLOOR</span><span>REAR</span></div>
          </div>
        </article>
        <article class="ri51-history">
          <header><span>LOAD TRACE</span><strong>36 FRAMES</strong></header>
          <canvas class="ri51-chart" data-ri51-chart width="720" height="250"></canvas>
          <div class="ri51-trace-legend"><span><i></i>DOWNFORCE</span><span><i></i>DRAG</span><span><i></i>TRAVEL</span></div>
        </article>
      </div>
    </section>

    <section class="ri51-lab__page" data-ri51-page="chassis">
      <div class="ri51-chassis-grid">
        <article class="ri51-corner-panel">
          <header><span>CORNER TRAVEL</span><strong data-ri51-heave>HEAVE 0.0 MM</strong></header>
          <div class="ri51-corner-grid">
            ${['FL','FR','RL','RR'].map((corner)=>`
              <div class="ri51-corner" data-ri51-corner="${corner}">
                <div><strong>${corner}</strong><span>0.0 MM</span></div>
                <div class="ri51-corner__travel"><i style="--travel:50%"></i></div>
              </div>`).join('')}
          </div>
        </article>
        <article class="ri51-settings-panel">
          <header><span>PLATFORM</span><strong>NON-INVASIVE OVERLAY</strong></header>
          ${control('rideHeight','Reference ride height','Visual datum only',24,55,1,`${ri51Config.rideHeight} mm`)}
          ${control('damping','Damper response','Overlay response rate',1,10,.1,ri51Config.damping.toFixed(1))}
          <div class="ri51-switch-row">${toggle('showSuspension','Suspension overlay')}${toggle('showVectors','Load vectors')}</div>
        </article>
        <article class="ri51-event-panel">
          <header><span>ENGINEERING FLAGS</span><strong data-ri51-status>MODEL SYNCHRONIZED</strong></header>
          <div class="ri51-event-log" data-ri51-events></div>
        </article>
      </div>
    </section>

    <section class="ri51-lab__page" data-ri51-page="aero">
      <div class="ri51-aero-grid">
        <article class="ri51-settings-panel">
          <header><span>FLOW FIELD</span><strong data-ri51-flow-count>— STREAM ELEMENTS</strong></header>
          ${control('flowDensity','Flow density','Rendering resolution',20,100,1,`${ri51Config.flowDensity}%`)}
          ${control('aeroBalance','Aero balance','Front vertical-load share',42,51,.1,`${ri51Config.aeroBalance.toFixed(1)}%`)}
          <div class="ri51-switch-row">${toggle('showPressure','Pressure volumes')}${toggle('showWake','Wake structure')}</div>
        </article>
        <article class="ri51-flow-panel">
          <header><span>FLOW QUALITY</span><strong>DETERMINISTIC MODEL</strong></header>
          <div class="ri51-flow-quality">
            <div><span>FLOOR SEAL</span><strong data-ri51-quality="floor">—</strong></div>
            <div><span>WAKE CONTROL</span><strong data-ri51-quality="wake">—</strong></div>
            <div><span>COOLING</span><strong data-ri51-quality="cooling">—</strong></div>
          </div>
          <div class="ri51-pressure-scale"><span>LOW PRESSURE</span><i></i><span>HIGH PRESSURE</span></div>
          <p>Flow graphics are telemetry-linked engineering visualization, not a validated CFD solution.</p>
        </article>
      </div>
    </section>

    <section class="ri51-lab__page" data-ri51-page="setup">
      <div class="ri51-setup-grid">
        <article class="ri51-settings-panel">
          <header><span>COOLING & STATE</span><strong>SESSION CONFIGURATION</strong></header>
          ${control('cooling','Brake cooling aperture','Flow visibility and thermal decay',30,100,1,`${ri51Config.cooling}%`)}
          <div class="ri51-switch-row">${toggle('freeze','Freeze dynamics')}<button class="ri51-switch" type="button" data-ri51-reset><span>Reset setup</span><i></i></button></div>
        </article>
        <article class="ri51-model-note">
          <span>MODEL INTEGRITY</span>
          <h4>Base geometry locked.</h4>
          <p>RI-51X now renders dynamics as a separate analytical layer. It no longer changes wheel roots, chassis position or the authored vehicle hierarchy.</p>
          <button type="button" data-ri51-export>EXPORT SETUP JSON</button>
        </article>
      </div>
    </section>
  </div>`;
document.body.append(ri51Panel);

const ri51Badge=document.createElement('div');
ri51Badge.className='ri51-mode-badge';
ri51Badge.innerHTML='<i></i><span data-ri51-badge>VEHICLE PERFORMANCE</span>';
ri51$('.command-viewport')?.append(ri51Badge);

const ri51Open=(open=true)=>{
  ri51Panel.classList.toggle('is-open',open);
  ri51Toggle.classList.toggle('is-active',open);
  ri51Toggle.setAttribute('aria-expanded',String(open));
  document.body.classList.toggle('ri51-lab-open',open);
};
ri51Toggle.addEventListener('click',()=>ri51Open(!ri51Panel.classList.contains('is-open')));
ri51$('.ri51-lab__close',ri51Panel)?.addEventListener('click',()=>ri51Open(false));
document.addEventListener('keydown',(event)=>{
  if(event.key.toLowerCase()==='v'&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))ri51Open(!ri51Panel.classList.contains('is-open'));
  if(event.key==='Escape')ri51Open(false);
});

ri51$$('[data-ri51-tab]',ri51Panel).forEach((button)=>button.addEventListener('click',()=>{
  ri51$$('[data-ri51-tab]',ri51Panel).forEach((node)=>node.classList.toggle('is-active',node===button));
  ri51$$('[data-ri51-page]',ri51Panel).forEach((page)=>page.classList.toggle('is-active',page.dataset.ri51Page===button.dataset.ri51Tab));
  requestAnimationFrame(ri51DrawChart);
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
  ri51Persist();
  ri51Dispatch(`control:${key}`);
}));
ri51$$('[data-ri51-switch]',ri51Panel).forEach((button)=>button.addEventListener('click',()=>{
  const key=button.dataset.ri51Switch;
  ri51Config[key]=!ri51Config[key];
  button.classList.toggle('is-active',Boolean(ri51Config[key]));
  ri51Persist();
  ri51Dispatch(`switch:${key}`);
}));
ri51$('[data-ri51-reset]',ri51Panel)?.addEventListener('click',()=>{
  Object.assign(ri51Config,ri51Defaults);
  ri51$$('[data-ri51-control]',ri51Panel).forEach((input)=>{
    const key=input.dataset.ri51Control;
    input.value=String(ri51Config[key]);
    const output=ri51$(`[data-ri51-output="${key}"]`,ri51Panel);
    if(output)output.textContent=ri51OutputFormat(key,ri51Config[key]);
  });
  ri51$$('[data-ri51-switch]',ri51Panel).forEach((button)=>button.classList.toggle('is-active',Boolean(ri51Config[button.dataset.ri51Switch])));
  ri51Persist();
  ri51Dispatch('reset');
});

ri51$('[data-ri51-run]',ri51Panel)?.addEventListener('click',()=>{
  ri51Config.freeze=false;
  ri51$('[data-ri51-switch="freeze"]',ri51Panel)?.classList.remove('is-active');
  ri51Dispatch('dynamic-pass');
  dispatchEvent(new CustomEvent('ri:cinematic-shot',{detail:{preset:'side',rotation:[-0.025,-1.5,0],duration:900}}));
});
ri51$('[data-ri51-export]',ri51Panel)?.addEventListener('click',()=>{
  const payload={version:'RI-51X Precision',exportedAt:new Date().toISOString(),configuration:ri51Config,state:window.RI20X?.store?.getState?.()||null};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download='ri51x-precision-setup.json';
  anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);
});

const ri51EnsureEngineering=()=>ri51$('[data-ri40x-mode="engineering"]')?.click();
const ri51OpenTwin=()=>document.getElementById('twin')?.scrollIntoView({behavior:ri51Reduced?'auto':'smooth',block:'start'});
const ri51Click=(selector)=>ri51$(selector)?.click();
const ri51SetExplode=(value)=>{
  const input=ri51$('[data-explode]');
  if(!input)return;
  input.value=String(value);
  input.dispatchEvent(new Event('input',{bubbles:true}));
};

const ri51ActivateMode=(mode)=>{
  ri51Html.dataset.ri51Mode=mode;
  ri51$$('[data-ri51-mode]',ri51Dock).forEach((button)=>button.classList.toggle('is-active',button.dataset.ri51Mode===mode));
  ri51$$('[data-ri50-mode]',ri51Dock).forEach((button)=>button.classList.remove('is-active'));
  ri51EnsureEngineering();
  ri51OpenTwin();
  ri51Open(true);
  const tab=mode==='cfd'?'aero':'chassis';
  setTimeout(()=>{
    ri51$(`[data-ri51-tab="${tab}"]`,ri51Panel)?.click();
    if(mode==='cfd'){
      ri51Click('[data-view="aero"]');
      ri51Click('[data-camera="side"]');
      ri51SetExplode(0);
    }else{
      ri51Click('[data-view="technical"]');
      ri51Click('[data-camera="front"]');
      ri51SetExplode(0);
    }
    dispatchEvent(new CustomEvent('ri:vehicle-lab-mode',{detail:{mode}}));
  },180);
  const badge=ri51$('[data-ri51-badge]');
  if(badge)badge.textContent=mode==='cfd'?'LIVE AERODYNAMIC FIELD':'CHASSIS DYNAMICS';
};
ri51Dock?.addEventListener('click',(event)=>{
  const button=event.target.closest('[data-ri51-mode]');
  if(button)ri51ActivateMode(button.dataset.ri51Mode);
  if(event.target.closest('[data-ri50-mode]')){
    ri51Html.dataset.ri51Mode='overview';
    ri51$$('[data-ri51-mode]',ri51Dock).forEach((node)=>node.classList.remove('is-active'));
    dispatchEvent(new CustomEvent('ri:vehicle-lab-mode',{detail:{mode:'overview'}}));
  }
});

const ri51Clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const ri51LoadState=(frame)=>{
  const speedMs=(frame?.speed||0)/3.6;
  const dynamicPressure=.5*1.225*speedMs*speedMs;
  const downforce=dynamicPressure*3.55;
  const drag=dynamicPressure*.91;
  const braking=ri51Clamp(((frame?.brake||430)-420)/430,0,1);
  const phase=(frame?.progress||0)*Math.PI*12;
  const pitch=Math.sin(phase+1.1)*2.2-braking*4.8;
  const roll=Math.sin(phase*.63)*3.4;
  const heave=Math.sin(phase*1.8)*1.3+downforce/6200*3.1;
  return{speedMs,dynamicPressure,downforce,drag,braking,pitch,roll,heave,frontShare:ri51Config.aeroBalance/100};
};

const ri51History=[];
const ri51SetMetric=(name,value,level)=>{
  const metric=ri51$(`[data-ri51-metric="${name}"]`,ri51Panel);
  if(!metric)return;
  metric.querySelector('strong').textContent=value;
  metric.style.setProperty('--level',`${ri51Clamp(level,0,100)}%`);
};
const ri51DrawChart=()=>{
  const canvas=ri51$('[data-ri51-chart]',ri51Panel);
  if(!canvas||!canvas.offsetParent)return;
  const rect=canvas.getBoundingClientRect();
  const ratio=Math.min(2,devicePixelRatio||1);
  const width=Math.max(320,Math.round(rect.width*ratio));
  const height=Math.max(150,Math.round(rect.height*ratio));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#0b0c0e';
  ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='rgba(255,255,255,.055)';
  ctx.lineWidth=1;
  for(let x=0;x<=width;x+=width/8){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
  for(let y=0;y<=height;y+=height/4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  if(ri51History.length<2)return;
  const draw=(key,color,max)=>{
    ctx.beginPath();
    ri51History.forEach((item,index)=>{
      const x=(index/(ri51History.length-1))*width;
      const y=height-10-ri51Clamp(item[key]/max,0,1)*(height-22);
      if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });
    ctx.strokeStyle=color;
    ctx.lineWidth=1.5*ratio;
    ctx.stroke();
  };
  draw('downforce','#f2f4f5',5200);
  draw('drag','#e10600',1500);
  draw('travel','#8f9ba1',14);
};
const ri51UpdateEvents=(frame,load)=>{
  const log=ri51$('[data-ri51-events]',ri51Panel);
  if(!log)return;
  const events=[
    ['PLATFORM',Math.abs(load.pitch)>4.8?'PITCH WINDOW':'CONTROLLED',Math.abs(load.pitch)>4.8?'warn':'ok'],
    ['AERO',load.downforce>4200?'HIGH LOAD':'BALANCED','neutral'],
    ['BRAKES',(frame?.brake||0)>760?'THERMAL PEAK':'NOMINAL',(frame?.brake||0)>760?'warn':'ok']
  ];
  log.innerHTML=events.map(([type,message,status])=>`<div data-state="${status}"><span>${type}</span><strong>${message}</strong><i></i></div>`).join('');
};

const ri51Update=(state)=>{
  const frame=window.RI20X?.data?.frames?.[state?.frame??0];
  if(!frame)return;
  const load=ri51LoadState(frame);
  const ride=ri51Config.rideHeight-load.downforce/1850-load.braking*2.1;
  const brakePower=load.braking*load.speedMs*10.2;

  ri51SetMetric('downforce',Math.round(load.downforce).toLocaleString(),load.downforce/55);
  ri51SetMetric('drag',Math.round(load.drag).toLocaleString(),load.drag/16);
  ri51SetMetric('ride',ride.toFixed(1),ride/55*100);
  ri51SetMetric('brake-energy',Math.round(brakePower).toLocaleString(),brakePower/7);

  const aeroLabel=ri51$('[data-ri51-aero-balance]',ri51Panel);
  if(aeroLabel)aeroLabel.textContent=`${ri51Config.aeroBalance.toFixed(1)}% FRONT`;
  const map=ri51$('[data-ri51-load-map]',ri51Panel);
  if(map){
    map.style.setProperty('--cop',`${72-ri51Config.aeroBalance*.48}%`);
    map.querySelector('.ri51-load-map__vector--front')?.style.setProperty('--height',`${26+load.downforce*load.frontShare/78}px`);
    map.querySelector('.ri51-load-map__vector--floor')?.style.setProperty('--height',`${34+load.downforce*.46/82}px`);
    map.querySelector('.ri51-load-map__vector--rear')?.style.setProperty('--height',`${26+load.downforce*(1-load.frontShare)/78}px`);
  }

  const travels={
    FL:load.heave-load.pitch*.42-load.roll*.36,
    FR:load.heave-load.pitch*.42+load.roll*.36,
    RL:load.heave+load.pitch*.32-load.roll*.3,
    RR:load.heave+load.pitch*.32+load.roll*.3
  };
  Object.entries(travels).forEach(([corner,value])=>{
    const node=ri51$(`[data-ri51-corner="${corner}"]`,ri51Panel);
    if(!node)return;
    node.querySelector('span').textContent=`${value>=0?'+':''}${value.toFixed(1)} MM`;
    node.querySelector('i').style.setProperty('--travel',`${ri51Clamp(50+value*3.4,6,94)}%`);
  });
  const heave=ri51$('[data-ri51-heave]',ri51Panel);
  if(heave)heave.textContent=`HEAVE ${load.heave>=0?'+':''}${load.heave.toFixed(1)} MM`;

  const qualities={
    floor:ri51Clamp(96-Math.abs(load.roll)*1.5-Math.max(0,ride-42)*.7,62,99),
    wake:ri51Clamp(93-load.drag/190,65,97),
    cooling:ri51Clamp(72+ri51Config.cooling*.24-(frame.brake-600)/45,55,99)
  };
  Object.entries(qualities).forEach(([key,value])=>{
    const node=ri51$(`[data-ri51-quality="${key}"]`,ri51Panel);
    if(node)node.textContent=`${value.toFixed(0)}%`;
  });

  ri51History.push({downforce:load.downforce,drag:load.drag,travel:Math.abs(load.heave)+Math.abs(load.roll)});
  if(ri51History.length>36)ri51History.shift();
  ri51DrawChart();
  ri51UpdateEvents(frame,load);
  const status=ri51$('[data-ri51-status]',ri51Panel);
  if(status)status.textContent=ri51Config.freeze?'DYNAMICS FROZEN':'MODEL SYNCHRONIZED';
};

window.RI20X?.store?.subscribe?.((state)=>ri51Update(state));
ri51Update(window.RI20X?.store?.getState?.()||{frame:0});
addEventListener('resize',ri51DrawChart,{passive:true});
addEventListener('ri:dynamics-ready',(event)=>{
  const count=ri51$('[data-ri51-flow-count]',ri51Panel);
  if(count)count.textContent=`${Number(event.detail?.particles||0).toLocaleString()} STREAM ELEMENTS`;
});

ri51Dispatch('initialization');
console.info('RI-51X vehicle dynamics lab initialized — precision revision.');
