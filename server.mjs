import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = new URL('./dist/', import.meta.url).pathname;
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    const safe = normalize(pathname).replace(/^([.][.][/\\])+/, '');
    let file = join(root, safe === '/' ? 'index.html' : safe);
    const info = await stat(file).catch(() => null);
    if (!info || info.isDirectory()) file = join(root, 'index.html');
    response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain' });
    response.end(String(error));
  }
}).listen(port, '127.0.0.1', () => console.log(`RI-60X preview: http://127.0.0.1:${port}`));
