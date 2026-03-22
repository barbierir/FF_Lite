import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const ROOT_DIR = __dirname;
const INDEX_FILE = join(ROOT_DIR, 'public', 'index.html');
const PORT = Number(process.env.PORT || 8000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
};

function isPathInsideRoot(targetPath) {
  const relativePath = normalize(targetPath).replace(/\\/g, '/');
  const rootPath = normalize(ROOT_DIR).replace(/\\/g, '/');
  return relativePath === rootPath || relativePath.startsWith(`${rootPath}/`);
}

function sendFile(response, filePath, statusCode = 200) {
  const extension = extname(filePath).toLowerCase();
  response.writeHead(statusCode, {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=300',
  });
  createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const requestedPath = resolve(ROOT_DIR, `.${pathname}`);

  if (!isPathInsideRoot(requestedPath)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  if (pathname === '/' || pathname === '') {
    sendFile(response, INDEX_FILE);
    return;
  }

  if (existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    sendFile(response, requestedPath);
    return;
  }

  if (!extname(pathname)) {
    sendFile(response, INDEX_FILE);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

server.listen(PORT, () => {
  console.log(`FF Lite dev server listening on http://localhost:${PORT}`);
});
