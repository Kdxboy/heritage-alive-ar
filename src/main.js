// 《非遗活了》主控：落地页 → AR 体验 / 调试预览，集齐机制与 UI
import * as THREE from 'three';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import { HERITAGE } from './data.js';
import { createScene as createDragon } from './scenes/dragon.js';
import { createScene as createPrint } from './scenes/print.js';
import { createScene as createEmbroidery } from './scenes/embroidery.js';
import { createScene as createPottery } from './scenes/pottery.js';

const FACTORIES = [createDragon, createPrint, createEmbroidery, createPottery];

// 防护：MindAR 的 resize 在 controller 就绪前被触发会抛错（相机启动期间地址栏
// 收起等都会触发 window resize），先给原型加守卫再实例化
const _origResize = MindARThree.prototype.resize;
MindARThree.prototype.resize = function () {
  if (!this.controller || !this.video) return;
  _origResize.call(this);
};
const $ = (s) => document.querySelector(s);
const LS_KEY = 'heritage-alive-collected';

// ---------- 集齐机制 ----------
const collected = new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
function saveCollected() { localStorage.setItem(LS_KEY, JSON.stringify([...collected])); }
function renderProgress() {
  const wrap = $('#progress');
  wrap.innerHTML = HERITAGE.map((h, i) =>
    `<span class="p-dot ${collected.has(i) ? 'on' : ''}" style="--c:${h.color}">${h.name[0]}</span>`).join('');
  $('#landing-progress').innerHTML = collected.size
    ? `已集 ${collected.size}/4 艺${collected.size === 4 ? ' · 已解锁「四艺合卷」' : ''}`
    : '扫齐四张海报，解锁「四艺合卷」彩蛋';
}
function collect(i) {
  if (collected.has(i)) return;
  collected.add(i);
  saveCollected();
  renderProgress();
  if (collected.size === 4) setTimeout(showEgg, 1600);
}

// ---------- 彩蛋 ----------
function showEgg() {
  $('#egg').classList.add('show');
  const cv = $('#egg-confetti');
  cv.width = innerWidth; cv.height = innerHeight;
  const ctx = cv.getContext('2d');
  const colors = ['#c2452f', '#e8b34b', '#3f7d5a', '#2f5fa5', '#f0a05a'];
  const pieces = Array.from({ length: 130 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5,
    r: 4 + Math.random() * 7, a: Math.random() * Math.PI * 2,
    vy: 60 + Math.random() * 120, vx: (Math.random() - 0.5) * 40, va: (Math.random() - 0.5) * 6,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  let last = performance.now(), running = true;
  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of pieces) {
      p.y += p.vy * dt; p.x += p.vx * dt + Math.sin(now / 400 + p.a) * 0.6; p.a += p.va * dt;
      if (p.y > cv.height + 20) { p.y = -20; p.x = Math.random() * cv.width; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  $('#egg-close').onclick = () => { running = false; $('#egg').classList.remove('show'); };
}

// ---------- 知识卡片 ----------
function showKnow(i) {
  const h = HERITAGE[i];
  $('#know-body').innerHTML = `
    <div class="know-head" style="border-color:${h.color}">
      <span class="know-num" style="background:${h.color}">${h.num}</span>
      <div><h3>${h.name}</h3><p>${h.place} · ${h.level}</p></div>
    </div>
    <p class="know-intro">${h.intro}</p>
    <h4>工艺四步</h4>
    <ol class="know-craft">${h.craft.map((c) => `<li>${c}</li>`).join('')}</ol>`;
  $('#modal-know').classList.add('show');
}

// ---------- 通用 modal ----------
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset && t.dataset.close) t.closest('.modal').classList.remove('show');
});

// ---------- 场景灯光 ----------
function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x334455, 1.1));
  const dir = new THREE.DirectionalLight(0xffffff, 1.4);
  dir.position.set(0.5, 1, 1.2);
  scene.add(dir);
}

// ---------- AR 模式 ----------
let arStarted = false;
async function startAR() {
  if (arStarted) return;
  const btn = $('#btn-start');
  btn.disabled = true; btn.textContent = '正在加载 AR 引擎…';
  try {
    const mindarThree = new MindARThree({
      container: $('#ar-container'),
      imageTargetSrc: 'targets/targets.mind',
      maxTrack: 1,
      uiLoading: 'no', uiScanning: 'no', uiError: 'no',
      filterMinCF: 0.0005, filterBeta: 0.005,
      warmupTolerance: 2, missTolerance: 8,
    });
    const { renderer, scene, camera } = mindarThree;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    addLights(scene);

    const scenes = [];
    let active = -1;
    HERITAGE.forEach((h, i) => {
      const anchor = mindarThree.addAnchor(i);
      const s = FACTORIES[i]();
      anchor.group.add(s.group);
      scenes.push(s);
      anchor.onTargetFound = () => {
        active = i;
        s.onFound();
        collect(i);
        $('#scan-hint').classList.add('hide');
        const b = $('#banner');
        b.classList.add('show');
        b.style.setProperty('--c', h.color);
        $('#banner-name').textContent = h.name;
        $('#banner-sub').textContent = `${h.place} · ${h.level}`;
        $('#banner-tap').textContent = h.tapHint;
        $('#btn-know').onclick = () => showKnow(i);
      };
      anchor.onTargetLost = () => {
        if (active === i) active = -1;
        s.onLost();
        $('#scan-hint').classList.remove('hide');
        $('#banner').classList.remove('show');
      };
    });

    btn.textContent = '正在开启相机…';
    await mindarThree.start();
    arStarted = true;
    document.body.classList.add('ar-on');
    $('#landing').classList.add('hide');
    $('#hud').classList.add('show');
    renderProgress();

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.elapsedTime;
      if (active >= 0) scenes[active].update(dt, t);
      renderer.render(scene, camera);
    });

    $('#ar-container').addEventListener('pointerdown', (e) => {
      if (e.target.closest('.ui')) return;
      if (active >= 0) scenes[active].onTap();
    });
    $('#btn-exit').onclick = () => location.reload();
  } catch (err) {
    console.error(err);
    btn.disabled = false; btn.textContent = '开始 AR 体验';
    $('#err-detail').textContent = String(err && err.message || err);
    $('#modal-err').classList.add('show');
  }
}

