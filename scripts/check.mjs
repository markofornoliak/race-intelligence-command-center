import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { buildTelemetry, runStrategy, SCENARIOS, COMPONENTS, NETWORK_NODES, PIT_STEPS } from '../src/ri20x/core.mjs';

const execFileAsync=promisify(execFile);
const baseRoot='src/ri20x';
const readabilityRoot='src/ri30x';
const experienceRoot='src/ri50x';
const baseFiles=['index.html','styles.css','app.js','scene.js','engineering-scene.js','core.mjs','visuals.js','manifest.webmanifest','sw.js'];
const base=Object.fromEntries(await Promise.all(baseFiles.map(async(file)=>[file,await readFile(`${baseRoot}/${file}`,'utf8')])));
const upgrades={
  readabilityCss:await readFile(`${readabilityRoot}/styles.upgrade.css`,'utf8'),
  engineeringUpgrade:await readFile(`${readabilityRoot}/scene.upgrade.js`,'utf8'),
  experienceCss:await readFile(`${experienceRoot}/experience.css`,'utf8'),
  experienceJs:await readFile(`${experienceRoot}/experience.js`,'utf8'),
  hangarUpgrade:await readFile(`${experienceRoot}/hangar-scene.js`,'utf8'),
  build:await readFile('scripts/build.mjs','utf8')
};
const html=base['index.html'];
const css=base['styles.css'];
const app=base['app.js'];
const coordinator=base['scene.js'];
const engineering=base['engineering-scene.js'];

