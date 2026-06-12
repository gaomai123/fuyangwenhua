const fs = require('fs');
const http = require('http');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 8090);
const host = '127.0.0.1';
const types = {
  '.css': 'text/css;charset=utf-8',
  '.html': 'text/html;charset=utf-8',
  '.js': 'text/javascript;charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

http
  .createServer((request, response) => {
    const url = new URL(request.url, `http://${host}:${port}`);
    const pathname = url.pathname === '/' ? '/cloud-cases.html' : url.pathname;
    const filePath = path.normalize(path.join(root, decodeURIComponent(pathname)));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': types[path.extname(filePath)] || 'application/octet-stream'
      });
      response.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`admin-web http://${host}:${port}/cloud-cases.html`);
  });
