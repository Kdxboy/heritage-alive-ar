// AR 场景贰：梁平木版年画 — "一画多版"套色拍印演示
import * as THREE from 'three';

const PASSES = [
  { name: '墨线版', color: '#2b1c08' },
  { name: '朱红版', color: '#c2452f' },
  { name: '藤黄版', color: '#e8b34b' },
  { name: '翠绿版', color: '#3f7d5a' },
  { name: '青蓝版', color: '#2f5fa5' },
];

// 在 2D canvas 上绘制"鲤鱼跃莲"某一分版（pass: 0 线版 / 1 红 / 2 黄 / 3 绿 / 4 蓝）
function drawPass(ctx, W, H, pass) {
  const line = pass === 0;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  const u = W / 400; // 归一化
  ctx.lineWidth = 7 * u;
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.strokeStyle = PASSES[0].color;

  const fishBody = () => {
    ctx.beginPath();
    ctx.moveTo(-95 * u, 55 * u);
    ctx.bezierCurveTo(-70 * u, -60 * u, 40 * u, -105 * u, 95 * u, -55 * u);
    ctx.bezierCurveTo(75 * u, -10 * u, 30 * u, 55 * u, -35 * u, 85 * u);
    ctx.bezierCurveTo(-65 * u, 92 * u, -90 * u, 80 * u, -95 * u, 55 * u);
    ctx.closePath();
  };
  const tail = () => {
    ctx.beginPath();
    ctx.moveTo(88 * u, -60 * u);
    ctx.quadraticCurveTo(150 * u, -95 * u, 158 * u, -140 * u);
    ctx.quadraticCurveTo(120 * u, -120 * u, 96 * u, -122 * u);
    ctx.quadraticCurveTo(120 * u, -95 * u, 88 * u, -60 * u);
    ctx.closePath();
  };
  const fin = () => {
    ctx.beginPath();
    ctx.moveTo(-25 * u, 10 * u);
    ctx.quadraticCurveTo(-5 * u, 45 * u, -45 * u, 70 * u);
    ctx.quadraticCurveTo(-45 * u, 38 * u, -25 * u, 10 * u);
    ctx.closePath();
  };
  const sun = () => { ctx.beginPath(); ctx.arc(-70 * u, -95 * u, 48 * u, 0, Math.PI * 2); };
  const lotusLeaf = (x, y, r, rot) => {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = rot + (i / 24) * Math.PI * 2;
      const rr = r * (1 + 0.10 * Math.sin(a * 6));
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.55;
      i ? ctx.lineTo(px * u, py * u) : ctx.moveTo(px * u, py * u);
    }
    ctx.closePath();
  };
  const lotusFlower = (x, y, s) => {
    ctx.beginPath();
    for (let p = 0; p < 5; p++) {
      const a = -Math.PI / 2 + (p - 2) * 0.5;
      ctx.ellipse(x * u + Math.cos(a) * 16 * s * u, y * u + Math.sin(a) * 20 * s * u,
        13 * s * u, 26 * s * u, a + Math.PI / 2, 0, Math.PI * 2);
    }
  };
  const waves = () => {
    ctx.beginPath();
    for (let row = 0; row < 3; row++) {
      const y = (110 + row * 26) * u;
      for (let k = -4; k < 4; k++) {
        ctx.moveTo(k * 50 * u + 40 * u, y);
        ctx.arc(k * 50 * u + 20 * u, y, 20 * u, 0, Math.PI, true);
      }
    }
  };
  const scales = () => {
    ctx.beginPath();
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
      const x = (-60 + k * 26 + (r % 2) * 13) * u, y = (-30 + r * 24) * u;
      ctx.moveTo(x + 10 * u, y);
      ctx.arc(x, y, 10 * u, 0, Math.PI, false);
    }
  };

  if (pass === 2) { ctx.fillStyle = PASSES[2].color; sun(); ctx.fill(); }
  if (pass === 1) { ctx.fillStyle = PASSES[1].color; fishBody(); ctx.fill(); tail(); ctx.fill(); fin(); ctx.fill(); }
  if (pass === 3) {
    ctx.fillStyle = PASSES[3].color;
    lotusLeaf(-95, 135, 55, 0.3); ctx.fill();
    lotusLeaf(95, 150, 45, 1.2); ctx.fill();
  }
  if (pass === 4) {
    ctx.fillStyle = PASSES[4].color; waves(); ctx.lineWidth = 8 * u; ctx.strokeStyle = PASSES[4].color; ctx.stroke();
    ctx.fillStyle = '#d87c8a'; lotusFlower(0, 128, 1); ctx.fill(); // 荷花随蓝版点染
  }
  if (line) {
    fishBody(); ctx.stroke();
    tail(); ctx.stroke();
    fin(); ctx.stroke();
    scales(); ctx.lineWidth = 4 * u; ctx.stroke();
    ctx.lineWidth = 7 * u;
    sun(); ctx.stroke();
    lotusLeaf(-95, 135, 55, 0.3); ctx.stroke();
    lotusLeaf(95, 150, 45, 1.2); ctx.stroke();
    lotusFlower(0, 128, 1); ctx.stroke();
    // 鱼眼
    ctx.beginPath(); ctx.arc(-62 * u, -12 * u, 13 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(-60 * u, -10 * u, 6 * u, 0, Math.PI * 2); ctx.fillStyle = PASSES[0].color; ctx.fill();
    waves(); ctx.lineWidth = 5 * u; ctx.stroke();
  }
  ctx.restore();
}

