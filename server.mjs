import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = 4173;
const root = process.cwd();
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml'
};

http.createServer(async (request, response) => {
  try {
    const requestPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
    const safePath = normalize(decodeURIComponent(requestPath)).replace(/^\.\.(\/|\\)/, '');
    const filePath = join(root, safePath);
    const file = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(file);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, () => {
  console.log(`Race Intelligence running at http://localhost:${port}`);
});