// ---------- 免海报预览模式（?scene=id）----------
function startPreview(id) {
  const idx = HERITAGE.findIndex((h) => h.id === id);
  if (idx < 0) return false;
  const h = HERITAGE[idx];
  document.body.classList.add('ar-on');
  $('#landing').classList.add('hide');
  $('#hud').classList.add('show');
  $('#scan-hint').classList.add('hide');
  $('#progress').style.visibility = 'hidden';
  const b = $('#banner');
  b.classList.add('show');
  b.style.setProperty('--c', h.color);
  $('#banner-name').textContent = h.name + '（预览模式）';
  $('#banner-sub').textContent = `${h.place} · ${h.level}`;
  $('#banner-tap').textContent = h.tapHint + ' · 拖动旋转视角';
  $('#btn-know').onclick = () => showKnow(idx);
  $('#btn-exit').onclick = () => { location.href = location.pathname; };

  const container = $('#ar-container');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  container.appendChild(renderer.domElement);
  container.classList.add('preview-bg');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.01, 20);
  camera.position.set(0, 0.25, 2.1);
  addLights(scene);

  const world = new THREE.Group();
  scene.add(world);
  // 虚拟海报面
  new THREE.TextureLoader().load(`posters/${id}.png`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1.5),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    world.add(plane);
  });
  const s = FACTORIES[idx]();
  world.add(s.group);
  s.onFound();
  // 调试：?ff=秒数 确定性快进（供无头验证动画后期状态）
  const ff = Number(new URLSearchParams(location.search).get('ff') || 0);
  if (ff > 0) { let ft = 0; for (let i = 0; i < ff * 60; i++) { ft += 1 / 60; s.update(1 / 60, ft); } }

  let rx = -0.12, ry = 0, dragging = false, px = 0, py = 0;
  container.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    ry += (e.clientX - px) * 0.005; rx += (e.clientY - py) * 0.005;
    rx = Math.max(-1.1, Math.min(0.5, rx));
    px = e.clientX; py = e.clientY;
  });
  addEventListener('pointerup', (e) => {
    if (dragging && Math.abs(e.clientX - px) < 4 && Math.abs(e.clientY - py) < 4 && !e.target.closest('.ui')) s.onTap();
    dragging = false;
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta());
    if (!dragging) ry += dt * 0.12;
    world.rotation.set(rx, ry, 0);
    s.update(dt, clock.elapsedTime);
    renderer.render(scene, camera);
  });
  return true;
}

// ---------- 落地页初始化 ----------
function initLanding() {
  $('#gallery').innerHTML = HERITAGE.map((h, i) => `
    <div class="g-card" data-i="${i}" style="--c:${h.color}">
      <img src="posters/thumb/${h.id}.png" alt="${h.name}" loading="lazy">
      <div class="g-name">${h.num} · ${h.name}</div>
    </div>`).join('');
  $('#gallery').addEventListener('click', (e) => {
    const card = e.target.closest('.g-card');
    if (card) showKnow(Number(card.dataset.i));
  });
  $('#preview-links').innerHTML = HERITAGE.map((h) =>
    `<a class="chip" href="?scene=${h.id}" style="--c:${h.color}">${h.name}</a>`).join('');
  $('#poster-list').innerHTML = HERITAGE.map((h) => `
    <figure><img src="posters/${h.id}.png" alt="${h.name}" loading="lazy"><figcaption>${h.num} · ${h.name}</figcaption></figure>`).join('');
  $('#btn-start').onclick = startAR;
  $('#btn-posters').onclick = () => $('#modal-posters').classList.add('show');
  $('#btn-about').onclick = () => $('#modal-about').classList.add('show');
  $('#btn-egg-view').onclick = showEgg;
  renderProgress();
  const isWeixin = /MicroMessenger/i.test(navigator.userAgent);
  if (isWeixin) $('#wx-tip').style.display = 'block';
}

// 全局错误可视化（调试/兜底）
addEventListener('error', (e) => {
  let box = $('#dbg-err');
  if (!box) {
    box = document.createElement('div');
    box.id = 'dbg-err';
    box.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:99;background:#7a1010;color:#fff;padding:8px 10px;border-radius:8px;font-size:11px;word-break:break-all;';
    document.body.appendChild(box);
  }
  box.textContent = `${e.message} @${(e.filename || '').split('/').pop()}:${e.lineno}`;
});

initLanding();
const params = new URLSearchParams(location.search);
if (params.get('debugw')) {
  setTimeout(() => {
    const rows = [`innerWidth=${innerWidth} docScrollW=${document.documentElement.scrollWidth} bodyScrollW=${document.body.scrollWidth}`];
    document.querySelectorAll('#landing, #landing *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > innerWidth + 1 || r.width > innerWidth + 1)
        rows.push(`${el.tagName}.${el.className || el.id} w=${r.width.toFixed(0)} right=${r.right.toFixed(0)}`);
    });
    fetch('/__log', { method: 'POST', body: rows.join('\n') });
  }, 1500);
}
const previewId = params.get('scene');
if (previewId) startPreview(previewId);
else if (params.get('autostart')) startAR();
