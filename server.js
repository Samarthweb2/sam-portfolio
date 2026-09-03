/**
 * Simple dev server for Sam's Portfolio
 * Replaces Flask for local development since Python isn't available.
 * Serves static files and renders index.html with template variables replaced.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function resolveStaticUrl(template) {
  // Replace Flask's {{ url_for('static', filename='...') }} with /static/...
  return template.replace(
    /\{\{\s*url_for\s*\(\s*'static'\s*,\s*filename\s*=\s*'([^']+)'\s*\)\s*\}\}/g,
    '/static/$1'
  );
}

const server = http.createServer((req, res) => {
  let filePath;

  if (req.url === '/' || req.url === '/index.html') {
    // Serve the template
    filePath = path.join(__dirname, 'templates', 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      const rendered = resolveStaticUrl(data);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(rendered);
    });
    return;
  }

  // Serve static files
  if (req.url.startsWith('/static/')) {
    filePath = path.join(__dirname, req.url);
  } else {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  🎨 Sam's Portfolio is running at:\n`);
  console.log(`     http://localhost:${PORT}\n`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
