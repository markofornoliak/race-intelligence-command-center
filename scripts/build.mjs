import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
for (const file of ['index.html', 'styles.css', 'scene.js', 'ui.js']) {
  await cp(file, `dist/${file}`);
}
await cp('assets/favicon.svg', 'dist/assets/favicon.svg');
console.log('Production site created in dist/.');
