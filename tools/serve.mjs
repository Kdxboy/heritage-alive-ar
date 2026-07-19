// 本地静态服务器：服务项目根目录 + POST /__save 落盘（供无头编译回传 targets.mind）
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || 8177);
const docRoot = process.argv[3] ? path.resolve(root, process.argv[3]) : root;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.mind': 'application/octet-stream', '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm', '.ico': 'image/x-icon',
};

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (req.method === 'POST' && url.pathname === '/__save') {
      const rel = url.searchParams.get('path') || '';
      const target = path.resolve(root, rel);
      if (!target.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
      const chunks = [];
      for await (const c of req) chunks.push(c);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, Buffer.concat(chunks));
      console.log(`[save] ${rel} (${Buffer.concat(chunks).length} bytes)`);
      res.writeHead(200); return res.end('ok');
    }
    if (req.method === 'POST' && url.pathname === '/__log') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      console.log(`[page] ${Buffer.concat(chunks).toString()}`);
      res.writeHead(200); return res.end('ok');
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(docRoot, '.' + rel);
    if (!file.startsWith(docRoot) && !file.startsWith(root)) { res.writeHead(403); return res.end(); }
    let buf;
    try { buf = await readFile(file); }
    catch { // 回退到项目根（便于 site/ 下页面引用 node_modules）
      try { buf = await readFile(path.resolve(root, '.' + rel)); }
      catch { res.writeHead(404); return res.end('not found: ' + rel); }
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}).listen(port, () => console.log(`serving ${docRoot} on http://localhost:${port}`));