export function createScene() {
  const group = new THREE.Group();
  group.position.set(0, 0.05, 0);

  // 纸面（累积成画）
  const W = 512, H = 640;
  const paperCv = document.createElement('canvas');
  paperCv.width = W; paperCv.height = H;
  const pctx = paperCv.getContext('2d');
  const paperTex = new THREE.CanvasTexture(paperCv);
  paperTex.colorSpace = THREE.SRGBColorSpace;
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.65),
    new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9 })
  );
  paper.position.set(0, 0.16, 0.02);
  group.add(paper);

  function resetPaper() {
    pctx.fillStyle = '#f2e6c8';
    pctx.fillRect(0, 0, W, H);
    pctx.fillStyle = 'rgba(160,130,80,.08)';
    for (let i = 0; i < 500; i++) pctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    paperTex.needsUpdate = true;
  }
  resetPaper();

  // 五块雕版
  const blocks = [];
  const woodMat = new THREE.MeshStandardMaterial({ color: '#6d4a26', roughness: 0.85 });
  for (let i = 0; i < 5; i++) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 320;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#7d5730'; c2.fillRect(0, 0, 256, 320);
    c2.strokeStyle = 'rgba(0,0,0,.25)';
    for (let k = 0; k < 12; k++) { c2.beginPath(); c2.moveTo(0, k * 28 + Math.random() * 8); c2.bezierCurveTo(80, k * 28 + 6, 180, k * 28 - 6, 256, k * 28 + Math.random() * 8); c2.stroke(); }
    c2.save(); c2.scale(0.5, 0.5); drawPass(c2, 512, 640, i); c2.restore();
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
    const mats = [woodMat, woodMat, woodMat, woodMat, faceMat, woodMat];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.275, 0.03), mats);
    const ang = -1.5 + i * 0.75;
    mesh.userData.park = new THREE.Vector3(Math.sin(ang) * 0.42, -0.42 - 0.10 * Math.cos(ang), 0.12 + 0.02 * i);
    mesh.userData.parkRot = new THREE.Euler(-0.35, -ang * 0.25, ang * 0.10);
    mesh.position.copy(mesh.userData.park);
    mesh.rotation.copy(mesh.userData.parkRot);
    group.add(mesh);
    blocks.push(mesh);
  }

  // 状态机：idle→(每版: fly 0.9s → press 0.35s → back 0.9s)→hold→reset
  // 拍印次序：先套色（黄→红→绿→蓝）最后墨线定形，符合梁平年画工艺
  const ORDER = [2, 1, 3, 4, 0];
  let phase = 'fly', idx = 0, ph = 0, holdT = 0;
  const ease = (x) => x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
  const overPos = new THREE.Vector3(0, 0.16, 0.10);

  function stampToPaper(i) {
    drawPass(pctx, W, H, i);
    paperTex.needsUpdate = true;
  }

  function update(dt, t) {
    const curBlock = ORDER[idx];
    blocks.forEach((bl, i) => {
      if (i !== curBlock || phase === 'hold') {
        bl.position.lerp(bl.userData.park, 0.08);
        bl.position.y += Math.sin(t * 2 + i) * 0.0006;
      }
    });
    const bl = blocks[curBlock];
    if (phase === 'fly') {
      ph += dt / 0.9;
      const k = ease(Math.min(1, ph));
      bl.position.lerpVectors(bl.userData.park, overPos, k);
      bl.rotation.set(
        bl.userData.parkRot.x * (1 - k), bl.userData.parkRot.y * (1 - k), bl.userData.parkRot.z * (1 - k));
      if (ph >= 1) { phase = 'press'; ph = 0; }
    } else if (phase === 'press') {
      ph += dt / 0.35;
      const k = Math.min(1, ph);
      const z = 0.10 - 0.062 * (k < 0.6 ? ease(k / 0.6) : 1 - ease((k - 0.6) / 0.4) * 0.3);
      bl.position.set(0, 0.16, z);
      if (k >= 0.6 && !bl.userData.stamped) { bl.userData.stamped = true; stampToPaper(ORDER[idx]); }
      if (ph >= 1) { phase = 'back'; ph = 0; }
    } else if (phase === 'back') {
      ph += dt / 0.9;
      const k = ease(Math.min(1, ph));
      bl.position.lerpVectors(overPos, bl.userData.park, k);
      bl.rotation.set(bl.userData.parkRot.x * k, bl.userData.parkRot.y * k, bl.userData.parkRot.z * k);
      if (ph >= 1) {
        bl.userData.stamped = false;
        idx++;
        if (idx >= 5) { phase = 'hold'; holdT = 0; idx = 0; }
        else { phase = 'fly'; ph = 0; }
      }
    } else if (phase === 'hold') {
      holdT += dt;
      paper.position.z = 0.02 + 0.008 * Math.sin(t * 1.6);
      if (holdT > 3.5) { resetPaper(); phase = 'fly'; ph = 0; }
    }
  }

  return {
    group, update,
    onFound() {},
    onLost() {},
    onTap() { // 快进当前版
      if (phase === 'hold') { resetPaper(); phase = 'fly'; ph = 0; }
      else if (phase === 'fly') { ph = 1; }
      else if (phase === 'press' && ph < 0.6) { ph = 0.6; }
    },
  };
}
