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
    const requestPath = request.url === '/' ? 'index.html' : decodeURIComponent(request.url?.split('?')[0] || '/index.html').replace(/^[/\\]+/, '');
    let filePath = path.resolve(root, requestPath);
    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (!fs.existsSync(filePath)) filePath = path.join(root, 'index.html');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'text/plain');
    fs.createReadStream(filePath).pipe(response);
  })
  .listen(port, () => console.log(`AI ATAN Hub: http://localhost:${port}`));
