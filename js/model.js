// 3B model Rev B — sahanlık + vestiyer iç mekânı ve dış cephe (önce/sonra).
// Sirkülasyon: merdiven -> K1 (dış kapı) -> sahanlık -> solda ev kapısı,
// sağda V (vestiyer kapısı) -> karşıda ayna. Geometri data/dimensions.json'dan.
// Model illüstratiftir: kararları anlatır, rölöve yerine geçmez.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';

const COL = {
  greige: 0xd8d2c4, greigeDark: 0xb9b1a0, cream: 0xefe6cf, render: 0xf3ecd8,
  tile: 0xe8e0d2, grout: 0xcfc6b4, jute: 0xb59b6a, charcoal: 0x4a4a50,
  oak: 0x9a7a55, glass: 0xbcd9d6, brass: 0xa8834f, black: 0x2b2b2e,
  wall: 0xf1ede4, ceiling: 0xf7f5f0, roof: 0xa96a48, ground: 0xb9b2a4,
  bayDark: 0x4c413b, ledWarm: 0xffd9a0, panel: 0xe9e4d8, niche: 0xefece5,
  alu: 0x4b5563, iron: 0x3a3f45, stone: 0xc9c2b2, shutter: 0x6d7f6a,
  houseDoor: 0x39555a, pave: 0xcac3b5,
};

function m(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.82, metalness: 0.04, ...opts });
}
function box(w, h, d, mat, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  b.position.set(x, y, z);
  return b;
}

// ---- karo dokusu (canvas) ----
function tileTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#e8e0d2'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#cfc6b4'; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---- ince ahşap dokusu (canvas) — meşe doğrama için ----
function woodTexture(base, streak) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = streak; g.globalAlpha = 0.25; g.lineWidth = 2;
  for (let i = 0; i < 22; i++) {
    const x = (i * 37) % 256;
    g.beginPath(); g.moveTo(x, 0);
    g.bezierCurveTo(x + 6, 80, x - 6, 170, x + 4, 256);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---- kiremit dokusu (canvas) ----
function roofTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#a96a48'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#8d543a'; g.lineWidth = 4;
  for (let y = 0; y < 256; y += 32) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
    for (let x = (y / 32) % 2 ? 16 : 0; x < 256; x += 32) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---- shaker kapak ----
function shakerDoor(w, h, depth, pullSide, pullY) {
  const grp = new THREE.Group();
  grp.add(box(w, h, depth, m(COL.greige), 0, h / 2, 0));
  grp.add(box(w - 0.14, h - 0.14, depth + 0.006, m(COL.greigeDark, { roughness: 0.9 }), 0, h / 2, 0));
  grp.add(box(w - 0.2, h - 0.2, depth + 0.012, m(COL.greige), 0, h / 2, 0));
  const pull = box(0.012, 0.14, 0.02, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
    pullSide * (w / 2 - 0.05), pullY, depth / 2 + 0.012);
  grp.add(pull);
  return grp;
}

// ---- panjurlu pencere (dış cephe) ----
function shutterWindow(w, h) {
  const g = new THREE.Group();
  g.add(box(w + 0.12, h + 0.12, 0.06, m(0xffffff, { roughness: 0.6 }), 0, 0, 0));
  g.add(box(w, h, 0.05, new THREE.MeshPhysicalMaterial({
    color: COL.glass, transparent: true, opacity: 0.55, roughness: 0.15 }), 0, 0, 0.015));
  g.add(box(0.03, h, 0.06, m(0xffffff, { roughness: 0.6 }), 0, 0, 0.03));
  g.add(box(w / 2 - 0.02, h + 0.06, 0.04, m(COL.shutter, { roughness: 0.9 }), -(w / 2 + w / 4 + 0.05), 0, 0.02));
  g.add(box(w / 2 - 0.02, h + 0.06, 0.04, m(COL.shutter, { roughness: 0.9 }), (w / 2 + w / 4 + 0.05), 0, 0.02));
  return g;
}

// ---- korkuluk ----
function railing(x, y0, z0, z1, slopePerZ) {
  const g = new THREE.Group();
  const it = m(COL.iron, { metalness: 0.4, roughness: 0.5 });
  const len = Math.abs(z1 - z0), n = Math.max(2, Math.round(len / 0.45));
  for (let i = 0; i <= n; i++) {
    const z = z0 + (z1 - z0) * (i / n);
    const y = y0 + slopePerZ * (z - z0);
    g.add(box(0.03, 0.95, 0.03, it, x, y + 0.475, z));
  }
  const rail = box(0.04, 0.05, Math.hypot(len, slopePerZ * len) + 0.05, it,
    x, y0 + slopePerZ * (z1 - z0) / 2 + 0.98, (z0 + z1) / 2);
  rail.rotation.x = Math.atan2(-slopePerZ * (z1 - z0), (z1 - z0));
  g.add(rail);
  return g;
}

// ---- camlı alüminyum kapı kanadı (K1) ----
function aluGlazedLeaf(w, h) {
  const g = new THREE.Group();
  const aluM = m(COL.alu, { metalness: 0.55, roughness: 0.4 });
  g.add(box(w, h, 0.05, aluM, w / 2, h / 2, 0));
  g.add(box(w - 0.16, h - 0.34, 0.052, new THREE.MeshPhysicalMaterial({
    color: COL.glass, transparent: true, opacity: 0.4, roughness: 0.08 }), w / 2, h / 2 + 0.06, 0));
  g.add(box(0.02, 0.26, 0.04, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), w - 0.09, 1.0, 0.045));
  return g;
}

