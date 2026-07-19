import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const port = Number(process.env.PORT || 5173);
const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
};

http
  .createServer((request, response) => {
    const requestPath = request.url === '/' ? '/index.html' : request.url?.split('?')[0] || '/index.html';
    let filePath = path.join(root, requestPath);
    if (!fs.existsSync(filePath)) filePath = path.join(root, 'index.html');
    response.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'text/plain');
    fs.createReadStream(filePath).pipe(response);
  })
  .listen(port, () => console.log(`AI ATAN Hub: http://localhost:${port}`));
