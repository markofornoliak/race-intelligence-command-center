const PHOTOREAL_MODEL={
  uid:'e89589184eac42c08028db5cba3f6499',
  title:'Formula 1 Car',
  author:'Steven Samuel',
  source:'https://sketchfab.com/3d-models/formula-1-car-e89589184eac42c08028db5cba3f6499',
  license:'CC BY',
  triangles:'397.9K'
};

const mainCanvas=document.querySelector('#carScene');
const twinCanvas=document.querySelector('#twinScene');
const commandViewport=document.querySelector('.command-viewport');
const twinStage=document.querySelector('.twin-stage');
const geometryReadout=document.querySelector('[data-scene-geometry]');
const sceneModeReadout=document.querySelector('[data-scene-mode]');
const sceneComponentReadout=document.querySelector('[data-scene-component]');
const twinViewReadout=document.querySelector('[data-twin-view]');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

let api=null;
let viewerReady=false;
let viewerStarted=false;
let scriptPromise=null;
let preferredMode=localStorage.getItem('ri40x-render-mode')||'photoreal';
let currentState={chapter:'command',view:'studio',camera:'hero',explode:0,isolated:false,quality:'auto'};

const style=document.createElement('style');
style.textContent=`
  .ri40x-photoreal{position:absolute;inset:0;z-index:4;overflow:hidden;border-radius:inherit;background:radial-gradient(circle at 58% 46%,#17232d 0,#080d12 44%,#020406 100%);opacity:0;visibility:hidden;transform:scale(.985);transition:opacity .45s ease,transform .55s cubic-bezier(.2,.8,.2,1),visibility .45s;}
  .ri40x-photoreal.is-active{opacity:1;visibility:visible;transform:none;}
  .ri40x-photoreal iframe{width:100%;height:100%;border:0;display:block;background:#05070b;}
  .ri40x-photoreal__loading{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(34,61,77,.58),rgba(2,4,7,.96));transition:opacity .35s ease;}
  .ri40x-photoreal.is-ready .ri40x-photoreal__loading{opacity:0;}
  .ri40x-photoreal__loading span{font:600 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;color:#bfefff;}
  .ri40x-photoreal__loading i{display:block;width:86px;height:1px;margin:12px auto 0;background:linear-gradient(90deg,transparent,#76dcff,transparent);animation:ri40x-scan 1.2s linear infinite;}
  .ri40x-photoreal__credit{position:absolute;left:14px;bottom:12px;z-index:5;max-width:min(440px,calc(100% - 28px));padding:7px 10px;border:1px solid rgba(154,221,255,.18);background:rgba(2,6,10,.72);backdrop-filter:blur(10px);font:500 9px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:#9eb8c8;}
  .ri40x-photoreal__credit a{color:#d7f4ff;text-decoration:none;}
  .ri40x-model-switch{position:absolute;top:44px;right:14px;z-index:12;display:flex;padding:3px;border:1px solid rgba(142,210,240,.2);background:rgba(3,8,12,.78);backdrop-filter:blur(12px);}
  .ri40x-model-switch button{border:0;background:transparent;color:#78909e;padding:7px 9px;font:700 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;cursor:pointer;}
  .ri40x-model-switch button.is-active{background:#d8f5ff;color:#061017;box-shadow:0 0 24px rgba(93,213,255,.2);}
  .ri40x-model-switch button:focus-visible{outline:1px solid #7ce3ff;outline-offset:2px;}
  canvas.ri40x-engineering-hidden{visibility:hidden!important;}
  @keyframes ri40x-scan{0%{transform:translateX(-45px);opacity:.2}50%{opacity:1}100%{transform:translateX(45px);opacity:.2}}
  @media(max-width:720px){.ri40x-model-switch{top:38px;right:8px}.ri40x-model-switch button{padding:6px 7px;font-size:7px}.ri40x-photoreal__credit{font-size:7px;bottom:8px;left:8px;max-width:calc(100% - 16px)}}
  @media(prefers-reduced-motion:reduce){.ri40x-photoreal,.ri40x-photoreal__loading i{transition:none;animation:none}}
`;
document.head.append(style);

const photoreal=document.createElement('div');
photoreal.className='ri40x-photoreal';
photoreal.setAttribute('aria-label','Artist-authored high-detail Formula race car viewer');
photoreal.innerHTML=`
  <iframe id="ri40x-photoreal-frame" title="High-detail Formula race car by Steven Samuel" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
  <div class="ri40x-photoreal__loading" aria-live="polite"><span>LOADING ARTIST-AUTHORED 397.9K TRIANGLE MODEL<i></i></span></div>
  <div class="ri40x-photoreal__credit">MODEL: <a href="${PHOTOREAL_MODEL.source}" target="_blank" rel="noreferrer">${PHOTOREAL_MODEL.title} — ${PHOTOREAL_MODEL.author}</a> · ${PHOTOREAL_MODEL.license}</div>
`;

const iframe=photoreal.querySelector('iframe');

function createSwitch(host){
  if(!host)return null;
  const control=document.createElement('div');
  control.className='ri40x-model-switch';
  control.setAttribute('role','group');
  control.setAttribute('aria-label','3D model renderer');
  control.innerHTML='<button type="button" data-ri40x-mode="photoreal">PHOTOREAL</button><button type="button" data-ri40x-mode="engineering">ENGINEERING</button>';
  control.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-ri40x-mode]');
    if(!button)return;
    preferredMode=button.dataset.ri40xMode;
    localStorage.setItem('ri40x-render-mode',preferredMode);
    if(preferredMode==='photoreal'&&currentState.view!=='studio'){
      document.querySelector('[data-view="studio"]')?.click();
    }
    syncPresentation('manual renderer switch');
  });
  host.append(control);
  return control;
}

