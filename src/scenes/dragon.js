// AR 场景壹：铜梁龙 — 巨龙腾空盘旋 + 火龙钢花粒子
import * as THREE from 'three';

export function createScene() {
  const group = new THREE.Group();
  const N = 44; // 龙身节数

  // ---- 龙身（实例化球段） ----
  const segGeo = new THREE.SphereGeometry(1, 12, 10);
  const segMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.35 });
  const body = new THREE.InstancedMesh(segGeo, segMat, N);
  body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cGold = new THREE.Color('#e8b34b'), cRed = new THREE.Color('#c2452f'), tmpC = new THREE.Color();
  for (let i = 0; i < N; i++) {
    tmpC.copy(cGold).lerp(cRed, 0.5 + 0.5 * Math.sin(i * 0.55));
    body.setColorAt(i, tmpC);
  }
  body.instanceColor.needsUpdate = true;
  group.add(body);

  // 背鳍（实例化小锥）
  const finGeo = new THREE.ConeGeometry(0.010, 0.034, 5);
  const finMat = new THREE.MeshStandardMaterial({ color: '#f0c060', roughness: 0.5, metalness: 0.3 });
  const fins = new THREE.InstancedMesh(finGeo, finMat, N);
  fins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(fins);

  // ---- 龙头 ----
  const head = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#e8b34b', roughness: 0.4, metalness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: '#c2452f', roughness: 0.5, metalness: 0.2 });
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 12), gold);
  skull.scale.set(1.15, 0.92, 0.95); head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.045, 0.06), gold);
  snout.position.set(0.065, -0.012, 0); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), red);
  nose.position.set(0.108, 0.008, 0); head.add(nose);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.05), red);
  jaw.position.set(0.06, -0.045, 0); jaw.rotation.z = 0.22; head.add(jaw);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8),
      new THREE.MeshStandardMaterial({ color: '#fff6df', emissive: '#ffb84d', emissiveIntensity: 0.6 }));
    eye.position.set(0.045, 0.03, 0.038 * s); head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#1a1208' }));
    pupil.position.set(0.056, 0.032, 0.042 * s); head.add(pupil);
    // 鹿角
    const horn1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.009, 0.09, 6), gold);
    horn1.position.set(-0.02, 0.075, 0.03 * s); horn1.rotation.z = 0.5; horn1.rotation.x = -0.25 * s; head.add(horn1);
    const horn2 = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.006, 0.055, 6), gold);
    horn2.position.set(-0.052, 0.10, 0.042 * s); horn2.rotation.z = 1.0; horn2.rotation.x = -0.3 * s; head.add(horn2);
    // 龙须
    const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.16, 4), red);
    whisker.position.set(0.10, -0.02, 0.03 * s); whisker.rotation.z = 1.25; whisker.rotation.x = 0.5 * s; head.add(whisker);
    // 鬃毛
    for (let k = 0; k < 4; k++) {
      const mane = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 5), red);
      mane.position.set(-0.06 - k * 0.012, 0.02 + k * 0.018, 0.025 * s);
      mane.rotation.z = 1.8 + k * 0.2; head.add(mane);
    }
  }
  head.scale.setScalar(0.78);
  group.add(head);

  // ---- 龙珠 ----
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 12),
    new THREE.MeshStandardMaterial({ color: '#ffd873', emissive: '#ff8c2e', emissiveIntensity: 1.4, roughness: 0.3 }));
  const pearlLight = new THREE.PointLight('#ffab4d', 1.6, 1.4);
  pearl.add(pearlLight);
  group.add(pearl);

  // ---- 火龙钢花粒子 ----
  const PN = 240;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PN * 3);
  const pVel = new Float32Array(PN * 3);
  const pLife = new Float32Array(PN).fill(-1);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: '#ffd873', size: 0.02, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const sparks = new THREE.Points(pGeo, pMat);
  sparks.frustumCulled = false;
  group.add(sparks);
  let pCursor = 0;
  function emit(n, burst) {
    for (let i = 0; i < n; i++) {
      const j = pCursor = (pCursor + 1) % PN;
      pPos[j * 3] = (Math.random() - 0.5) * 0.7;
      pPos[j * 3 + 1] = -0.72;
      pPos[j * 3 + 2] = 0.05 + Math.random() * 0.1;
      const a = (Math.random() - 0.5) * (burst ? 1.6 : 0.9);
      const v = burst ? 0.9 + Math.random() * 1.1 : 0.5 + Math.random() * 0.6;
      pVel[j * 3] = Math.sin(a) * v * 0.55;
      pVel[j * 3 + 1] = Math.cos(a) * v;
      pVel[j * 3 + 2] = (Math.random() - 0.5) * 0.2;
      pLife[j] = 1.1 + Math.random() * 0.7;
    }
  }

  // ---- 飞行路径 ----
  const pathAt = (s, out) => {
    const a = s * Math.PI * 2;
    out.set(
      0.26 * Math.sin(a) * (1 + 0.15 * Math.sin(3 * a)),
      0.12 + 0.22 * Math.sin(2 * a) + 0.07 * Math.cos(a),
      0.22 + 0.09 * Math.cos(a) + 0.03 * Math.sin(4 * a),
    );
    return out;
  };

  const dummy = new THREE.Object3D();
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pP = new THREE.Vector3();
  let s0 = 0, speed = 0.055, boost = 0;

  function update(dt, t) {
    speed = 0.055 + boost;
    if (boost > 0) boost = Math.max(0, boost - dt * 0.05);
    s0 += dt * speed;
    const gap = 0.0108;
    // 身段
    for (let i = 0; i < N; i++) {
      pathAt(s0 - i * gap, pA);
      pathAt(s0 - (i + 1) * gap, pB);
      dummy.position.copy(pA);
      dummy.lookAt(pB);
      const r = 0.024 + 0.020 * Math.sin(Math.PI * Math.min(1, (i / N) * 1.15)) * (1 - i / N * 0.3);
      dummy.scale.set(r, r, r * 1.15);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      // 背鳍
      dummy.scale.set(1, 1, 1);
      dummy.position.y += r * 1.05;
      dummy.updateMatrix();
      fins.setMatrixAt(i, dummy.matrix);
    }
    body.instanceMatrix.needsUpdate = true;
    fins.instanceMatrix.needsUpdate = true;
    // 头
    pathAt(s0 + 0.012, pA);
    pathAt(s0 + 0.03, pB);
    head.position.copy(pA);
    head.lookAt(pB);
    head.rotateY(-Math.PI / 2); // 模型 +x 朝前
    // 珠
    pathAt(s0 + 0.085, pP);
    pearl.position.copy(pP);
    pearl.position.y += 0.02 * Math.sin(t * 5);
    pearlLight.intensity = 1.3 + 0.5 * Math.sin(t * 11);
    // 钢花
    if (Math.random() < 0.5) emit(2, false);
    for (let j = 0; j < PN; j++) {
      if (pLife[j] < 0) continue;
      pLife[j] -= dt;
      if (pLife[j] < 0) { pPos[j * 3 + 1] = -10; continue; }
      pVel[j * 3 + 1] -= 1.6 * dt;
      pPos[j * 3] += pVel[j * 3] * dt;
      pPos[j * 3 + 1] += pVel[j * 3 + 1] * dt;
      pPos[j * 3 + 2] += pVel[j * 3 + 2] * dt;
    }
    pGeo.attributes.position.needsUpdate = true;
  }

  return {
    group, update,
    onFound() { emit(80, true); },
    onLost() {},
    onTap() { emit(150, true); boost = 0.05; },
  };
}