export async function initViewer(container, statusEl, TXT) {
  TXT = TXT || {};
  const tt = (k, f) => TXT[k] || f;
  // Önce veri (ilk await modül değerlendirmesini serbest bırakır — WebGL/SwiftShader
  // başlatması DOMContentLoaded'ı bloklamasın), sonra renderer.
  const D = await (await fetch('data/dimensions.json')).json();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    if (!renderer.getContext()) throw new Error('no webgl context');
  } catch (e) {
    container.innerHTML = '<div class="webgl-yok">Tarayıcınız WebGL desteklemiyor — 3B model açılamadı.<br>' +
      'Çizimler ve dokümanlar diğer sekmelerden erişilebilir.</div>';
    return null;
  }
  const mm = 1 / 1000;
  const W = D.bay_mm.interior_width * mm;             // 2.0 (x)
  const Lt = D.bay_mm.interior_length_total * mm;     // 4.0 (z) sahanlık+bölme+vestiyer
  const H = D.levels_m.clear_height_model;            // 2.5
  const laD = D.landing_mm.depth_ns * mm;             // 1.4  sahanlık z 0..1.4
  const pT = D.landing_mm.partition_to_vestiyer_thickness * mm; // 0.1
  const zV0 = laD + pT;                               // 1.5  vestiyer başlangıcı
  const v = D.door_V_mm;
  const vw = v.leaf_width * mm, vh = v.leaf_height * mm;
  const vx0 = v.from_west_wall * mm;                  // 0.4  V kapı boşluğu x 0.4..1.33
  const k1 = D.door_K1_mm;
  const k1w = k1.leaf_width * mm, k1h = k1.leaf_height * mm;

  const cw0 = container.clientWidth || 800, ch0 = container.clientHeight || 500;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(cw0, ch0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;   // WP4: pozlama/okunurluk
  renderer.toneMappingExposure = 1.12;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9ecef);
  const camera = new THREE.PerspectiveCamera(58, cw0 / ch0, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;

  // ============ İÇ MEKÂN: SAHANLIK + VESTİYER ============
  const interior = new THREE.Group();
  let ceilRef = null;
  {
    const tiles = tileTexture(); tiles.repeat.set(3, 6);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Lt),
      new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, Lt / 2);
    floor.receiveShadow = true;
    interior.add(floor);

    // jüt yolluk: V kapısı aksı -> ayna
    const run = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.8), m(COL.jute, { roughness: 1 }));
    run.rotation.x = -Math.PI / 2; run.position.set(0.87, 0.005, zV0 + 1.15);
    interior.add(run);

    // tavan + 3 spot (1 sahanlık, 2 vestiyer)
    ceilRef = box(W, 0.02, Lt, m(COL.ceiling), W / 2, H + 0.01, Lt / 2);
    interior.add(ceilRef);
    for (const [sx, sz] of [[1.0, 0.7], [0.87, 2.1], [0.87, 3.3]]) {
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2dd, emissiveIntensity: 1.6 }));
      spot.position.set(sx, H - 0.006, sz);
      interior.add(spot);
    }

    const wallT = 0.06;
    const wallM = m(COL.wall, { roughness: 0.92 });
    // ---- güney duvar (z=0): mevcut ev/hall kapısı ----
    interior.add(box(0.5 + wallT, H, wallT, wallM, (0.5 - wallT) / 2, H / 2, -wallT / 2));
    interior.add(box(W - 1.45 + wallT, H, wallT, wallM, (1.45 + W + wallT) / 2, H / 2, -wallT / 2));
    interior.add(box(0.95, H - 2.1, wallT, wallM, 0.975, 2.1 + (H - 2.1) / 2, -wallT / 2));
    const hallDoor = new THREE.Group();
    hallDoor.add(box(1.03, 2.14, 0.04, m(0xffffff, { roughness: 0.6 }), 0, 1.07, 0));
    hallDoor.add(box(0.91, 2.04, 0.05, m(COL.houseDoor, { roughness: 0.55 }), 0, 1.02, 0.005));
    hallDoor.add(box(0.02, 0.24, 0.03, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), 0.34, 1.0, 0.045));
    hallDoor.position.set(0.975, 0, 0.005);
    interior.add(hallDoor);

    // ---- batı duvar (x=0): sahanlıkta cellier kapısı, vestiyerde W1 arkası ----
    interior.add(box(wallT, H, Lt, wallM, -wallT / 2, H / 2, Lt / 2));
    const cel = new THREE.Group();
    cel.add(box(0.04, 2.1, 0.9, m(0xffffff, { roughness: 0.6 }), 0, 1.05, 0));
    cel.add(box(0.045, 2.0, 0.8, m(COL.greige, { roughness: 0.7 }), 0.004, 1.0, 0));
    cel.position.set(0.035, 0, 0.75);
    interior.add(cel);

    // ---- kuzey duvar (z=Lt) ----
    interior.add(box(W + 2 * wallT, H, wallT, wallM, W / 2, H / 2, Lt + wallT / 2));

    // ---- doğu duvar (x=W): sahanlıkta K1, vestiyerde dolu duvar + cam bant ----
    const east = new THREE.Group();
    const seg = (z0, z1, y0, y1) =>
      east.add(box(wallT, y1 - y0, z1 - z0, wallM, W + wallT / 2, (y0 + y1) / 2, (z0 + z1) / 2));
    const k1z0 = 0.2, k1z1 = k1z0 + k1w + 0.1;        // K1 boşluğu z 0.2..1.2
    seg(0, k1z0, 0, H);
    seg(k1z0, k1z1, k1h + 0.05, H);                    // K1 üstü
    seg(k1z1, Lt, 0, H);                               // vestiyer doğu duvarı (eski kapı örüldü)
    // cam bant (vestiyer, üst şerit)
    const gb = D.glazing_band_mm;
    const gz0 = 1.55, gz1 = gz0 + gb.width * mm;   // kule üstü, güney uç — nişle çakışmaz
    const gy0 = gb.sill_level * mm;                    // FFL üstü iç kot = 2.0
    east.children.pop();                               // son segmenti cam bantlı yeniden kur
    seg(k1z1, gz0, 0, H);
    seg(gz0, gz1, 0, gy0); seg(gz0, gz1, gy0 + gb.height * mm, H);
    seg(gz1, Lt, 0, H);
    east.add(box(0.02, gb.height * mm, gb.width * mm, new THREE.MeshPhysicalMaterial({
      color: COL.glass, transparent: true, opacity: 0.45, roughness: 0.1 }),
      W + wallT / 2, gy0 + gb.height * mm / 2, (gz0 + gz1) / 2));
    interior.add(east);

    // ---- K1 kapısı (sahanlık doğu): kasa + eşik + camlı alu kanat ----
    const aluM = m(COL.alu, { metalness: 0.55, roughness: 0.4 });
    interior.add(box(0.1, k1h, 0.05, aluM, W, k1h / 2, k1z0 + 0.025));
    interior.add(box(0.1, k1h, 0.05, aluM, W, k1h / 2, k1z1 - 0.025));
    interior.add(box(0.1, 0.05, k1z1 - k1z0, aluM, W, k1h + 0.025, (k1z0 + k1z1) / 2));
    interior.add(box(0.16, 0.02, k1z1 - k1z0, m(COL.alu, { metalness: 0.7, roughness: 0.35 }),
      W + 0.01, 0.01, (k1z0 + k1z1) / 2));            // 20 mm eşik
    const k1Pivot = new THREE.Group();
    k1Pivot.position.set(W, 0, k1z1 - 0.05);           // kuzey kasa — sahanlığa İÇE açılır
    const k1Leaf = aluGlazedLeaf(k1w, k1h);
    k1Leaf.rotation.y = Math.PI / 2;                   // kanat -z yönüne uzanır
    k1Pivot.add(k1Leaf);
    interior.add(k1Pivot);

    // K1 dışı vinyet: aşağı inen merdiven + korkuluk + gün ışığı fonu
    const outside = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      outside.add(box(0.5 - i * 0.02, 0.02, 1.0, m(COL.stone, { roughness: 0.95 }),
        W + 0.35 + i * 0.28, -0.07 - i * 0.135, 0.7));
    }
    outside.add(railing(W + 1.45, -0.6, 0.15, 1.25, 0));
    const daylight = new THREE.Mesh(new THREE.PlaneGeometry(5, 4),
      new THREE.MeshBasicMaterial({ color: 0xf6ecd9 }));
    daylight.rotation.y = -Math.PI / 2; daylight.position.set(W + 2.6, 1.4, 0.8);
    outside.add(daylight);
    const dayLight = new THREE.PointLight(0xfff2da, 9, 6, 2);
    dayLight.position.set(W + 1.2, 1.7, 0.7);
    outside.add(dayLight);
    interior.add(outside);
    interior.userData.outside = outside;

    // ---- bölme duvarı (z=1.4..1.5) + V kapısı ----
    const part = new THREE.Group();
    part.add(box(vx0, H, pT, wallM, vx0 / 2, H / 2, laD + pT / 2));                       // batı parça
    part.add(box(W - (vx0 + vw), H, pT, wallM, (vx0 + vw + W) / 2, H / 2, laD + pT / 2)); // doğu parça
    part.add(box(vw, H - vh, pT, wallM, vx0 + vw / 2, vh + (H - vh) / 2, laD + pT / 2));  // üst
    // kasa (meşe)
    const oakTex = woodTexture('#9a7a55', '#7c5f41');
    const oakM = new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.6 });
    part.add(box(0.05, vh, pT + 0.04, oakM, vx0 + 0.025, vh / 2, laD + pT / 2));
    part.add(box(0.05, vh, pT + 0.04, oakM, vx0 + vw - 0.025, vh / 2, laD + pT / 2));
    part.add(box(vw, 0.05, pT + 0.04, oakM, vx0 + vw / 2, vh - 0.025, laD + pT / 2));
    interior.add(part);
    // V kanadı: menteşe BATI kasada, VESTİYERE içe açılır (giren aynayı karşısında görür)
    const vPivot = new THREE.Group();
    vPivot.position.set(vx0 + 0.05, 0, zV0 - pT / 2);
    const vLeaf = new THREE.Group();
    const vLeafW = vw - 0.1;
    vLeaf.add(box(vLeafW, vh - 0.06, 0.045, oakM, vLeafW / 2, (vh - 0.06) / 2 + 0.01, 0));
    vLeaf.add(box(vLeafW - 0.28, vh - 0.6, 0.047, m(0x8a6c4a, { roughness: 0.7 }),
      vLeafW / 2, vh / 2, 0));                                                            // gömme panel
    vLeaf.add(box(0.02, 0.26, 0.035, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
      vLeafW - 0.08, 1.02, 0.04));
    vPivot.add(vLeaf);
    interior.add(vPivot);

    // ---- W1 gardırop (vestiyer batı duvarı, 2 modül) ----
    const w1 = new THREE.Group();
    const w1zs = zV0 + 0.075, modW = D.w1_mm.module_width * mm, depth = D.w1_mm.depth * mm;
    const run1 = D.w1_mm.run_total * mm;               // 2.35
    w1.add(box(depth, 0.1, run1, m(COL.greigeDark), depth / 2, 0.05, zV0 + run1 / 2 + 0.0));
    for (let mI = 0; mI < D.w1_mm.modules; mI++) {
      for (let dI = 0; dI < 2; dI++) {
        const z = w1zs + mI * modW + dI * (modW / 2) + modW / 4;
        const door = shakerDoor(modW / 2 - 0.005, 1.95, 0.024, dI === 0 ? 1 : -1, 1.0);
        door.rotation.y = Math.PI / 2;
        door.position.set(depth, 0.1, z);
        w1.add(door);
        const top = shakerDoor(modW / 2 - 0.005, 0.44, 0.024, 0, 0.1);
        top.rotation.y = Math.PI / 2;
        top.position.set(depth, 2.06, z);
        w1.add(top);
      }
    }
    w1.add(box(depth, 2.4, 0.075, m(COL.niche), depth / 2, 1.3, zV0 + 0.0375));
    w1.add(box(depth, 2.4, 0.075, m(COL.niche), depth / 2, 1.3, zV0 + run1 - 0.0375));
    interior.add(w1);

    // ---- B1 bank duvarı (vestiyer doğu) ----
    const b1 = new THREE.Group();
    const bRun = D.b1_mm.bench_run * mm;               // 1.6
    const bz0 = zV0 + 0.45, bz1 = bz0 + bRun;          // z 1.95..3.55
    const bx = W - 0.42;
    b1.add(box(0.42, 0.45, bRun, m(COL.greige), bx + 0.21, 0.225, (bz0 + bz1) / 2));
    b1.add(box(0.42, 0.06, bRun, m(COL.charcoal, { roughness: 0.95 }), bx + 0.21, 0.48, (bz0 + bz1) / 2));
    for (let i = 0; i < D.b1_mm.drawers; i++) {
      const z = bz0 + 0.06 + i * (bRun / 2);
      b1.add(box(0.02, 0.26, bRun / 2 - 0.12, m(COL.greigeDark), bx - 0.011, 0.21, z + bRun / 4 - 0.03));
      b1.add(box(0.012, 0.02, 0.24, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), bx - 0.02, 0.36, z + bRun / 4 - 0.03));
    }
    b1.add(box(0.03, 1.34, bRun, m(COL.panel), W - 0.035, 0.51 + 0.67, (bz0 + bz1) / 2));
    for (let i = 0; i < D.b1_mm.hooks; i++) {
      const z = bz0 + 0.15 + i * (bRun - 0.3) / (D.b1_mm.hooks - 1);
      b1.add(box(0.02, 0.09, 0.02, m(COL.black, { roughness: 0.4 }), W - 0.06, 1.68, z));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.016), m(COL.black, { roughness: 0.4 }));
      tip.position.set(W - 0.065, 1.645, z); b1.add(tip);
    }
    // niş bandı + LED
    const nx = W - 0.35;
    b1.add(box(0.35, 0.5, bRun, m(COL.niche), nx + 0.175, 2.1, (bz0 + bz1) / 2));
    for (let i = 0; i < D.b1_mm.niche_bays; i++) {
      const z = bz0 + 0.05 + i * (bRun - 0.1) / D.b1_mm.niche_bays;
      b1.add(box(0.31, 0.4, (bRun - 0.1) / D.b1_mm.niche_bays - 0.04, m(0x3a352f, { roughness: 1 }),
        nx + 0.155, 2.09, z + (bRun - 0.1) / (2 * D.b1_mm.niche_bays)));
    }
    const led = box(0.3, 0.015, bRun - 0.1, new THREE.MeshStandardMaterial({
      color: COL.ledWarm, emissive: 0xffb45e, emissiveIntensity: 2.0 }), nx + 0.15, 2.31, (bz0 + bz1) / 2);
    b1.add(led);
    const ledLight = new THREE.PointLight(0xffc37a, 5, 3, 2);
    ledLight.position.set(nx, 2.2, (bz0 + bz1) / 2); b1.add(ledLight);
    b1.add(box(0.35, 0.15, bRun, m(COL.greige), nx + 0.175, 2.425, (bz0 + bz1) / 2));
    interior.add(b1);

    // ---- ayakkabı kulesi (bölmenin vestiyer yüzü, doğu segment) ----
    const st = D.b1_mm.shoe_tower_south_corner;
    const stW = st.width * mm, stD = st.depth * mm, stH = st.height * mm;
    const tower = new THREE.Group();
    tower.add(box(stW, stH, stD, m(COL.greige), 0, stH / 2, 0));
    for (let i = 1; i < 5; i++) {
      tower.add(box(stW - 0.04, 0.014, stD - 0.02, m(COL.greigeDark), 0, 0.25 + i * 0.42, 0.005));
    }
    tower.add(box(0.012, 0.14, 0.02, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
      stW / 2 - 0.05, 1.05, stD / 2 + 0.012));
    tower.position.set(1.4 + stW / 2, 0, zV0 + stD / 2);
    interior.add(tower);

    // ---- M1 ayna ünitesi (kuzey duvar): ayna + kapaklı kule + köşe rafları + köprü ----
    const sur = D.mirror_mm.surround;
    const uX0 = sur.unit_from_west * mm, uW = sur.unit_width * mm, uD = sur.depth * mm;
    const m1 = new THREE.Group();
    // ayna (gömme niş): x 0.645..1.095 — V kapı aksında
    const mir = new THREE.Group();
    mir.add(box(0.47, 1.64, 0.03, m(COL.black, { roughness: 0.35 }), 0, 0, 0));
    mir.add(box(0.43, 1.6, 0.032, new THREE.MeshStandardMaterial({
      color: 0xdfe9e8, metalness: 0.9, roughness: 0.08 }), 0, 0, 0.004));
    mir.position.set(D.mirror_mm.axis_from_west * mm, 0.25 + 0.8, Lt - 0.035);
    m1.add(mir);
    // kapaklı kule x 1.10..1.65
    const tw = sur.door_tower_width * mm, th = sur.door_tower_height * mm;
    m1.add(box(tw, th, uD, m(COL.greige), 1.10 + tw / 2, th / 2, Lt - uD / 2));
    const tDoor = shakerDoor(tw - 0.02, th - 0.04, 0.02, -1, 1.0);
    tDoor.position.set(1.10 + tw / 2, 0.02, Lt - uD - 0.012);
    tDoor.rotation.y = Math.PI;
    m1.add(tDoor);
    // köşe açık raflar x 1.65..2.0
    const shW = sur.corner_open_shelf_width * mm;
    m1.add(box(0.016, th, uD, m(COL.panel), 1.65, th / 2, Lt - uD / 2));
    for (let i = 0; i <= sur.open_shelf_rows; i++) {
      m1.add(box(shW, 0.016, uD - 0.02, m(COL.panel), 1.65 + shW / 2, 0.1 + i * (th - 0.1) / sur.open_shelf_rows, Lt - uD / 2));
    }
    // sepetler (köşe raflarında 2 adet — okunur props)
    m1.add(box(shW - 0.06, 0.16, uD - 0.08, m(COL.jute, { roughness: 1 }), 1.65 + shW / 2, 0.55, Lt - uD / 2));
    m1.add(box(shW - 0.06, 0.16, uD - 0.08, m(COL.jute, { roughness: 1 }), 1.65 + shW / 2, 1.32, Lt - uD / 2));
    // üst köprü x 0.62..2.0, y 2.0..2.5
    m1.add(box(uW, sur.top_bridge_height * mm, uD, m(COL.greige),
      uX0 + uW / 2, sur.top_bridge_level * mm + sur.top_bridge_height * mm / 2, Lt - uD / 2));
    m1.add(box(uW - 0.03, 0.44, 0.02, m(COL.greigeDark, { roughness: 0.9 }),
      uX0 + uW / 2, 2.25, Lt - uD - 0.012));
    interior.add(m1);

    // ---- süpürgelikler ----
    const sk = m(COL.panel, { roughness: 0.9 });
    interior.add(box(W, 0.07, 0.014, sk, W / 2, 0.035, Lt - 0.007));
    interior.add(box(0.014, 0.07, laD, sk, 0.007, 0.035, laD / 2));

    // ---- bank minderi üstünde sepet + altında 2 çift stilize ayakkabı ----
    b1.add(box(0.32, 0.2, 0.28, m(COL.jute, { roughness: 1 }), bx + 0.21, 0.61, bz1 - 0.25));
    for (let i = 0; i < 2; i++) {
      const z = bz0 + 0.35 + i * 0.4;
      for (const dx of [-0.06, 0.06]) {
        b1.add(box(0.075, 0.03, 0.24, m(0x4a4038, { roughness: 0.9 }), bx - 0.13 + dx, 0.015, z));
        b1.add(box(0.07, 0.05, 0.16, m(i ? 0x555b63 : 0x7a4a33, { roughness: 0.9 }), bx - 0.13 + dx, 0.055, z - 0.03));
      }
    }

    // ---- iç aydınlatma (WP4) ----
    const warmA = new THREE.PointLight(0xfff0dd, 16, 8, 2); warmA.position.set(1.0, H - 0.15, 0.7);
    const warmB = new THREE.PointLight(0xfff0dd, 18, 8, 2); warmB.position.set(0.87, H - 0.15, 2.1);
    const warmC = new THREE.PointLight(0xfff0dd, 18, 8, 2); warmC.position.set(0.87, H - 0.15, 3.3);
    warmB.castShadow = warmC.castShadow = true;
    interior.add(warmA, warmB, warmC);
    interior.add(new THREE.AmbientLight(0xfff6ea, 0.5));
    interior.add(new THREE.HemisphereLight(0xfffaf0, 0x8a7f6a, 0.35));

    interior.userData.vPivot = vPivot;
    interior.userData.k1Pivot = k1Pivot;
  }

  // ============ DIŞ CEPHE (ev bağlamıyla) ============
  const exterior = new THREE.Group();
  {
    const wallH = 3.4, faceZ = 0;
    const bayX0 = 0.05, bayX1 = 2.65;
    const landY = 1.215;
    const stX0 = 0.07, stX1 = 1.17;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), m(COL.ground, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    exterior.add(ground);
    exterior.add(box(20, 0.04, 1.7, m(COL.pave, { roughness: 0.95 }), 0, 0.02, 3.9));

    exterior.add(box(4.35, wallH, 0.3, m(COL.cream), bayX0 - 4.35 / 2, wallH / 2, faceZ));
    exterior.add(box(1.9, wallH, 0.3, m(COL.cream), bayX1 + 0.95, wallH / 2, faceZ));

    exterior.add(box(8.85, 2.1, 0.34, m(COL.cream), 0.15, wallH + 1.05, faceZ + 0.02));
    for (const wx of [-3.0, -1.1, 1.5]) {
      const win = shutterWindow(0.85, 1.25);
      win.position.set(wx, wallH + 1.05, faceZ + 0.2);
      exterior.add(win);
    }
    const winG = shutterWindow(0.85, 1.25);
    winG.position.set(-3.1, 1.95, faceZ + 0.16);
    exterior.add(winG);

    const rt = roofTexture(); rt.repeat.set(8, 2);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.1, 2.6),
      new THREE.MeshStandardMaterial({ map: rt, roughness: 0.9 }));
    roof.position.set(0.15, wallH + 2.1 + 0.58, faceZ - 0.74);
    roof.rotation.x = 0.42;
    exterior.add(roof);
    exterior.add(box(9.4, 0.2, 0.14, m(0xe7e0d0), 0.15, wallH + 2.02, faceZ + 0.3));
    const roof2 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.34, 1.5),
      new THREE.MeshStandardMaterial({ map: rt.clone(), roughness: 0.9 }));
    roof2.material.map.repeat.set(6, 1);
    roof2.position.set(0.4, wallH + 0.1, faceZ + 0.32);
    roof2.rotation.x = 0.12;
    exterior.add(roof2);

    exterior.add(box(2.95, landY, 0.72, m(COL.stone, { roughness: 0.95 }), -0.31, landY / 2, 0.36));
    const hd = new THREE.Group();
    hd.add(box(1.02, 2.18, 0.06, m(0xffffff, { roughness: 0.6 }), 0, 1.09, 0));
    hd.add(box(0.9, 2.06, 0.07, m(COL.houseDoor, { roughness: 0.55 }), 0, 1.03, 0.01));
    hd.add(box(0.02, 0.24, 0.03, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), 0.32, 1.02, 0.06));
    hd.position.set(-1.0, landY, faceZ + 0.16);
    exterior.add(hd);

    const st = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      st.add(box(1.1, 0.135 * (i + 1), 0.27, m(0xd6cfc2), 0.62, 0.135 * (i + 1) / 2, 0.86 + (8 - i) * 0.27));
    }
    exterior.add(st);
    exterior.add(railing(stX0 - 0.02, landY, 0.86, 3.02, -0.5));
    exterior.add(railing(stX1 + 0.02, landY, 0.86, 3.02, -0.5));
    exterior.add(railing(-1.72, landY, 0.06, 0.68, 0));

    // --- ÖNCE: açık göz ---
    const before = new THREE.Group();
    const bd = m(COL.bayDark, { roughness: 1 });
    before.add(box(bayX1 - bayX0, wallH, 0.08, bd, (bayX0 + bayX1) / 2, wallH / 2, -1.46));
    before.add(box(0.08, wallH, 1.5, bd, bayX0 + 0.04, wallH / 2, -0.75));
    before.add(box(0.08, wallH, 1.5, bd, bayX1 - 0.04, wallH / 2, -0.75));
    before.add(box(bayX1 - bayX0, 0.1, 1.5, bd, (bayX0 + bayX1) / 2, wallH - 0.05, -0.75));
    before.add(box(bayX1 - bayX0, 0.3, 1.5, m(0x6a5c50, { roughness: 1 }), (bayX0 + bayX1) / 2, 0.15, -0.75));
    before.add(box(0.5, 0.62, 0.5, m(0x2f6e4f, { roughness: 0.7 }), 0.85, 0.61, -0.65));
    before.add(box(0.5, 0.62, 0.5, m(0x8a8d20, { roughness: 0.7 }), 1.55, 0.61, -0.65));
    const bw = new THREE.Group();
    bw.add(box(0.66, 0.56, 0.04, m(0xe8e8e8, { roughness: 0.7 }), 0, 0, 0));
    for (let i = 0; i < 3; i++) bw.add(box(0.03, 0.56, 0.05, m(COL.iron), -0.18 + i * 0.18, 0, 0.01));
    bw.position.set(2.05, 1.9, -1.42);
    before.add(bw);
    exterior.add(before);

    // --- SONRA: sıvalı dolgu duvarı (kapısız — giriş K1'den) + cam bant + menfezler + K1 ---
    const after = new THREE.Group();
    after.add(box(bayX1 - bayX0, wallH, 0.3, m(COL.render), (bayX0 + bayX1) / 2, wallH / 2, faceZ));
    after.add(box(1.0, 0.45, 0.06, new THREE.MeshPhysicalMaterial({
      color: COL.glass, transparent: true, opacity: 0.5, roughness: 0.1 }), 1.7, landY + 2.0, faceZ + 0.16)); // cam bant izi
    after.add(box(0.22, 0.1, 0.05, m(0x8a93a3), 1.8, 0.22, faceZ + 0.17));
    after.add(box(0.22, 0.1, 0.05, m(0x8a93a3), 2.35, 0.22, faceZ + 0.17));

    // K1: merdiven başı sahanlık kapısı
    const d3 = new THREE.Group();
    const aluM = m(COL.alu, { metalness: 0.55, roughness: 0.4 });
    const l3w = k1w;                                   // 0.90 (dimensions'tan)
    const j3 = (stX1 - stX0 - l3w) / 2;
    d3.add(box(j3, 2.2, 0.1, aluM, stX0 + j3 / 2, landY + 1.1, 0.78));
    d3.add(box(j3, 2.2, 0.1, aluM, stX1 - j3 / 2, landY + 1.1, 0.78));
    d3.add(box(stX1 - stX0, 0.06, 0.1, aluM, (stX0 + stX1) / 2, landY + 2.17, 0.78));
    d3.add(box(l3w, 0.02, 0.12, m(COL.alu, { metalness: 0.7, roughness: 0.35 }),
      (stX0 + stX1) / 2, landY + 0.01, 0.78));
    const k1PivotExt = new THREE.Group();
    k1PivotExt.position.set(stX1 - j3, landY, 0.78);   // KUZEY kasa — iç sahneyle aynı yaka
    const leafExt = aluGlazedLeaf(l3w, 2.12);
    leafExt.rotation.y = Math.PI;                       // kanat pivottan güneye uzanır
    leafExt.position.x = 0;
    k1PivotExt.add(leafExt);
    d3.add(k1PivotExt);
    after.add(d3);

    exterior.add(after);
    exterior.userData.before = before;
    exterior.userData.after = after;
    exterior.userData.k1PivotExt = k1PivotExt;

    const sun = new THREE.DirectionalLight(0xfff4e0, 2.6);
    sun.position.set(5, 9, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    exterior.add(sun);
    exterior.add(new THREE.HemisphereLight(0xd8e6f2, 0x8a7f6a, 0.9));
  }

  scene.add(interior);
  scene.add(exterior);

  // ---- durum makinesi ----
  let mode = 'ic';
  let facadeAfter = true;
  let vOpen = false, vAnim = 0, vTarget = 0;
  let k1Open = false, k1Anim = 0, k1Target = 0;

  // WP4 kamera preset'leri
  const PRESETS = {
    k1: { pos: [1.72, 1.85, 1.28], tgt: [0.55, 0.8, 0.25], ceil: true, fov: 70, out: true },
    ayna: { pos: [0.87, 1.55, 1.62], tgt: [0.87, 1.2, 4.0], ceil: true, fov: 58, out: true },
    kus: { pos: [1.0, 7.2, 2.6], tgt: [1.0, 0, 1.95], ceil: false, fov: 50, out: false },
  };

  function applyMode(preset) {
    interior.visible = (mode === 'ic');
    exterior.visible = (mode === 'dis');
    if (mode === 'ic') {
      const p = PRESETS[preset || 'k1'];
      camera.position.set(...p.pos);
      controls.target.set(...p.tgt);
      camera.fov = p.fov; camera.updateProjectionMatrix();
      if (ceilRef) ceilRef.visible = p.ceil;
      interior.userData.outside.visible = p.out;
      scene.background = new THREE.Color(0x2e2a26);
    } else {
      if (ceilRef) ceilRef.visible = true;
      interior.userData.outside.visible = true;
      camera.fov = 58; camera.updateProjectionMatrix();
      camera.position.set(1.4, 2.9, 8.6);
      controls.target.set(0.1, 2.0, 0.2);
      scene.background = new THREE.Color(0xcfdbe6);
      exterior.userData.before.visible = !facadeAfter;
      exterior.userData.after.visible = facadeAfter;
    }
    controls.update();
  }

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', (ev) => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    if (mode === 'ic') {
      if (ray.intersectObject(interior.userData.vPivot, true).length) return toggleDoorV();
      if (ray.intersectObject(interior.userData.k1Pivot, true).length) return toggleDoorK1();
    } else if (facadeAfter) {
      if (ray.intersectObject(exterior.userData.k1PivotExt, true).length) toggleDoorK1();
    }
  });

  function toggleDoorV() {
    vOpen = !vOpen;
    vTarget = vOpen ? 1 : 0;
    if (statusEl) {
      statusEl.textContent = vOpen
        ? tt('model.vAcik', 'V kapısı VESTİYERE içe açıldı — giren kişi aynayı tam karşısında görür.')
        : tt('model.vKapali', 'V kapısı kapandı. Tekrar tıklayarak açılışı izleyebilirsiniz.');
      statusEl.classList.toggle('acik', vOpen);
    }
  }

  function toggleDoorK1() {
    k1Open = !k1Open;
    k1Target = k1Open ? 1 : 0;
    if (statusEl) {
      statusEl.textContent = k1Open
        ? tt('model.k1Acik', 'K1 SAHANLIĞA içe açıldı — asla merdiven üzerine değil (düşme riski).')
        : tt('model.k1Kapali', 'K1 kapandı: merdiven başı güvenli. Tıklayıp açılışı izleyin.');
      statusEl.classList.toggle('acik', k1Open);
    }
  }

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = clock.getDelta();
    vAnim += (vTarget - vAnim) * Math.min(1, dt * 3.2);
    interior.userData.vPivot.rotation.y = -vAnim * (Math.PI / 2) * 0.88;  // ~80°: stoper W1 köşesinde
    k1Anim += (k1Target - k1Anim) * Math.min(1, dt * 3.2);
    interior.userData.k1Pivot.rotation.y = k1Anim * (Math.PI / 2) * 0.9;
    exterior.userData.k1PivotExt.rotation.y = -k1Anim * (Math.PI / 2) * 0.9;  // sahanlığa İÇE
    controls.update();
    renderer.render(scene, camera);
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  applyMode();
  tick();

  return {
    setMode(mo) { mode = mo; applyMode(); },
    toggleFacade() { facadeAfter = !facadeAfter; applyMode(); return facadeAfter; },
    toggleDoorV,
    toggleDoorK1,
    setPreset(p) { if (mode !== 'ic') { mode = 'ic'; } applyMode(p); },
    resize,
  };
}
