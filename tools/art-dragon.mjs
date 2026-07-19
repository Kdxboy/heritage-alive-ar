// 海报壹《龙》— 铜梁龙舞：夜空巨龙 + 火龙钢花
import { mulberry32, fmt, sampleSpline, ribbonPath, smoothPath, polyPath, sparkle, cloudSpiral, scatter } from './svg-helpers.mjs';

export function artDragon(R) {
  const rng = mulberry32(20260720);
  const { x, y, w, h } = R; // 艺术区矩形
  let defs = `
  <radialGradient id="dNight" cx="42%" cy="30%" r="95%">
    <stop offset="0%" stop-color="#1d3157"/><stop offset="55%" stop-color="#12224275"/><stop offset="100%" stop-color="#0a1526"/>
  </radialGradient>
  <linearGradient id="dBody" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f2c14e"/><stop offset="55%" stop-color="#e08a3c"/><stop offset="100%" stop-color="#c2452f"/>
  </linearGradient>
  <radialGradient id="dPearl" cx="50%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#fff3cf"/><stop offset="55%" stop-color="#ffd873"/><stop offset="100%" stop-color="#e0762f"/>
  </radialGradient>
  <radialGradient id="dGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#ffd873" stop-opacity="0.55"/><stop offset="100%" stop-color="#ffd873" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="dMoon" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#e8eefb" stop-opacity="0.9"/><stop offset="78%" stop-color="#cdd9f0" stop-opacity="0.75"/><stop offset="100%" stop-color="#b9c9e8" stop-opacity="0.55"/>
  </radialGradient>`;

  // 修正 dNight 中间 stop 的透明写法
  defs = defs.replace('#12224275', '#122242');

  let b = '';
  // 夜空底
  b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dNight)"/>`;
  // 月亮
  b += `<circle cx="${x + w * 0.76}" cy="${y + h * 0.30}" r="170" fill="url(#dMoon)"/>`;
  // 祥云（螺旋 + 尾迹）
  const clouds = [[0.14, 0.10, 66], [0.86, 0.07, 52], [0.30, 0.26, 44], [0.68, 0.50, 58], [0.12, 0.55, 50], [0.88, 0.36, 40]];
  for (const [fx, fy, r] of clouds) {
    const cx = x + w * fx, cy = y + h * fy;
    b += cloudSpiral(cx, cy, r, 2.2, '#4a6db3', 5, 0.5);
    b += cloudSpiral(cx + r * 1.15, cy + r * 0.30, r * 0.55, 2, '#4a6db3', 4, 0.42);
    b += `<path d="M${fmt(cx - r * 1.2)},${fmt(cy + r * 0.75)} q ${fmt(r * 1.6)},26 ${fmt(r * 3.1)},0" stroke="#4a6db3" stroke-width="4.5" fill="none" opacity="0.42" stroke-linecap="round"/>`;
  }
  // 星子
  b += scatter(rng, x + 10, y + 10, w - 20, h * 0.55, 46, (px, py) =>
    `<circle cx="${fmt(px)}" cy="${fmt(py)}" r="${fmt(0.8 + rng() * 1.8)}" fill="#cdd9f0" opacity="${fmt(0.25 + rng() * 0.5)}"/>`);

  // ---- 龙身 ----
  const spine = [
    { x: x + w * 0.90, y: y + h * 0.13 }, { x: x + w * 0.66, y: y + h * 0.085 },
    { x: x + w * 0.42, y: y + h * 0.16 }, { x: x + w * 0.295, y: y + h * 0.33 },
    { x: x + w * 0.36, y: y + h * 0.505 }, { x: x + w * 0.57, y: y + h * 0.565 },
    { x: x + w * 0.775, y: y + h * 0.665 }, { x: x + w * 0.70, y: y + h * 0.825 },
    { x: x + w * 0.475, y: y + h * 0.855 },
  ];
  const S = sampleSpline(spine, 26);
  const widthFn = (t) => 12 + 96 * Math.sin(Math.min(1, t * 1.12) * Math.PI) ** 0.72 * (1 - t * 0.32);

  // 背鳍（先画，被身体覆盖根部）
  let fins = '';
  for (let i = 6; i < S.length - 12; i += 7) {
    const s = S[i], wl = widthFn(i / (S.length - 1)) / 2;
    const hgt = 16 + 13 * Math.sin(i * 0.9) ** 2 + rng() * 5;
    const bx = s.x + s.nx * wl, by = s.y + s.ny * wl;
    const tipx = s.x + s.nx * (wl + hgt) - s.tx * 6, tipy = s.y + s.ny * (wl + hgt) - s.ty * 6;
    const b2x = s.x + s.nx * wl + s.tx * 13, b2y = s.y + s.ny * wl + s.ty * 13;
    fins += `<path d="M${fmt(bx)},${fmt(by)} Q${fmt(tipx)},${fmt(tipy)} ${fmt(b2x)},${fmt(b2y)} Z" fill="#f0c060" stroke="#8a1f14" stroke-width="2"/>`;
  }
  b += fins;

  // 身体
  b += `<path d="${ribbonPath(S, (t) => widthFn(t))}" fill="url(#dBody)" stroke="#8a1f14" stroke-width="4"/>`;

  // 节段横纹 + 鳞片
  let seg = '', scales = '';
  for (let i = 4; i < S.length - 6; i += 6) {
    const s = S[i], wl = widthFn(i / (S.length - 1)) / 2;
    seg += `<path d="M${fmt(s.x + s.nx * wl)},${fmt(s.y + s.ny * wl)} Q${fmt(s.x - s.tx * wl * 0.45)},${fmt(s.y - s.ty * wl * 0.45)} ${fmt(s.x - s.nx * wl)},${fmt(s.y - s.ny * wl)}"/>`;
  }
  b += `<g fill="none" stroke="#a83420" stroke-width="2.6" opacity="0.85">${seg}</g>`;
  for (let i = 6; i < S.length - 8; i += 3) {
    const s = S[i], wl = widthFn(i / (S.length - 1)) / 2;
    for (let k = -1; k <= 1; k++) {
      const off = k * wl * 0.5 + ((i % 6) ? wl * 0.24 : 0);
      if (Math.abs(off) > wl * 0.8) continue;
      const px = s.x + s.nx * off, py = s.y + s.ny * off, r = wl * 0.30;
      scales += `<path d="M${fmt(px - s.tx * r)},${fmt(py - s.ty * r)} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(px + s.tx * r)},${fmt(py + s.ty * r)}"/>`;
    }
  }
  b += `<g fill="none" stroke="#a83420" stroke-width="1.8" opacity="0.55">${scales}</g>`;
  // 腹部亮带
  let belly = [];
  for (let i = 2; i < S.length - 4; i += 2) {
    const s = S[i], wl = widthFn(i / (S.length - 1)) / 2;
    belly.push({ x: s.x - s.nx * wl * 0.62, y: s.y - s.ny * wl * 0.62 });
  }
  b += `<path d="${smoothPath(belly)}" fill="none" stroke="#f7dd9b" stroke-width="7" opacity="0.5" stroke-linecap="round"/>`;

  // 尾鳍
  const t0 = S[2];
  b += `<g transform="translate(${fmt(S[0].x)},${fmt(S[0].y)}) rotate(${fmt(Math.atan2(-t0.ty, -t0.tx) * 180 / Math.PI)})">
    <path d="M0,0 C34,-30 66,-38 96,-24 C74,-14 72,-4 88,6 C64,10 60,18 70,34 C44,34 18,20 0,0 Z" fill="#f0c060" stroke="#8a1f14" stroke-width="3"/>
    <path d="M8,-2 C36,-18 62,-24 84,-20 M10,4 C38,2 58,6 74,14" stroke="#c2452f" stroke-width="2.4" fill="none"/></g>`;

  // ---- 龙头 ----
  const E = S[S.length - 1];
  const ang = Math.atan2(E.ty, E.tx) * 180 / Math.PI;
  b += `<g transform="translate(${fmt(E.x)},${fmt(E.y)}) rotate(${fmt(ang)})">
    <path d="M-30,-58 C-52,-88 -84,-96 -118,-88 C-96,-72 -92,-58 -100,-40 C-80,-46 -60,-42 -46,-30 Z" fill="#c2452f" stroke="#8a1f14" stroke-width="3"/>
    <path d="M-20,-52 C-46,-74 -74,-80 -102,-72" stroke="#f0c060" stroke-width="3" fill="none"/>
    <path d="M-6,-52 C-4,-84 10,-108 34,-118 C28,-96 34,-84 48,-78 C36,-64 24,-56 12,-50 Z" fill="#e08a3c" stroke="#8a1f14" stroke-width="3"/>
    <path d="M16,-46 C26,-72 46,-88 72,-90 C60,-74 60,-64 68,-54 C50,-50 34,-46 24,-40 Z" fill="#e08a3c" stroke="#8a1f14" stroke-width="3"/>
    <path d="M96,-16 C110,-26 116,-38 112,-50 C126,-44 132,-30 128,-14 C138,-12 144,-6 146,4 L96,10 Z" fill="#c2452f" stroke="#8a1f14" stroke-width="3"/>
    <path d="M-44,-34 C-16,-52 30,-56 66,-44 C92,-36 106,-26 112,-12 C118,2 112,14 98,20 L-30,34 C-46,26 -52,10 -50,-8 C-49,-20 -47,-28 -44,-34 Z" fill="url(#dBody)" stroke="#8a1f14" stroke-width="4"/>
    <path d="M98,20 C82,34 58,40 34,38 L-2,52 C10,38 18,30 30,26 Z" fill="#c2452f" stroke="#8a1f14" stroke-width="3"/>
    <path d="M34,38 L44,52 L56,36 L70,46 L78,30 L92,34 L98,20" fill="#fdf6e3" stroke="#8a1f14" stroke-width="2"/>
    <circle cx="34" cy="-16" r="15" fill="#fdf6e3" stroke="#8a1f14" stroke-width="3"/>
    <circle cx="37" cy="-14" r="7.5" fill="#1a1a1a"/><circle cx="40" cy="-17" r="2.6" fill="#ffffff"/>
    <path d="M18,-30 C30,-40 48,-42 60,-34" stroke="#8a1f14" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M112,-12 C132,-16 148,-10 156,4" stroke="#e8b34b" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M118,0 C142,4 158,16 162,34 M112,8 C130,18 138,32 138,50" stroke="#e8b34b" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M-30,-30 C-58,-38 -78,-30 -92,-12 C-70,-14 -58,-6 -52,6 C-64,10 -70,20 -70,32 C-52,26 -38,28 -28,36" fill="#e08a3c" stroke="#8a1f14" stroke-width="3"/>
  </g>`;

  // 龙珠
  const pearl = { x: E.x - 190, y: E.y - 60 };
  b += `<circle cx="${fmt(pearl.x)}" cy="${fmt(pearl.y)}" r="105" fill="url(#dGlow)"/>`;
  b += `<circle cx="${fmt(pearl.x)}" cy="${fmt(pearl.y)}" r="40" fill="url(#dPearl)" stroke="#8a1f14" stroke-width="3"/>`;
  b += `<path d="M${fmt(pearl.x - 20)},${fmt(pearl.y - 32)} q -34,10 -30,44" stroke="#fff3cf" stroke-width="5" fill="none" opacity="0.8" stroke-linecap="round"/>`;
  for (let i = 0; i < 7; i++) {
    const a = -0.6 + i * 0.9;
    const fx = pearl.x + Math.cos(a) * 52, fy = pearl.y + Math.sin(a) * 52;
    b += `<path d="M${fmt(fx)},${fmt(fy)} q ${fmt(Math.cos(a) * 26 - 8)},${fmt(Math.sin(a) * 26 - 8)} ${fmt(Math.cos(a + 0.5) * 40)},${fmt(Math.sin(a + 0.5) * 40)}" stroke="#e8b34b" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  }

  // ---- 火龙钢花 ----
  const emitters = [[x + w * 0.16, y + h * 0.985], [x + w * 0.62, y + h * 0.995]];
  let spark1 = '', spark2 = '', tips = '';
  for (const [ex, ey] of emitters) {
    for (let k = 0; k < 34; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 2.1;
      const v = 190 + rng() * 330;
      const pts = [];
      for (let s = 0; s <= 10; s++) {
        const t = s / 10;
        pts.push({ x: ex + Math.cos(a) * v * t, y: ey + Math.sin(a) * v * t + 340 * t * t });
      }
      const d = smoothPath(pts);
      spark1 += `<path d="${d}"/>`;
      if (k % 2 === 0) spark2 += `<path d="${d}"/>`;
      const last = pts[pts.length - 1];
      if (last.y < y + h - 6 && last.x > x + 6 && last.x < x + w - 6 && rng() > 0.35)
        tips += sparkle(last.x, last.y, 5 + rng() * 8, '#ffe9a8', 0.9);
    }
    b += `<ellipse cx="${fmt(ex)}" cy="${fmt(ey)}" rx="56" ry="16" fill="#ffd873" opacity="0.85"/>`;
    b += `<ellipse cx="${fmt(ex)}" cy="${fmt(ey)}" rx="26" ry="8" fill="#fff3cf"/>`;
  }
  b += `<g stroke="#e0762f" stroke-width="2.6" fill="none" opacity="0.6" stroke-linecap="round">${spark1}</g>`;
  b += `<g stroke="#ffd873" stroke-width="1.4" fill="none" opacity="0.9" stroke-linecap="round">${spark2}</g>`;
  b += tips;

  // 舞龙人剪影（两位，执杆）
  const polePts = [S[Math.floor(S.length * 0.62)], S[Math.floor(S.length * 0.86)]];
  polePts.forEach((p, i) => {
    const gx = x + w * (i === 0 ? 0.86 : 0.42), gy = y + h * 0.975;
    b += `<line x1="${fmt(p.x)}" y1="${fmt(p.y)}" x2="${fmt(gx)}" y2="${fmt(gy - 46)}" stroke="#0d1a30" stroke-width="7" stroke-linecap="round"/>`;
    b += `<g fill="#0d1a30"><circle cx="${fmt(gx)}" cy="${fmt(gy - 58)}" r="13"/>
      <path d="M${fmt(gx - 15)},${fmt(gy - 46)} C${fmt(gx - 20)},${fmt(gy - 20)} ${fmt(gx - 16)},${fmt(gy - 6)} ${fmt(gx - 12)},${fmt(gy)} L${fmt(gx + 13)},${fmt(gy)} C${fmt(gx + 17)},${fmt(gy - 16)} ${fmt(gx + 16)},${fmt(gy - 34)} ${fmt(gx + 12)},${fmt(gy - 47)} Z"/>
      <path d="M${fmt(gx + 8)},${fmt(gy - 42)} L${fmt(gx + 30)},${fmt(gy - 66)} M${fmt(gx - 10)},${fmt(gy - 40)} L${fmt(gx - 30)},${fmt(gy - 58)}" stroke="#0d1a30" stroke-width="9" stroke-linecap="round"/></g>`;
  });

  return { defs, body: b };
}
