// AR 场景叁：蜀绣 — 银针引线，空中绣出芙蓉花
import * as THREE from 'three';

export function createScene() {
  const group = new THREE.Group();
  group.position.set(0, 0.08, 0.16);
  group.rotation.x = -0.18;

  // 绣绷
  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.30, 0.020, 12, 48),
    new THREE.MeshStandardMaterial({ color: '#8a6238', roughness: 0.7 })
  );
  group.add(hoop);
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.03),
    new THREE.MeshStandardMaterial({ color: '#6d4a26', roughness: 0.7 }));
  knob.position.set(0, 0.315, 0);
  group.add(knob);
  const fabric = new THREE.Mesh(
    new THREE.CircleGeometry(0.295, 40),
    new THREE.MeshStandardMaterial({ color: '#f3ecd8', roughness: 0.95, side: THREE.DoubleSide })
  );
  fabric.position.z = -0.004;
  group.add(fabric);

  // ---- 生成针迹序列（芙蓉花 + 叶 + 花心） ----
  const stitches = []; // {a:Vector3, b:Vector3, color}
  const pink1 = new THREE.Color('#e58aa0'), pink2 = new THREE.Color('#f5c8d0'),
    deep = new THREE.Color('#c2455e'), green1 = new THREE.Color('#3f7d5a'), green2 = new THREE.Color('#79b48f'),
    gold = new THREE.Color('#e8b34b');
  const petalR = (a, base) => base * (0.42 + 0.58 * Math.abs(Math.cos(2.5 * a)) ** 1.4);

  // 五瓣芙蓉：径向长短针
  for (let ring = 0; ring < 2; ring++) {
    const base = ring === 0 ? 0.235 : 0.15;
    const steps = ring === 0 ? 180 : 130;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2 + ring * 0.31;
      const rOut = petalR(a + (ring ? 0.63 : 0), base) * (0.93 + Math.random() * 0.1);
      const rIn = rOut * (0.30 + Math.random() * 0.14);
      const ca = Math.cos(a), sa = Math.sin(a);
      const c = new THREE.Color().copy(ring === 0 ? pink1 : deep)
        .lerp(pink2, (i % 2) * 0.35 + Math.random() * 0.2);
      stitches.push({
        a: new THREE.Vector3(ca * rIn, sa * rIn, 0.004),
        b: new THREE.Vector3(ca * rOut, sa * rOut, 0.004),
        color: c,
      });
    }
  }
  // 两片叶（斜向缎纹）
  for (const [lx, ly, rot, len] of [[-0.20, -0.20, 0.6, 0.10], [0.21, -0.17, -0.8, 0.09]]) {
    for (let i = 0; i < 46; i++) {
      const tt = i / 46;
      const w = Math.sin(tt * Math.PI) * len * 0.62;
      const cx = lx + Math.cos(rot) * (tt - 0.5) * len * 2.1;
      const cy = ly + Math.sin(rot) * (tt - 0.5) * len * 2.1;
      const nx = -Math.sin(rot), ny = Math.cos(rot);
      stitches.push({
        a: new THREE.Vector3(cx - nx * w, cy - ny * w, 0.004),
        b: new THREE.Vector3(cx + nx * w, cy + ny * w, 0.004),
        color: new THREE.Color().copy(green1).lerp(green2, Math.random() * 0.6),
      });
    }
  }
  // 花心打籽
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.035;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    stitches.push({
      a: new THREE.Vector3(x, y, 0.004),
      b: new THREE.Vector3(x + 0.008, y + 0.008, 0.008),
      color: gold.clone(),
    });
  }
  const TOTAL = stitches.length;

  // 实例化针迹（细长盒）
  const stGeo = new THREE.BoxGeometry(1, 0.0048, 0.0034);
  const stMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 });
  const stMesh = new THREE.InstancedMesh(stGeo, stMat, TOTAL);
  stMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < TOTAL; i++) {
    stMesh.setMatrixAt(i, HIDDEN);
    stMesh.setColorAt(i, stitches[i].color);
  }
  stMesh.instanceColor.needsUpdate = true;
  group.add(stMesh);

  function placeStitch(i, k = 1) {
    const s = stitches[i];
    const mid = s.a.clone().lerp(s.b, 0.5 * k);
    const len = s.a.distanceTo(s.b) * k;
    dummy.position.copy(s.a.clone().lerp(mid, 1));
    dummy.scale.set(Math.max(len, 0.0001), 1, 1);
    dummy.lookAt(s.b.clone().add(group.position));
    // lookAt 以 -z 对齐，改为手动旋转：
    const ang = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
    dummy.rotation.set(0, 0, ang);
    dummy.updateMatrix();
    stMesh.setMatrixAt(i, dummy.matrix);
  }

  // 银针 + 引线
  const needle = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0012, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: '#cfd6e0', roughness: 0.25, metalness: 0.9 }));
  shaft.position.y = 0.07;
  needle.add(shaft);
  needle.rotation.z = -0.5;
  group.add(needle);

  const THREAD_PTS = 60;
  const thGeo = new THREE.BufferGeometry();
  const thPos = new Float32Array(THREAD_PTS * 3);
  thGeo.setAttribute('position', new THREE.BufferAttribute(thPos, 3));
  const thread = new THREE.Line(thGeo, new THREE.LineBasicMaterial({ color: '#d8506a' }));
  thread.frustumCulled = false;
  group.add(thread);

  // 光尘
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(40 * 3);
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: '#ffe9a8', size: 0.008, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  dust.frustumCulled = false;
  group.add(dust);

  let progress = 0, speedMul = 1, done = 0;

  function update(dt, t) {
    const rate = TOTAL / 34; // 基础每秒针数
    progress = Math.min(TOTAL, progress + dt * rate * speedMul);
    const n = Math.floor(progress);
    for (; done < n; done++) placeStitch(done);
    if (n < TOTAL) placeStitch(n, progress - n);
    stMesh.instanceMatrix.needsUpdate = true;

    const cur = stitches[Math.min(n, TOTAL - 1)];
    const frac = progress - n;
    const tip = cur.a.clone().lerp(cur.b, Math.min(1, frac));
    const bob = Math.sin(frac * Math.PI);
    needle.position.set(tip.x + 0.012, tip.y + 0.012, tip.z + 0.02 + 0.05 * bob);
    needle.rotation.z = -0.5 + 0.15 * Math.sin(t * 3);

    // 线迹：针眼→最近针迹回溯
    const eye = needle.position.clone();
    eye.x += Math.sin(needle.rotation.z) * -0.14;
    eye.y += Math.cos(needle.rotation.z) * 0.14;
    for (let i = 0; i < THREAD_PTS; i++) {
      const back = Math.min(TOTAL - 1, Math.max(0, n - Math.floor(i / 2)));
      const p = i === 0 ? eye : (i === 1 ? tip : stitches[back][(i % 2) ? 'a' : 'b']);
      const sway = i < 2 ? 0 : 0.004 * Math.sin(t * 2 + i * 0.6);
      thPos[i * 3] = p.x + sway;
      thPos[i * 3 + 1] = p.y + sway * 0.6;
      thPos[i * 3 + 2] = p.z + (i < 2 ? 0 : 0.002);
    }
    thGeo.attributes.position.needsUpdate = true;

    for (let i = 0; i < 40; i++) {
      const a = t * 0.8 + i * 1.7;
      dustPos[i * 3] = tip.x + Math.cos(a) * 0.03 * (1 + (i % 5));
      dustPos[i * 3 + 1] = tip.y + Math.sin(a * 1.3) * 0.03 * (1 + (i % 4));
      dustPos[i * 3 + 2] = 0.02 + 0.02 * Math.sin(a * 2);
    }
    dustGeo.attributes.position.needsUpdate = true;

    if (progress >= TOTAL) {
      group.rotation.y = Math.sin(t * 0.7) * 0.16; // 完成后轻转展示
      if ((t % 40) < 0.02 && speedMul !== 0) { /* noop */ }
    }
    if (speedMul > 1) speedMul = Math.max(1, speedMul - dt * 1.2);
  }

  return {
    group, update,
    onFound() {},
    onLost() {},
    onTap() {
      if (progress >= TOTAL) { // 重绣
        progress = 0; done = 0;
        for (let i = 0; i < TOTAL; i++) stMesh.setMatrixAt(i, HIDDEN);
        stMesh.instanceMatrix.needsUpdate = true;
        group.rotation.y = 0;
      } else speedMul = 5;
    },
  };
}
