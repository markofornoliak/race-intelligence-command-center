import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const sourceRoot='src/ri20x';
const readabilityRoot='src/ri30x';
const experienceRoot='src/ri50x';
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
  hangarUpgrade
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
  readFile(`${experienceRoot}/hangar-scene.js`,'utf8')
]);

const index=indexSource
  .replaceAll('RI–20X','RI–50X')
  .replaceAll('RI-20X','RI-50X')
  .replace('</head>','  <meta name="application-version" content="RI-50X" />\n</head>')
  .replace('</body>','  <script type="module" src="experience.js"></script>\n</body>');

const styles=`${stylesSource.trim()}\n\n${readabilityCss.trim()}\n\n${experienceCss.trim()}\n`;
const injectionPoint=/\n}\s*$/;
if(!injectionPoint.test(engineeringSource))throw new Error('Could not locate the engineering-scene capability block.');
const combinedSceneUpgrade=`${engineeringUpgrade.trim()}\n\n${hangarUpgrade.trim()}`;
const engineeringScene=engineeringSource.replace(injectionPoint,`\n${combinedSceneUpgrade}\n}\n`);
const manifest=manifestSource
  .replaceAll('RI-20X','RI-50X')
  .replaceAll('RI–20X','RI–50X');
const serviceWorker=serviceWorkerSource
  .replace(/const CACHE='[^']+';/,"const CACHE='ri50x-v1';")
  .replace("'./scene.js','./engineering-scene.js'","'./scene.js','./engineering-scene.js','./experience.js'")
  .replaceAll('RI-20X','RI-50X');

await rm('dist',{recursive:true,force:true});
await mkdir('dist/assets',{recursive:true});

const generated=new Map([
  ['index.html',index],
  ['styles.css',styles],
  ['engineering-scene.js',engineeringScene],
  ['experience.js',experienceJs],
  ['manifest.webmanifest',manifest],
  ['sw.js',serviceWorker]
]);
for(const file of passthroughFiles)generated.set(file,await readFile(`${sourceRoot}/${file}`,'utf8'));
for(const [file,content] of generated){
  await writeFile(file,content);
  await writeFile(`dist/${file}`,content);
}
await cp('assets/favicon.svg','dist/assets/favicon.svg');

console.log(`RI-50X production build complete: ${generated.size} application files written to root and dist/.`);
console.log(`Interface system: ${Buffer.byteLength(experienceCss)+Buffer.byteLength(experienceJs)} bytes.`);
console.log(`3D upgrades: ${Buffer.byteLength(engineeringUpgrade)+Buffer.byteLength(hangarUpgrade)} bytes.`);
