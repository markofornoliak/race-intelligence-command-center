import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const sourceRoot = 'src/ri20x';
const upgradeRoot = 'src/ri30x';
const passthroughFiles = [
  'app.js',
  'scene.js',
  'core.mjs',
  'visuals.js'
];

const [
  indexSource,
  stylesSource,
  engineeringSource,
  manifestSource,
  serviceWorkerSource,
  stylesUpgrade,
  sceneUpgrade
] = await Promise.all([
  readFile(`${sourceRoot}/index.html`, 'utf8'),
  readFile(`${sourceRoot}/styles.css`, 'utf8'),
  readFile(`${sourceRoot}/engineering-scene.js`, 'utf8'),
  readFile(`${sourceRoot}/manifest.webmanifest`, 'utf8'),
  readFile(`${sourceRoot}/sw.js`, 'utf8'),
  readFile(`${upgradeRoot}/styles.upgrade.css`, 'utf8'),
  readFile(`${upgradeRoot}/scene.upgrade.js`, 'utf8')
]);

const index = indexSource
  .replaceAll('RI–20X', 'RI–40X')
  .replaceAll('RI-20X', 'RI-40X')
  .replace('</head>', '  <meta name="application-version" content="RI-40X.1" />\n</head>');

const styles = `${stylesSource.trim()}\n\n${stylesUpgrade.trim()}\n`;
const injectionPoint = /\n}\s*$/;
if (!injectionPoint.test(engineeringSource)) {
  throw new Error('Could not locate the engineering-scene capability block for RI-40X.1 injection.');
}
const engineeringScene = engineeringSource.replace(injectionPoint, `\n${sceneUpgrade.trim()}\n}\n`);
const manifest = manifestSource
  .replaceAll('RI-20X', 'RI-40X')
  .replaceAll('RI–20X', 'RI–40X');
const serviceWorker = serviceWorkerSource
  .replaceAll('ri20x', 'ri40x-1')
  .replaceAll('RI-20X', 'RI-40X');

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });

const generated = new Map([
  ['index.html', index],
  ['styles.css', styles],
  ['engineering-scene.js', engineeringScene],
  ['manifest.webmanifest', manifest],
  ['sw.js', serviceWorker]
]);

for (const file of passthroughFiles) {
  generated.set(file, await readFile(`${sourceRoot}/${file}`, 'utf8'));
}

for (const [file, content] of generated) {
  await writeFile(file, content);
  await writeFile(`dist/${file}`, content);
}

await cp('assets/favicon.svg', 'dist/assets/favicon.svg');
console.log(`RI-40X.1 production build complete: ${generated.size} application files written to root and dist/.`);
console.log(`Readability layer: ${Buffer.byteLength(stylesUpgrade)} bytes. Engineering detail pass: ${Buffer.byteLength(sceneUpgrade)} bytes.`);
