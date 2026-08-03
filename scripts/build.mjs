import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const sources = {
  'index.html': 'src/index',
  'styles.css': 'src/styles',
  'scene.js': 'src/scene',
  'ui.js': 'src/ui'
};

const assemble = async (directory) => {
  const files = (await readdir(directory)).filter((file) => file.endsWith('.part')).sort();
  if (!files.length) throw new Error(`No source parts found in ${directory}.`);
  return (await Promise.all(files.map((file) => readFile(join(directory, file), 'utf8')))).join('');
};

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });

for (const [output, directory] of Object.entries(sources)) {
  const content = await assemble(directory);
  await writeFile(output, content);
  await writeFile(`dist/${output}`, content);
}

await cp('assets/favicon.svg', 'dist/assets/favicon.svg');
console.log('Production site assembled in root and dist/.');
