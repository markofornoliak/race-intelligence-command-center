import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { buildTelemetry, runStrategy, SCENARIOS, COMPONENTS, NETWORK_NODES, PIT_STEPS } from '../src/ri20x/core.mjs';

const execFileAsync=promisify(execFile);
const root='src/ri20x';
const files=['index.html','styles.css','app.js','scene.js','engineering-scene.js','core.mjs','visuals.js','manifest.webmanifest','sw.js'];
const contents=Object.fromEntries(await Promise.all(files.map(async(file)=>[file,await readFile(`${root}/${file}`,'utf8')])));
const html=contents['index.html'];
const css=contents['styles.css'];
const app=contents['app.js'];
const coordinator=contents['scene.js'];
const engineering=contents['engineering-scene.js'];

for(const token of ['ONE RACE STATE.','DIGITAL TWIN','RACE STATE','STRATEGY LAB','PIT SEQUENCE','OPERATIONS NETWORK','PERFORMANCE EVIDENCE','FINAL BRIEF','data-command-open','data-strategy-chart','data-network-map','data-pit-steps'])if(!html.includes(token))throw new Error(`RI-40X experience token missing: ${token}`);
if((html.match(/<h1/g)||[]).length!==1)throw new Error('Exactly one h1 is required.');
if((html.match(/data-chapter="/g)||[]).length!==8)throw new Error('Eight connected chapters are required.');
if(!html.includes('type="importmap"')||!html.includes('<dialog')||!html.includes('aria-label'))throw new Error('HTML platform or accessibility hooks are incomplete.');
for(const token of ['@media(max-width:900px)','@media(max-width:600px)','prefers-reduced-motion',':focus-visible','html[data-quality="lightweight"]'])if(!css.includes(token))throw new Error(`Responsive/accessibility CSS missing: ${token}`);
const applicationSurface=app+contents['visuals.js'];
for(const token of ['buildTelemetry(180','runStrategy(','createStore(','IntersectionObserver','ResizeObserver','serviceWorker','navigator.clipboard','requestFullscreen'])if(!applicationSurface.includes(token))throw new Error(`Application capability missing: ${token}`);

for(const token of ['e89589184eac42c08028db5cba3f6499','397.9K','Sketchfab','photoreal','engineering-scene.js','CC BY','ri:model-renderer','fallbackToEngineering','data-ri40x-mode'])if(!coordinator.includes(token))throw new Error(`RI-40X photoreal coordinator capability missing: ${token}`);
if(!coordinator.includes("await import('./engineering-scene.js')"))throw new Error('RI-40X engineering fallback is not connected.');

for(const token of ['RI30X_DIGITAL_TWIN','WebGLRenderer','Raycaster','PMREMGenerator','createCanvasTexture','loftGeometry','airfoilGeometry','planformPrism','roundedBoxGeometry','HelixCurve','tyreSidewallTexture','shadowMap','Box3Helper','wheelAssemblies','brakeDiscs','animatedActuators','aeroGroup','thermalGroup','dataNetwork','ri:component-selected','ri:scene-ready'])if(!engineering.includes(token))throw new Error(`RI-40X engineering-twin capability missing: ${token}`);
for(const token of ['hole < 24','spoke < 14','fin < 15','button < 10','lane = -8','shadowMap.type = THREE.PCFSoftShadowMap'])if(!engineering.includes(token))throw new Error(`RI-40X engineering depth gate missing: ${token}`);
const engineeringBytes=Buffer.byteLength(engineering);
if(engineeringBytes<65000)throw new Error(`Engineering model implementation is unexpectedly shallow: ${engineeringBytes} bytes.`);

const a=buildTelemetry(180,20260805),b=buildTelemetry(180,20260805);
if(a.frames.length!==180||JSON.stringify(a)!==JSON.stringify(b))throw new Error('Telemetry replay must be deterministic and contain 180 frames.');
if(COMPONENTS.length<13||NETWORK_NODES.length<8||PIT_STEPS.length<12)throw new Error('Product depth datasets are incomplete.');
for(const [key,scenario] of Object.entries(SCENARIOS)){
  const first=runStrategy(key,scenario.defaults,1200),second=runStrategy(key,scenario.defaults,1200);
  if(JSON.stringify(first)!==JSON.stringify(second))throw new Error(`${key} strategy is not deterministic.`);
  if(first.outcomes.length!==1200||first.confidence<50||!scenario.decisions.includes(first.recommendation))throw new Error(`${key} strategy output is invalid.`);
}

const validationDir=await mkdtemp(join(tmpdir(),'ri40x-'));
try{
  for(const file of ['app.js','scene.js','engineering-scene.js','core.mjs','visuals.js','sw.js']){
    const path=join(validationDir,file.endsWith('.mjs')?file:`${file}.mjs`);
    await writeFile(path,contents[file]);
    await execFileAsync(process.execPath,['--check',path]);
  }
}finally{await rm(validationDir,{recursive:true,force:true});}

for(const file of ['assets/favicon.svg','.github/workflows/deploy-pages.yml','.github/workflows/validate-pr.yml','docs/RI30X_DIGITAL_TWIN_SPEC.md'])await access(file);
const bytes=Object.values(contents).reduce((sum,value)=>sum+Buffer.byteLength(value),0);
if(bytes>460000)throw new Error(`RI-40X source budget exceeded: ${bytes} bytes.`);
console.log(`RI-40X validation passed. Artist model: 397.9K triangles. Engineering twin: ${engineeringBytes} bytes. Replay: ${a.frames.length} frames. Strategies: ${Object.keys(SCENARIOS).length} × 1,200 outcomes. Source: ${bytes} bytes.`);
