// AR 场景肆：荣昌陶 — 拉坯成型 → 朱砂挂釉 → 窑变烧成
import * as THREE from 'three';

// 三种器型轮廓（自下而上 12 个半径，单位相对高度 0.40）
const PROFILES = [
  [0.10, 0.14, 0.165, 0.175, 0.170, 0.155, 0.130, 0.100, 0.072, 0.060, 0.068, 0.082], // 梅瓶
  [0.11, 0.15, 0.175, 0.185, 0.185, 0.175, 0.160, 0.140, 0.125, 0.120, 0.128, 0.120], // 泡菜坛
  [0.09, 0.12, 0.14, 0.15, 0.145, 0.13, 0.105, 0.075, 0.052, 0.046, 0.05, 0.115],     // 长颈瓶
];
const LUMP = [0.16, 0.185, 0.19, 0.18, 0.16, 0.13, 0.10, 0.07, 0.045, 0.02, 0.008, 0.002];
const HEIGHT = 0.40, ROWS = 12, SEGS = 36;

function buildGrid() {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array(ROWS * (SEGS + 1) * 3);
  const uvs = new Float32Array(ROWS * (SEGS + 1) * 2);
  const idx = [];
  for (let r = 0; r < ROWS - 1; r++) for (let s = 0; s < SEGS; s++) {
    const a = r * (SEGS + 1) + s;
    idx.push(a, a + 1, a + SEGS + 1, a + 1, a + SEGS + 2, a + SEGS + 1);
  }
  for (let r = 0; r < ROWS; r++) for (let s = 0; s <= SEGS; s++) {
    const i2 = (r * (SEGS + 1) + s) * 2;
    uvs[i2] = s / SEGS; uvs[i2 + 1] = r / (ROWS - 1);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  return geo;
}

function updateGrid(geo, radii, yBase, wobble, t, shrink = 0) {
  const pos = geo.attributes.position.array;
  for (let r = 0; r < ROWS; r++) {
    const y = yBase + (r / (ROWS - 1)) * HEIGHT;
    for (let s = 0; s <= SEGS; s++) {
      const a = (s / SEGS) * Math.PI * 2;
      const rad = Math.max(0.001, radii[r] - shrink + wobble * Math.sin(t * 26 + r * 1.4) * (r / ROWS));
      const i3 = (r * (SEGS + 1) + s) * 3;
      pos[i3] = Math.cos(a) * rad;
      pos[i3 + 1] = y;
      pos[i3 + 2] = Math.sin(a) * rad;
    }
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
}

export function createScene() {
  const group = new THREE.Group();
  group.position.set(0, -0.12, 0.10);

  // 拉坯轮
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.335, 0.045, 40),
    new THREE.MeshStandardMaterial({ color: '#4a3220', roughness: 0.8 })
  );
  wheel.position.y = -0.025;
  group.add(wheel);
  const wheelTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.295, 40),
    new THREE.MeshStandardMaterial({ color: '#5d4128', roughness: 0.9 })
  );
  wheelTop.rotation.x = -Math.PI / 2;
  wheelTop.position.y = -0.001;
  group.add(wheelTop);

  // 坯体
  const clayGeo = buildGrid();
  const clayMat = new THREE.MeshStandardMaterial({ color: '#9c5a2e', roughness: 0.85, side: THREE.DoubleSide });
  const clay = new THREE.Mesh(clayGeo, clayMat);
  group.add(clay);

  // 釉层（略大，顶部向下生长 + 滴垂边缘）
  const glazeGeo = buildGrid();
  const glazeMat = new THREE.MeshStandardMaterial({
    color: '#8e2419', roughness: 0.22, metalness: 0.15,
    emissive: '#3d0a05', emissiveIntensity: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.97,
  });
  const glaze = new THREE.Mesh(glazeGeo, glazeMat);
  glaze.visible = false;
  group.add(glaze);

  // 窑火光
  const fire = new THREE.PointLight('#ff7a26', 0, 1.2);
  fire.position.set(0, 0.1, 0.3);
  group.add(fire);
  const emberGeo = new THREE.BufferGeometry();
  const EN = 60;
  const emberPos = new Float32Array(EN * 3);
  const emberSeed = new Float32Array(EN).map(() => Math.random());
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
    color: '#ffab4d', size: 0.012, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  embers.frustumCulled = false;
  group.add(embers);

  // 泥点
  const mudGeo = new THREE.BufferGeometry();
  const MN = 30;
  const mudPos = new Float32Array(MN * 3);
  mudGeo.setAttribute('position', new THREE.BufferAttribute(mudPos, 3));
  const mud = new THREE.Points(mudGeo, new THREE.PointsMaterial({ color: '#b06a38', size: 0.01, transparent: true, opacity: 0.9 }));
  mud.frustumCulled = false;
  group.add(mud);

  let shape = 0;              // 当前器型
  let phase = 'form';         // form → glaze → fire → done
  let ph = 0;                 // 阶段进度 0..1
  const cur = [...LUMP];      // 当前半径
  const glazeEdge = new Array(SEGS + 1).fill(0).map((_, s) => 0.55 + 0.16 * Math.sin(s * 1.7) + 0.08 * Math.sin(s * 3.3));
  const clayCold = new THREE.Color('#9c5a2e'), clayFired = new THREE.Color('#7a3f22');

  function setPhase(p) { phase = p; ph = 0; }

  function update(dt, t) {
    wheel.rotation.y += dt * (phase === 'form' ? 5.5 : 1.2);
    wheelTop.rotation.z -= dt * (phase === 'form' ? 5.5 : 1.2);
    clay.rotation.y += dt * (phase === 'form' ? 5.5 : 0.6);
    glaze.rotation.y = clay.rotation.y;

    if (phase === 'form') {
      ph = Math.min(1, ph + dt / 7);
      const target = PROFILES[shape];
      for (let r = 0; r < ROWS; r++) {
        // 自下而上依次成形
        const local = Math.max(0, Math.min(1, ph * 2.1 - (r / ROWS) * 1.1));
        cur[r] = LUMP[r] + (target[r] - LUMP[r]) * (local < 0.5 ? 2 * local * local : 1 - (-2 * local + 2) ** 2 / 2);
      }
      updateGrid(clayGeo, cur, 0, (1 - ph) * 0.006, t);
      // 飞泥
      for (let i = 0; i < MN; i++) {
        const a = t * 6 + i * 2.4;
        const rr = 0.2 + ((t * 0.6 + i * 0.13) % 0.4);
        mudPos[i * 3] = Math.cos(a) * rr;
        mudPos[i * 3 + 1] = 0.05 + ((t * 0.5 + i * 0.21) % 0.3);
        mudPos[i * 3 + 2] = Math.sin(a) * rr;
      }
      mudGeo.attributes.position.needsUpdate = true;
      mud.material.opacity = 0.9 * (1 - ph);
      if (ph >= 1) { setPhase('glaze'); glaze.visible = true; }
    } else if (phase === 'glaze') {
      ph = Math.min(1, ph + dt / 4.5);
      const pos = glazeGeo.attributes.position.array;
      for (let r = 0; r < ROWS; r++) {
        const fr = r / (ROWS - 1);
        for (let s = 0; s <= SEGS; s++) {
          const a = (s / SEGS) * Math.PI * 2;
          // 釉从顶部覆盖到 glazeEdge（随 ph 下移），未到处贴着坯体但半径略小（隐藏）
          const cover = fr > 1 - ph * glazeEdge[s];
          const rad = cover ? cur[r] + 0.005 : cur[r] - 0.02;
          const i3 = (r * (SEGS + 1) + s) * 3;
          pos[i3] = Math.cos(a) * rad;
          pos[i3 + 1] = fr * HEIGHT + (cover ? 0 : 0);
          pos[i3 + 2] = Math.sin(a) * rad;
        }
      }
      glazeGeo.attributes.position.needsUpdate = true;
      glazeGeo.computeVertexNormals();
      if (ph >= 1) setPhase('fire');
    } else if (phase === 'fire') {
      ph = Math.min(1, ph + dt / 3.5);
      const pulse = 0.5 + 0.5 * Math.sin(t * 9);
      fire.intensity = 2.2 * Math.sin(ph * Math.PI) * (0.7 + 0.3 * pulse);
      embers.material.opacity = 0.9 * Math.sin(ph * Math.PI);
      clayMat.color.copy(clayCold).lerp(clayFired, ph);
      glazeMat.emissiveIntensity = 0.3 + 1.2 * Math.sin(ph * Math.PI);
      for (let i = 0; i < EN; i++) {
        const life = (t * (0.25 + emberSeed[i] * 0.3) + emberSeed[i]) % 1;
        const a = emberSeed[i] * Math.PI * 2 + t * 0.5;
        emberPos[i * 3] = Math.cos(a) * (0.32 - life * 0.1);
        emberPos[i * 3 + 1] = life * 0.55;
        emberPos[i * 3 + 2] = Math.sin(a) * (0.32 - life * 0.1);
      }
      emberGeo.attributes.position.needsUpdate = true;
      if (ph >= 1) { setPhase('done'); fire.intensity = 0; embers.material.opacity = 0; }
    } else { // done：展示，微光呼吸
      ph += dt;
      glazeMat.emissiveIntensity = 0.35 + 0.15 * Math.sin(t * 2);
      if (ph > 6) { nextShape(); }
    }
  }

  function nextShape() {
    shape = (shape + 1) % PROFILES.length;
    for (let r = 0; r < ROWS; r++) cur[r] = LUMP[r];
    glaze.visible = false;
    clayMat.color.copy(clayCold);
    setPhase('form');
  }

  updateGrid(clayGeo, cur, 0, 0, 0);

  return {
    group, update,
    onFound() {},
    onLost() {},
    onTap() {
      if (phase === 'form') ph = Math.min(1, ph + 0.3);
      else nextShape();
    },
  };
}
