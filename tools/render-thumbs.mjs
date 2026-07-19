// 生成海报缩略图（320x480）供落地页/彩蛋使用
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ids = ['dragon', 'print', 'embroidery', 'pottery'];
mkdirSync(path.join(root, 'site', 'posters', 'thumb'), { recursive: true });
const composeUrl = 'file:///' + path.join(root, 'tools', 'compose.html').replace(/\\/g, '/');

for (const id of ids) {
  const out = path.join(root, 'site', 'posters', 'thumb', `${id}.png`);
  execFileSync(EDGE, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1024,1536', '--force-device-scale-factor=0.3125',
    `--screenshot=${out}`, '--virtual-time-budget=8000', `${composeUrl}?id=${id}`,
  ], { stdio: 'pipe', timeout: 60000 });
  console.log(`${id}: ${(statSync(out).size / 1024).toFixed(0)}KB`);
}
