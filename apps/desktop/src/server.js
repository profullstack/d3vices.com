/**
 * A loopback static server for the packaged site.
 *
 * The window could load the pages from file://, but a file:// origin is not a
 * secure context for several of the APIs these tests exist to exercise, and it
 * has no working same-origin fetch. http://127.0.0.1 IS a secure context, so
 * serving the exported site over loopback is what lets the desktop build run
 * exactly the same code as the website.
 */
const http = require('node:http');
const { createReadStream, promises: fs } = require('node:fs');
const path = require('node:path');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function resolveFile(root, urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  // Normalise away any ".." before joining: a packaged app should not serve
  // arbitrary files from the user's disk just because a URL asked nicely.
  const safe = path.normalize(clean).replace(/^(\.\.[/\\])+/, '');
  const candidates =
    safe === '/' || safe === '\\'
      ? ['index.html']
      : [
          safe.replace(/^[/\\]/, ''),
          `${safe.replace(/^[/\\]/, '')}.html`,
          path.join(safe.replace(/^[/\\]/, ''), 'index.html'),
        ];

  for (const candidate of candidates) {
    const full = path.join(root, candidate);
    if (!full.startsWith(root)) continue;
    try {
      const stat = await fs.stat(full);
      if (stat.isFile()) return full;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function startServer(root) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const file = await resolveFile(root, req.url || '/');
        if (!file) {
          const fallback = path.join(root, '404.html');
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          createReadStream(fallback)
            .on('error', () => res.end('Not found'))
            .pipe(res);
          return;
        }
        res.writeHead(200, {
          'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-cache',
        });
        createReadStream(file).pipe(res);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(String(error));
      }
    });

    // Port 0: the OS picks a free one, so two copies never collide.
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
    server.on('error', reject);
  });
}

module.exports = { startServer };
