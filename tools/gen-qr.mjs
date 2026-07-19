// 生成作品访问二维码（无水印）：node tools/gen-qr.mjs <URL>
import QRCode from 'qrcode';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2];
if (!url) { console.error('用法: node tools/gen-qr.mjs <作品公开访问URL>'); process.exit(1); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '提交材料');
mkdirSync(outDir, { recursive: true });

const opts = { errorCorrectionLevel: 'M', margin: 2, width: 800, color: { dark: '#0d1a30', light: '#ffffff' } };
await QRCode.toFile(path.join(outDir, '作品二维码.png'), url, opts);
await QRCode.toFile(path.join(outDir, '作品二维码.svg'), url, { ...opts, type: 'svg' });
console.log(`二维码已生成 → 提交材料/作品二维码.png|.svg\n指向: ${url}`);
