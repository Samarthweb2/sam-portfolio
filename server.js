/**
 * Simple dev server for Sam's Portfolio
 * Serves static files, renders index.html, and provides live GitHub contributions API.
 */

const http = require('http');
const https = require('https');
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
  return template.replace(
    /\{\{\s*url_for\s*\(\s*'static'\s*,\s*filename\s*=\s*'([^']+)'\s*\)\s*\}\}/g,
    '/static/$1'
  );
}

// In-memory cache for GitHub contributions
let ghCache = null;
let ghCacheTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function fetchGitHubContributions(username, callback) {
  const now = Date.now();
  if (ghCache && (now - ghCacheTime < CACHE_DURATION)) {
    return callback(null, ghCache);
  }

  const url = `https://github.com/users/${username}/contributions`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      const countMatch = html.match(/([0-9,]+)\s+contributions/i);
      const total = countMatch ? countMatch[1] : '92';

      const tdRegex = /<td[^>]*data-date="([^"]+)"[^>]*data-level="([0-9])"[^>]*>([\s\S]*?)<\/td>/g;
      let match;
      const days = [];
      while ((match = tdRegex.exec(html)) !== null) {
        const date = match[1];
        const level = parseInt(match[2], 10);
        const textMatch = match[3].match(/([0-9]+)\s+contribution/i);
        const count = textMatch ? parseInt(textMatch[1], 10) : (level > 0 ? level : 0);
        days.push({ date, level, count });
      }

      ghCache = { username, total, days };
      ghCacheTime = now;
      callback(null, ghCache);
    });
  }).on('error', (err) => {
    if (ghCache) return callback(null, ghCache);
    callback(err);
  });
}

const server = http.createServer((req, res) => {
  // Live GitHub Contributions API
  if (req.url === '/api/github-contributions' || req.url.startsWith('/api/github-contributions?')) {
    fetchGitHubContributions('SamarthWeb2', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to fetch GitHub data' }));
      }
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(data));
    });
    return;
  }

  // Home page template
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'templates', 'index.html');
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
    const filePath = path.join(__dirname, req.url);
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
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n  🎨 Sam's Portfolio is running at:\n`);
  console.log(`     http://localhost:${PORT}\n`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
