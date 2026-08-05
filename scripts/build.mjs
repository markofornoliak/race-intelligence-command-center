import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const sourceRoot='src/ri20x';
const readabilityRoot='src/ri30x';
const experienceRoot='src/ri50x';
const dynamicsRoot='src/ri51x';
const passthroughFiles=['app.js','scene.js','core.mjs','visuals.js'];

const [
  indexSource,
  stylesSource,
  engineeringSource,
  manifestSource,
  serviceWorkerSource,
  readabilityCss,
  engineeringUpgrade,
  experienceCss,
  experienceJs,
  hangarUpgrade,
  vehicleLabCss,
  vehicleLabJs,
  dynamicsUpgrade
]=await Promise.all([
  readFile(`${sourceRoot}/index.html`,'utf8'),
  readFile(`${sourceRoot}/styles.css`,'utf8'),
  readFile(`${sourceRoot}/engineering-scene.js`,'utf8'),
  readFile(`${sourceRoot}/manifest.webmanifest`,'utf8'),
  readFile(`${sourceRoot}/sw.js`,'utf8'),
  readFile(`${readabilityRoot}/styles.upgrade.css`,'utf8'),
  readFile(`${readabilityRoot}/scene.upgrade.js`,'utf8'),
  readFile(`${experienceRoot}/experience.css`,'utf8'),
  readFile(`${experienceRoot}/experience.js`,'utf8'),
  readFile(`${experienceRoot}/hangar-scene.js`,'utf8'),
  readFile(`${dynamicsRoot}/vehicle-lab.css`,'utf8'),
  readFile(`${dynamicsRoot}/vehicle-lab.js`,'utf8'),
  readFile(`${dynamicsRoot}/dynamics-scene.js`,'utf8')
]);

const index=indexSource
  .replaceAll('RI–20X','RI–51X')
  .replaceAll('RI-20X','RI-51X')
  .replace('</head>','  <meta name="application-version" content="RI-51X" />\n</head>')
  .replace('</body>','  <script type="module" src="experience.js"></script>\n  <script type="module" src="vehicle-lab.js"></script>\n</body>');

const styles=`${stylesSource.trim()}\n\n${readabilityCss.trim()}\n\n${experienceCss.trim()}\n\n${vehicleLabCss.trim()}\n`;
const injectionPoint=/\n}\s*$/;
if(!injectionPoint.test(engineeringSource))throw new Error('Could not locate the engineering-scene capability block.');
const combinedSceneUpgrade=`${engineeringUpgrade.trim()}\n\n${hangarUpgrade.trim()}\n\n${dynamicsUpgrade.trim()}`;
const engineeringScene=engineeringSource.replace(injectionPoint,`\n${combinedSceneUpgrade}\n}\n`);
const manifest=manifestSource
  .replaceAll('RI-20X','RI-51X')
  .replaceAll('RI–20X','RI–51X');
const serviceWorker=serviceWorkerSource
  .replace(/const CACHE='[^']+';/,"const CACHE='ri51x-v1';")
  .replace("'./scene.js','./engineering-scene.js'","'./scene.js','./engineering-scene.js','./experience.js','./vehicle-lab.js'")
  .replaceAll('RI-20X','RI-51X');

await rm('dist',{recursive:true,force:true});
await mkdir('dist/assets',{recursive:true});

const generated=new Map([
  ['index.html',index],
  ['styles.css',styles],
  ['engineering-scene.js',engineeringScene],
  ['experience.js',experienceJs],
  ['vehicle-lab.js',vehicleLabJs],
  ['manifest.webmanifest',manifest],
  ['sw.js',serviceWorker]
]);
for(const file of passthroughFiles)generated.set(file,await readFile(`${sourceRoot}/${file}`,'utf8'));
for(const [file,content] of generated){
  await writeFile(file,content);
  await writeFile(`dist/${file}`,content);
}
await cp('assets/favicon.svg','dist/assets/favicon.svg');

const interfaceBytes=Buffer.byteLength(experienceCss)+Buffer.byteLength(experienceJs)+Buffer.byteLength(vehicleLabCss)+Buffer.byteLength(vehicleLabJs);
const threeDBytes=Buffer.byteLength(engineeringUpgrade)+Buffer.byteLength(hangarUpgrade)+Buffer.byteLength(dynamicsUpgrade);
console.log(`RI-51X production build complete: ${generated.size} application files written to root and dist/.`);
console.log(`Interface system: ${interfaceBytes} bytes.`);
console.log(`3D upgrades: ${threeDBytes} bytes.`);