for(const token of ['ONE RACE STATE.','DIGITAL TWIN','RACE STATE','STRATEGY LAB','PIT SEQUENCE','OPERATIONS NETWORK','PERFORMANCE EVIDENCE','FINAL BRIEF','data-command-open','data-strategy-chart','data-network-map','data-pit-steps'])if(!html.includes(token))throw new Error(`Core experience token missing: ${token}`);
if((html.match(/<h1/g)||[]).length!==1)throw new Error('Exactly one source h1 is required.');
if((html.match(/data-chapter="/g)||[]).length!==8)throw new Error('Eight connected chapters are required.');
if(!html.includes('type="importmap"')||!html.includes('<dialog')||!html.includes('aria-label'))throw new Error('HTML platform or accessibility hooks are incomplete.');
for(const token of ['@media(max-width:900px)','@media(max-width:600px)','prefers-reduced-motion',':focus-visible','html[data-quality="lightweight"]'])if(!css.includes(token))throw new Error(`Responsive/accessibility CSS missing: ${token}`);
const applicationSurface=app+base['visuals.js'];
for(const token of ['buildTelemetry(180','runStrategy(','createStore(','IntersectionObserver','ResizeObserver','serviceWorker','navigator.clipboard','requestFullscreen'])if(!applicationSurface.includes(token))throw new Error(`Application capability missing: ${token}`);

for(const token of ['e89589184eac42c08028db5cba3f6499','397.9K','Sketchfab','photoreal','engineering-scene.js','CC BY','ri:model-renderer','fallbackToEngineering','data-ri40x-mode'])if(!coordinator.includes(token))throw new Error(`Hybrid renderer capability missing: ${token}`);
if(!coordinator.includes("await import('./engineering-scene.js')"))throw new Error('Engineering fallback is not connected.');
for(const token of ['RI30X_DIGITAL_TWIN','WebGLRenderer','Raycaster','PMREMGenerator','createCanvasTexture','loftGeometry','airfoilGeometry','planformPrism','roundedBoxGeometry','HelixCurve','tyreSidewallTexture','shadowMap','Box3Helper','wheelAssemblies','brakeDiscs','animatedActuators','aeroGroup','thermalGroup','dataNetwork','ri:component-selected','ri:scene-ready'])if(!engineering.includes(token))throw new Error(`Engineering-twin capability missing: ${token}`);
for(const token of ['hole < 24','spoke < 14','fin < 15','button < 10','lane = -8','shadowMap.type = THREE.PCFSoftShadowMap'])if(!engineering.includes(token))throw new Error(`Engineering depth gate missing: ${token}`);

for(const token of ['ri50-intro','ri50-command-dock','ri50-telemetry-ribbon','ri50-brief-panel','data-ri50-focus','@media(max-width:640px)','prefers-reduced-motion'])if(!upgrades.experienceCss.includes(token))throw new Error(`RI-50X interface style missing: ${token}`);
for(const token of ['COMMAND THE RACE','ri:cinematic-shot','data-ri50-mode','updateTelemetry','RI-50X immersive experience initialized','ri:model-renderer','ri:model-upgraded'])if(!upgrades.experienceJs.includes(token))throw new Error(`RI-50X interface behavior missing: ${token}`);
for(const token of ['RI50X_IMMERSIVE_HANGAR','GRID_FLOOR','RI50X_TURNTABLE','RectAreaLight','VOLUMETRIC_BEAM','VEHICLE_SCAN','ATMOSPHERIC_PARTICLES','ri:hangar-ready','ri:cinematic-shot'])if(!upgrades.hangarUpgrade.includes(token))throw new Error(`RI-50X hangar capability missing: ${token}`);
for(const token of ['RI40X_AUTHORED_DETAIL_PASS','MIRROR_SHELL','T_CAMERA_HEAD','FLOOR_FENCE','RAIN_LIGHT','ERS_ENERGY_SPINE','FLOOR_SPARKS'])if(!upgrades.engineeringUpgrade.includes(token))throw new Error(`Vehicle detail capability missing: ${token}`);
for(const token of ['src/ri50x','experience.css','experience.js','hangar-scene.js','RI-50X production build','ri50x-v1'])if(!upgrades.build.includes(token))throw new Error(`RI-50X build integration missing: ${token}`);

const engineeringBytes=Buffer.byteLength(engineering)+Buffer.byteLength(upgrades.engineeringUpgrade)+Buffer.byteLength(upgrades.hangarUpgrade);
if(engineeringBytes<90000)throw new Error(`Combined 3D implementation is unexpectedly shallow: ${engineeringBytes} bytes.`);
const experienceBytes=Buffer.byteLength(upgrades.experienceCss)+Buffer.byteLength(upgrades.experienceJs);
if(experienceBytes<30000)throw new Error(`RI-50X interface implementation is unexpectedly shallow: ${experienceBytes} bytes.`);

const a=buildTelemetry(180,20260805),b=buildTelemetry(180,20260805);
if(a.frames.length!==180||JSON.stringify(a)!==JSON.stringify(b))throw new Error('Telemetry replay must be deterministic and contain 180 frames.');
if(COMPONENTS.length<13||NETWORK_NODES.length<8||PIT_STEPS.length<12)throw new Error('Product depth datasets are incomplete.');
for(const [key,scenario] of Object.entries(SCENARIOS)){
  const first=runStrategy(key,scenario.defaults,1200),second=runStrategy(key,scenario.defaults,1200);
  if(JSON.stringify(first)!==JSON.stringify(second))throw new Error(`${key} strategy is not deterministic.`);
  if(first.outcomes.length!==1200||first.confidence<50||!scenario.decisions.includes(first.recommendation))throw new Error(`${key} strategy output is invalid.`);
}

const validationDir=await mkdtemp(join(tmpdir(),'ri50x-'));
try{
  const syntaxFiles={
    'app.mjs':base['app.js'],
    'scene.mjs':base['scene.js'],
    'engineering-scene.mjs':base['engineering-scene.js'],
    'core.mjs':base['core.mjs'],
    'visuals.mjs':base['visuals.js'],
    'sw.mjs':base['sw.js'],
    'experience.mjs':upgrades.experienceJs,
    'engineering-upgrade.mjs':upgrades.engineeringUpgrade,
    'hangar-upgrade.mjs':upgrades.hangarUpgrade,
    'build.mjs':upgrades.build
  };
  for(const [file,content] of Object.entries(syntaxFiles)){
    const path=join(validationDir,file);
    await writeFile(path,content);
    await execFileAsync(process.execPath,['--check',path]);
  }
}finally{await rm(validationDir,{recursive:true,force:true});}

for(const file of ['assets/favicon.svg','.github/workflows/deploy-pages.yml','.github/workflows/validate-pr.yml','docs/RI30X_DIGITAL_TWIN_SPEC.md','src/ri50x/experience.css','src/ri50x/experience.js','src/ri50x/hangar-scene.js'])await access(file);
const bytes=Object.values(base).reduce((sum,value)=>sum+Buffer.byteLength(value),0)+Object.values(upgrades).reduce((sum,value)=>sum+Buffer.byteLength(value),0);
if(bytes>650000)throw new Error(`RI-50X source budget exceeded: ${bytes} bytes.`);
console.log(`RI-50X validation passed. Artist model: 397.9K triangles. Combined 3D: ${engineeringBytes} bytes. Interface: ${experienceBytes} bytes. Replay: ${a.frames.length} frames. Strategies: ${Object.keys(SCENARIOS).length} × 1,200 outcomes. Source: ${bytes} bytes.`);
