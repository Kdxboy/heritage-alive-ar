// 启动本地服务器 + 无头 Edge，编译 site/targets/targets.mind
import { spawn } from 'node:child_process';
import { existsSync, statSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 8177;
const H = process.argv[2] || '1024';
const OUT_REL = process.argv[3] || 'site/targets/targets.mind';
const out = path.join(root, ...OUT_REL.split('/'));
if (existsSync(out)) rmSync(out);

const server = spawn(process.execPath, [path.join(root, 'tools', 'serve.mjs'), String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
server.stdout.on('data', (d) => process.stdout.write(d));
server.stderr.on('data', (d) => process.stderr.write(d));
await new Promise((r) => setTimeout(r, 800));

const profile = path.join(process.env.TEMP || '.', 'edge-mind-compile-profile');
const edge = spawn(EDGE, [
  '--headless=new', '--no-first-run', '--mute-audio',
  `--user-data-dir=${profile}`,
  '--window-size=1200,900',
  `http://localhost:${PORT}/tools/compile.html?h=${H}&out=${encodeURIComponent(OUT_REL)}`,
], { stdio: 'ignore' });

const deadline = Date.now() + 9 * 60 * 1000;
let ok = false;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 2000));
  if (existsSync(out) && statSync(out).size > 10000) { ok = true; break; }
}
await new Promise((r) => setTimeout(r, 1000));
edge.kill();
server.kill();
if (ok) {
  console.log(`\ntargets.mind OK: ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
  process.exit(0);
} else {
  console.error('\ncompile FAILED (timeout)');
  process.exit(1);
}
