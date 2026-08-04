import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const sourceRoot = 'src/ri10x';
const files = ['index.html', 'styles.css', 'app.js', 'scene.js', 'core.mjs'];

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });

for (const file of files) {
  const content = await readFile(`${sourceRoot}/${file}`, 'utf8');
  await writeFile(file, content);
  await writeFile(`dist/${file}`, content);
}

await cp('assets/favicon.svg', 'dist/assets/favicon.svg');
console.log(`RI-10X production build complete: ${files.length} application files written to root and dist/.`);
