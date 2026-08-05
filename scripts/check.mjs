import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { buildTelemetry, runStrategy, SCENARIOS, COMPONENTS, NETWORK_NODES, PIT_STEPS } from '../src/ri20x/core.mjs';

const execFileAsync=promisify(execFile);
const root='src/ri20x';
const files=['index.html','styles.css','app.js','scene.js','core.mjs','visuals.js','manifest.webmanifest','sw.js'];
const contents=Object.fromEntries(await Promise.all(files.map(async(file)=>[file,await readFile(`${root}/${file}`,'utf8')])));
const html=contents['index.html'],css=contents['styles.css'],app=contents['app.js'],scene=contents['scene.js'];

for(const token of ['ONE RACE STATE.','DIGITAL TWIN','RACE STATE','STRATEGY LAB','PIT SEQUENCE','OPERATIONS NETWORK','PERFORMANCE EVIDENCE','FINAL BRIEF','data-command-open','data-strategy-chart','data-network-map','data-pit-steps'])if(!html.includes(token))throw new Error(`RI-20X experience token missing: ${token}`);
if((html.match(/<h1/g)||[]).length!==1)throw new Error('Exactly one h1 is required.');
if((html.match(/data-chapter="/g)||[]).length!==8)throw new Error('Eight connected chapters are required.');
if(!html.includes('type="importmap"')||!html.includes('<dialog')||!html.includes('aria-label'))throw new Error('HTML platform or accessibility hooks are incomplete.');
for(const token of ['@media(max-width:900px)','@media(max-width:600px)','prefers-reduced-motion',':focus-visible','html[data-quality="lightweight"]'])if(!css.includes(token))throw new Error(`Responsive/accessibility CSS missing: ${token}`);
const applicationSurface=app+contents['visuals.js'];
for(const token of ['buildTelemetry(180','runStrategy(','createStore(','IntersectionObserver','ResizeObserver','serviceWorker','navigator.clipboard','requestFullscreen'])if(!applicationSurface.includes(token))throw new Error(`Application capability missing: ${token}`);
for(const token of ['WebGLRenderer','Raycaster','loft(','aeroGroup','thermalGroup','dataNetwork','ri:component-selected','ri:scene-ready'])if(!scene.includes(token))throw new Error(`Digital-twin capability missing: ${token}`);

const a=buildTelemetry(180,20260805),b=buildTelemetry(180,20260805);
if(a.frames.length!==180||JSON.stringify(a)!==JSON.stringify(b))throw new Error('Telemetry replay must be deterministic and contain 180 frames.');
if(COMPONENTS.length<13||NETWORK_NODES.length<8||PIT_STEPS.length<12)throw new Error('Product depth datasets are incomplete.');
for(const [key,scenario] of Object.entries(SCENARIOS)){
  const first=runStrategy(key,scenario.defaults,1200),second=runStrategy(key,scenario.defaults,1200);
  if(JSON.stringify(first)!==JSON.stringify(second))throw new Error(`${key} strategy is not deterministic.`);
  if(first.outcomes.length!==1200||first.confidence<50||!scenario.decisions.includes(first.recommendation))throw new Error(`${key} strategy output is invalid.`);
}

const validationDir=await mkdtemp(join(tmpdir(),'ri20x-'));
try{
  for(const file of ['app.js','scene.js','core.mjs','visuals.js','sw.js']){const path=join(validationDir,file.endsWith('.mjs')?file:`${file}.mjs`);await writeFile(path,contents[file]);await execFileAsync(process.execPath,['--check',path]);}
}finally{await rm(validationDir,{recursive:true,force:true});}

for(const file of ['assets/favicon.svg','.github/workflows/deploy-pages.yml','.github/workflows/validate-pr.yml'])await access(file);
const bytes=Object.values(contents).reduce((sum,value)=>sum+Buffer.byteLength(value),0);
if(bytes>360000)throw new Error(`RI-20X source budget exceeded: ${bytes} bytes.`);
console.log(`RI-20X validation passed. Replay: ${a.frames.length} frames. Strategies: ${Object.keys(SCENARIOS).length} × 1,200 outcomes. Components: ${COMPONENTS.length}. Source: ${bytes} bytes.`);
