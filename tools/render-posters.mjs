// 用无头 Edge 将 compose.html 渲染为成品海报 PNG
// 输出：site/posters/<id>.png（识别图 1024x1536）与 posters/print/<id>@2x.png（印刷 2048x3072）
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ids = ['dragon', 'print', 'embroidery', 'pottery'];

mkdirSync(path.join(root, 'site', 'posters'), { recursive: true });
mkdirSync(path.join(root, 'posters', 'print'), { recursive: true });

const composeUrl = 'file:///' + path.join(root, 'tools', 'compose.html').replace(/\\/g, '/');

function shot(url, out, scale) {
  execFileSync(EDGE, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1024,1536',
    `--force-device-scale-factor=${scale}`,
    `--screenshot=${out}`,
    '--virtual-time-budget=8000',
    url,
  ], { stdio: 'pipe', timeout: 60000 });
}

for (const id of ids) {
  const url = `${composeUrl}?id=${id}`;
  const out1 = path.join(root, 'site', 'posters', `${id}.png`);
  const out2 = path.join(root, 'posters', 'print', `${id}@2x.png`);
  shot(url, out1, 1);
  shot(url, out2, 2);
  const ok1 = existsSync(out1) && statSync(out1).size > 100000;
  const ok2 = existsSync(out2) && statSync(out2).size > 100000;
  console.log(`${id}: 识别图 ${ok1 ? 'OK' : 'FAIL'} (${(statSync(out1).size / 1024).toFixed(0)}KB), 印刷版 ${ok2 ? 'OK' : 'FAIL'} (${(statSync(out2).size / 1024).toFixed(0)}KB)`);
}
console.log('done');
