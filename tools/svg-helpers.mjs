// 通用 SVG 程序化绘制工具函数

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const fmt = (n) => (Math.round(n * 100) / 100).toString();

// Catmull-Rom 样条采样：输入控制点数组，输出等参数间隔采样点（带切线）
export function sampleSpline(points, samplesPerSeg = 24) {
  const out = [];
  const P = points;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < samplesPerSeg; j++) {
      const t = j / samplesPerSeg, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      const dx = 0.5 * ((-p0.x + p2.x) + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);
      const dy = 0.5 * ((-p0.y + p2.y) + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);
      const len = Math.hypot(dx, dy) || 1;
      out.push({ x, y, tx: dx / len, ty: dy / len, nx: -dy / len, ny: dx / len });
    }
  }
  out.push({ ...P[P.length - 1], ...out[out.length - 1] ? { tx: out[out.length - 1].tx, ty: out[out.length - 1].ty, nx: out[out.length - 1].nx, ny: out[out.length - 1].ny } : { tx: 1, ty: 0, nx: 0, ny: 1 } });
  return out;
}

// 由中心线采样点 + 宽度函数生成封闭带状路径（如龙身、鱼身）
export function ribbonPath(samples, widthFn) {
  const top = [], bot = [];
  samples.forEach((s, i) => {
    const w = widthFn(i / (samples.length - 1)) / 2;
    top.push(`${fmt(s.x + s.nx * w)},${fmt(s.y + s.ny * w)}`);
    bot.push(`${fmt(s.x - s.nx * w)},${fmt(s.y - s.ny * w)}`);
  });
  return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
}

export function polyPath(pts, close = false) {
  return `M${pts.map(p => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}${close ? ' Z' : ''}`;
}

// 平滑曲线路径（经过所有点）
export function smoothPath(pts, close = false) {
  if (pts.length < 3) return polyPath(pts, close);
  let d = `M${fmt(pts[0].x)},${fmt(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${fmt(pts[i].x)},${fmt(pts[i].y)} ${fmt(mx)},${fmt(my)}`;
  }
  d += ` L${fmt(pts[pts.length - 1].x)},${fmt(pts[pts.length - 1].y)}`;
  if (close) d += ' Z';
  return d;
}

// 在剪切区域内以给定角度填充平行线（模拟绣线/刻线肌理）
export function hatch(x, y, w, h, angle, spacing, stroke, strokeWidth, opacity, rng, jitter = 0) {
  const cx = x + w / 2, cy = y + h / 2;
  const diag = Math.hypot(w, h);
  let lines = '';
  for (let d = -diag / 2; d <= diag / 2; d += spacing) {
    const j = jitter ? (rng() - 0.5) * jitter : 0;
    lines += `<line x1="${fmt(-diag / 2)}" y1="${fmt(d + j)}" x2="${fmt(diag / 2)}" y2="${fmt(d + j)}"/>`;
  }
  return `<g transform="translate(${fmt(cx)},${fmt(cy)}) rotate(${angle})" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}">${lines}</g>`;
}

// 竖排文字（逐字下排）
export function vtext(x, y, text, size, fill, family, letterSpacing = 1.15, extra = '') {
  let out = `<text x="${fmt(x)}" y="${fmt(y)}" font-size="${size}" fill="${fill}" font-family="${family}" text-anchor="middle" ${extra}>`;
  let cy = y;
  for (const ch of text) {
    out += `<tspan x="${fmt(x)}" y="${fmt(cy)}">${ch}</tspan>`;
    cy += size * letterSpacing;
  }
  return out + '</text>';
}

// 星点/颗粒散布
export function scatter(rng, x, y, w, h, n, fn) {
  let out = '';
  for (let i = 0; i < n; i++) out += fn(x + rng() * w, y + rng() * h, i);
  return out;
}

// 四芒星光点
export function sparkle(x, y, r, fill, opacity = 1) {
  return `<path d="M${fmt(x)},${fmt(y - r)} Q${fmt(x + r * 0.12)},${fmt(y - r * 0.12)} ${fmt(x + r)},${fmt(y)} Q${fmt(x + r * 0.12)},${fmt(y + r * 0.12)} ${fmt(x)},${fmt(y + r)} Q${fmt(x - r * 0.12)},${fmt(y + r * 0.12)} ${fmt(x - r)},${fmt(y)} Q${fmt(x - r * 0.12)},${fmt(y - r * 0.12)} ${fmt(x)},${fmt(y - r)} Z" fill="${fill}" opacity="${fmt(opacity)}"/>`;
}

// 祥云螺旋
export function cloudSpiral(cx, cy, r0, turns, stroke, sw, opacity) {
  const pts = [];
  const steps = Math.floor(turns * 36);
  for (let i = 0; i <= steps; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r = r0 * (1 - i / (steps + 8));
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82 });
  }
  return `<path d="${smoothPath(pts)}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}" stroke-linecap="round"/>`;
}