const switches=[createSwitch(commandViewport),createSwitch(twinStage)].filter(Boolean);

function loadViewerScript(){
  if(window.Sketchfab)return Promise.resolve(window.Sketchfab);
  if(scriptPromise)return scriptPromise;
  scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.async=true;
    script.onload=()=>resolve(window.Sketchfab);
    script.onerror=()=>reject(new Error('Sketchfab Viewer API failed to load.'));
    document.head.append(script);
  });
  return scriptPromise;
}

async function initializeViewer(){
  if(viewerStarted)return;
  viewerStarted=true;
  try{
    const Sketchfab=await loadViewerScript();
    if(!Sketchfab)throw new Error('Sketchfab Viewer API unavailable.');
    const client=new Sketchfab('1.12.1',iframe);
    client.init(PHOTOREAL_MODEL.uid,{
      autostart:1,
      preload:1,
      camera:0,
      autospin:reduced?0:.12,
      dnt:1,
      scrollwheel:0,
      ui_theme:'dark',
      ui_infos:0,
      ui_stop:0,
      ui_hint:0,
      success(viewerApi){
        api=viewerApi;
        api.start();
        api.addEventListener('viewerready',()=>{
          viewerReady=true;
          photoreal.classList.add('is-ready');
          api.setFov?.(31);
          dispatchEvent(new CustomEvent('ri:photoreal-ready',{detail:{uid:PHOTOREAL_MODEL.uid,triangles:PHOTOREAL_MODEL.triangles}}));
          syncPresentation('photoreal ready');
        });
      },
      error(){fallbackToEngineering('The photoreal viewer could not be initialized.');}
    });
  }catch(error){
    console.warn(error);
    fallbackToEngineering('The photoreal viewer is unavailable.');
  }
}

function fallbackToEngineering(message){
  preferredMode='engineering';
  localStorage.setItem('ri40x-render-mode','engineering');
  photoreal.classList.remove('is-active');
  photoreal.dataset.error=message;
  syncPresentation('viewer fallback');
}

function desiredHost(){
  return currentState.chapter==='twin'?twinStage:commandViewport;
}

function shouldUsePhotoreal(){
  return preferredMode==='photoreal'&&
    currentState.view==='studio'&&
    Number(currentState.explode||0)<1&&
    !currentState.isolated&&
    currentState.quality!=='lightweight'&&
    (currentState.chapter==='command'||currentState.chapter==='twin');
}

function syncSwitches(active){
  switches.forEach((control)=>control.querySelectorAll('[data-ri40x-mode]').forEach((button)=>{
    const selected=button.dataset.ri40xMode===active;
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-pressed',String(selected));
  }));
}

function syncReadouts(active){
  if(active){
    if(geometryReadout)geometryReadout.textContent=`${PHOTOREAL_MODEL.triangles} TRIANGLES`;
    if(sceneModeReadout)sceneModeReadout.textContent='PHOTOREAL SHOWCAR';
    if(sceneComponentReadout)sceneComponentReadout.textContent='ARTIST-AUTHORED VEHICLE / CC BY';
    if(twinViewReadout&&currentState.chapter==='twin')twinViewReadout.textContent='PHOTOREAL';
  }
}

function syncPresentation(reason='state update'){
  const active=shouldUsePhotoreal();
  const host=desiredHost();
  if(active&&host&&photoreal.parentElement!==host)host.append(photoreal);
  photoreal.classList.toggle('is-active',active);
  mainCanvas?.classList.toggle('ri40x-engineering-hidden',active&&host===commandViewport);
  twinCanvas?.classList.toggle('ri40x-engineering-hidden',active&&host===twinStage);
  syncSwitches(active?'photoreal':'engineering');
  syncReadouts(active);
  if(active&&!viewerStarted)initializeViewer();
  if(api&&viewerReady){
    if(active)api.start?.();
    else api.stop?.();
  }
  document.documentElement.dataset.modelRenderer=active?'photoreal':'engineering';
  dispatchEvent(new CustomEvent('ri:model-renderer',{detail:{mode:active?'photoreal':'engineering',reason}}));
}

addEventListener('ri:state',(event)=>{
  currentState={...currentState,...event.detail};
  if(currentState.view!=='studio'||Number(currentState.explode||0)>0||currentState.isolated)preferredMode='engineering';
  syncPresentation('application state');
});

addEventListener('ri:focus-component',()=>{
  preferredMode='engineering';
  syncPresentation('component focus');
});

addEventListener('ri:component-selected',()=>{
  if(currentState.view!=='studio')preferredMode='engineering';
  syncPresentation('component selection');
});

const observer=new MutationObserver(()=>{
  const current=document.querySelector('[data-chapter].is-current');
  if(current?.dataset.chapter&&current.dataset.chapter!==currentState.chapter){
    currentState.chapter=current.dataset.chapter;
    syncPresentation('chapter mutation');
  }
});
observer.observe(document.querySelector('.app-shell')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});

// The local procedural twin remains the engineering/X-ray renderer and fallback.
await import('./engineering-scene.js');

// Upgrade visible version labels without rewriting the application shell.
document.title='Race Intelligence OS — RI-40X';
document.querySelectorAll('.brand small').forEach((node)=>node.textContent='OPERATING SYSTEM · RI–40X');
document.querySelectorAll('.boot__mark span').forEach((node)=>node.textContent='RI–40X');

syncPresentation('initialization');
