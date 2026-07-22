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
// Adlandırma kuralı (geometry_lint kural 5): sahnedeki HER mesh ya kendi adını
// taşır ya da adlı bir grubun altındadır — kimliksiz/amacısız geometri yasak.
function box(w, h, d, mat, x, y, z, name) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  b.position.set(x, y, z);
  if (name) b.name = name;
  return b;
}
function grp(name, ...children) {
  const g = new THREE.Group();
  g.name = name;
  if (children.length) g.add(...children);
  return g;
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

// ---- shaker kapak (pullSide: kulp kenarı; menteşe karşı kenardadır) ----
function shakerDoor(w, h, depth, pullSide, pullY, name) {
  const g = new THREE.Group();
  g.name = name || 'shaker-kapak';
  g.add(box(w, h, depth, m(COL.greige), 0, h / 2, 0, 'kapak-govde'));
  g.add(box(w - 0.14, h - 0.14, depth + 0.006, m(COL.greigeDark, { roughness: 0.9 }), 0, h / 2, 0, 'kapak-cerceve'));
  g.add(box(w - 0.2, h - 0.2, depth + 0.012, m(COL.greige), 0, h / 2, 0, 'kapak-panel'));
  const pull = box(0.012, 0.14, 0.02, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
    pullSide * (w / 2 - 0.05), pullY, depth / 2 + 0.012, 'kapak-kulp');
  g.add(pull);
  return g;
}

// ---- panjurlu pencere (dış cephe) ----
function shutterWindow(w, h) {
  const g = new THREE.Group();
  g.name = 'pencere-panjurlu';
  g.add(box(w + 0.12, h + 0.12, 0.06, m(0xffffff, { roughness: 0.6 }), 0, 0, 0, 'pencere-kasa'));
  g.add(box(w, h, 0.05, new THREE.MeshPhysicalMaterial({
    color: COL.glass, transparent: true, opacity: 0.55, roughness: 0.15 }), 0, 0, 0.015, 'pencere-cam'));
  g.add(box(0.03, h, 0.06, m(0xffffff, { roughness: 0.6 }), 0, 0, 0.03, 'pencere-kayit'));
  g.add(box(w / 2 - 0.02, h + 0.06, 0.04, m(COL.shutter, { roughness: 0.9 }), -(w / 2 + w / 4 + 0.05), 0, 0.02, 'panjur'));
  g.add(box(w / 2 - 0.02, h + 0.06, 0.04, m(COL.shutter, { roughness: 0.9 }), (w / 2 + w / 4 + 0.05), 0, 0.02, 'panjur'));
  return g;
}

// ---- korkuluk ----
function railing(x, y0, z0, z1, slopePerZ) {
  const g = new THREE.Group();
  g.name = 'korkuluk';
  const it = m(COL.iron, { metalness: 0.4, roughness: 0.5 });
  const len = Math.abs(z1 - z0), n = Math.max(2, Math.round(len / 0.45));
  for (let i = 0; i <= n; i++) {
    const z = z0 + (z1 - z0) * (i / n);
    const y = y0 + slopePerZ * (z - z0);
    g.add(box(0.03, 0.95, 0.03, it, x, y + 0.475, z, 'korkuluk-dikme'));
  }
  const rail = box(0.04, 0.05, Math.hypot(len, slopePerZ * len) + 0.05, it,
    x, y0 + slopePerZ * (z1 - z0) / 2 + 0.98, (z0 + z1) / 2, 'korkuluk-kupeste');
  rail.rotation.x = Math.atan2(-slopePerZ * (z1 - z0), (z1 - z0));
  g.add(rail);
  return g;
}

// ---- camlı alüminyum kapı kanadı (K1) ----
function aluGlazedLeaf(w, h) {
  const g = new THREE.Group();
  g.name = 'K1-kanat-camli-alu';
  const aluM = m(COL.alu, { metalness: 0.55, roughness: 0.4 });
  g.add(box(w, h, 0.05, aluM, w / 2, h / 2, 0, 'K1-kanat-cerceve'));
  g.add(box(w - 0.16, h - 0.34, 0.052, new THREE.MeshPhysicalMaterial({
    color: COL.glass, transparent: true, opacity: 0.4, roughness: 0.08 }), w / 2, h / 2 + 0.06, 0, 'K1-kanat-cam'));
  g.add(box(0.02, 0.26, 0.04, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), w - 0.09, 1.0, 0.045, 'K1-kanat-kol'));
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
  const interior = grp('ic-mekan');
  let ceilRef = null;
  {
    const tiles = tileTexture(); tiles.repeat.set(3, 6);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Lt),
      new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, Lt / 2);
    floor.receiveShadow = true;
    floor.name = 'zemin-karo';
    interior.add(floor);

    // jüt yolluk (temsili gevşek donatım): V kapısı aksı -> ayna.
    // Kimlik: bordürlü, hafif kalınlıklı halı — zemindeki "anlamsız dikdörtgen"
    // okumasına karşı kenar bandı + ad (lint kural 5).
    const rug = grp('jut-yolluk-temsili');
    rug.add(box(0.56, 0.012, 1.8, m(COL.jute, { roughness: 1 }), 0, 0.006, 0, 'jut-yolluk-govde'));
    rug.add(box(0.56, 0.013, 0.07, m(0x8a7347, { roughness: 1 }), 0, 0.0065, -0.865, 'jut-yolluk-bordur-g'));
    rug.add(box(0.56, 0.013, 0.07, m(0x8a7347, { roughness: 1 }), 0, 0.0065, 0.865, 'jut-yolluk-bordur-k'));
    rug.position.set(0.87, 0, zV0 + 1.15);
    interior.add(rug);

    // tavan + 3 spot (1 sahanlık, 2 vestiyer)
    ceilRef = box(W, 0.02, Lt, m(COL.ceiling), W / 2, H + 0.01, Lt / 2, 'tavan');
    interior.add(ceilRef);
    for (const [sx, sz] of [[1.0, 0.7], [0.87, 2.1], [0.87, 3.3]]) {
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2dd, emissiveIntensity: 1.6 }));
      spot.position.set(sx, H - 0.006, sz);
      spot.name = 'tavan-spot';
      interior.add(spot);
    }

    const wallT = 0.06;
    const wallM = m(COL.wall, { roughness: 0.92 });
    // ---- güney duvar (z=0): mevcut ev/hall kapısı ----
    interior.add(box(0.5 + wallT, H, wallT, wallM, (0.5 - wallT) / 2, H / 2, -wallT / 2, 'duvar-guney-bati'));
    interior.add(box(W - 1.45 + wallT, H, wallT, wallM, (1.45 + W + wallT) / 2, H / 2, -wallT / 2, 'duvar-guney-dogu'));
    interior.add(box(0.95, H - 2.1, wallT, wallM, 0.975, 2.1 + (H - 2.1) / 2, -wallT / 2, 'duvar-guney-lento'));
    const hallDoor = grp('kapi-ev-hall-mevcut');
    hallDoor.add(box(1.03, 2.14, 0.04, m(0xffffff, { roughness: 0.6 }), 0, 1.07, 0, 'ev-kapi-kasa'));
    hallDoor.add(box(0.91, 2.04, 0.05, m(COL.houseDoor, { roughness: 0.55 }), 0, 1.02, 0.005, 'ev-kapi-kanat'));
    hallDoor.add(box(0.02, 0.24, 0.03, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), 0.34, 1.0, 0.045, 'ev-kapi-kol'));
    hallDoor.position.set(0.975, 0, 0.005);
    interior.add(hallDoor);

    // ---- batı duvar (x=0): sahanlıkta cellier kapısı, vestiyerde W1 arkası ----
    interior.add(box(wallT, H, Lt, wallM, -wallT / 2, H / 2, Lt / 2, 'duvar-bati'));
    const cel = grp('kapi-kiler-mevcut');
    cel.add(box(0.04, 2.1, 0.9, m(0xffffff, { roughness: 0.6 }), 0, 1.05, 0, 'kiler-kapi-kasa'));
    cel.add(box(0.045, 2.0, 0.8, m(COL.greige, { roughness: 0.7 }), 0.004, 1.0, 0, 'kiler-kapi-kanat'));
    cel.position.set(0.035, 0, 0.75);
    interior.add(cel);

    // ---- kuzey duvar (z=Lt) ----
    interior.add(box(W + 2 * wallT, H, wallT, wallM, W / 2, H / 2, Lt + wallT / 2, 'duvar-kuzey'));

    // ---- doğu duvar (x=W): sahanlıkta K1, vestiyerde dolu duvar + cam bant ----
    const east = grp('duvar-dogu');
    const seg = (z0, z1, y0, y1) =>
      east.add(box(wallT, y1 - y0, z1 - z0, wallM, W + wallT / 2, (y0 + y1) / 2, (z0 + z1) / 2, 'duvar-dogu-parca'));
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
      W + wallT / 2, gy0 + gb.height * mm / 2, (gz0 + gz1) / 2, 'cam-bant'));
    interior.add(east);

    // ---- K1 kapısı (sahanlık doğu): kasa + eşik + camlı alu kanat ----
    const aluM = m(COL.alu, { metalness: 0.55, roughness: 0.4 });
    const k1Frame = grp('kapi-K1-kasa');
    k1Frame.add(box(0.1, k1h, 0.05, aluM, W, k1h / 2, k1z0 + 0.025, 'K1-kasa-guney'));
    k1Frame.add(box(0.1, k1h, 0.05, aluM, W, k1h / 2, k1z1 - 0.025, 'K1-kasa-kuzey'));
    k1Frame.add(box(0.1, 0.05, k1z1 - k1z0, aluM, W, k1h + 0.025, (k1z0 + k1z1) / 2, 'K1-kasa-ust'));
    k1Frame.add(box(0.16, 0.02, k1z1 - k1z0, m(COL.alu, { metalness: 0.7, roughness: 0.35 }),
      W + 0.01, 0.01, (k1z0 + k1z1) / 2, 'K1-esik-alu-20mm'));
    interior.add(k1Frame);
    const k1Pivot = grp('kapi-K1-kanat-pivot');
    k1Pivot.position.set(W, 0, k1z1 - 0.05);           // kuzey kasa — sahanlığa İÇE açılır
    const k1Leaf = aluGlazedLeaf(k1w, k1h);
    k1Leaf.rotation.y = Math.PI / 2;                   // kanat -z yönüne uzanır
    k1Pivot.add(k1Leaf);
    interior.add(k1Pivot);

    // K1 dışı vinyet: aşağı inen MEVCUT merdiven (temsili) + korkuluk + gün ışığı.
    // Basamak sayısı dimensions.stair.risers'tan okunur (veri doğrulanana dek
    // "temsili" etiketi taşır — lint kural 4).
    const outside = grp('dis-vinyet');
    const nRiser = D.stair.risers;
    const vinyetStair = grp('merdiven-mevcut-temsili');
    for (let i = 0; i < nRiser; i++) {
      vinyetStair.add(box(0.5 - i * 0.01, 0.02, 1.0, m(COL.stone, { roughness: 0.95 }),
        W + 0.35 + i * (D.stair.going_mm * mm), -0.07 - i * (D.stair.riser_mm * mm), 0.7,
        'vinyet-basamak'));
    }
    outside.add(vinyetStair);
    const vinyetRail = railing(W + 1.45, -0.6, 0.15, 1.25, 0);
    vinyetRail.name = 'vinyet-korkuluk';
    outside.add(vinyetRail);
    const daylight = new THREE.Mesh(new THREE.PlaneGeometry(6, 4),
      new THREE.MeshBasicMaterial({ color: 0xf6ecd9 }));
    daylight.rotation.y = -Math.PI / 2; daylight.position.set(W + 3.2, 1.2, 0.8);
    daylight.name = 'gun-isigi-fonu';
    outside.add(daylight);
    const dayLight = new THREE.PointLight(0xfff2da, 9, 6, 2);
    dayLight.position.set(W + 1.2, 1.7, 0.7);
    outside.add(dayLight);
    interior.add(outside);
    interior.userData.outside = outside;

    // ---- bölme duvarı (z=1.4..1.5) + V kapısı ----
    const part = grp('bolme-duvari');
    part.add(box(vx0, H, pT, wallM, vx0 / 2, H / 2, laD + pT / 2, 'bolme-bati'));
    part.add(box(W - (vx0 + vw), H, pT, wallM, (vx0 + vw + W) / 2, H / 2, laD + pT / 2, 'bolme-dogu'));
    part.add(box(vw, H - vh, pT, wallM, vx0 + vw / 2, vh + (H - vh) / 2, laD + pT / 2, 'bolme-ust'));
    // kasa (meşe)
    const oakTex = woodTexture('#9a7a55', '#7c5f41');
    const oakM = new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.6 });
    part.add(box(0.05, vh, pT + 0.04, oakM, vx0 + 0.025, vh / 2, laD + pT / 2, 'V-kasa-bati'));
    part.add(box(0.05, vh, pT + 0.04, oakM, vx0 + vw - 0.025, vh / 2, laD + pT / 2, 'V-kasa-dogu'));
    part.add(box(vw, 0.05, pT + 0.04, oakM, vx0 + vw / 2, vh - 0.025, laD + pT / 2, 'V-kasa-ust'));
    interior.add(part);
    // V kanadı — Faz 4.1 DÜZELTMESİ: menteşe DOĞU kasada, VESTİYERE içe 90° açılır.
    // (Önceki batı menteşe geometrik olarak imkânsızdı: W1 600 derinlikle bölmeye
    // bitişik; batı menteşeli kanat ~18°'de W1 güney yan panel köşesine çarpar.
    // Doğu menteşede kanat doğu yanda park eder; giriş aksı, ayna görüşü ve W1
    // erişimi boş kalır. V normalde kapalı durur — ısı tamponu.)
    const vPivot = grp('kapi-V-kanat-pivot');
    vPivot.position.set(vx0 + vw - 0.05, 0, zV0 - pT / 2);
    vPivot.rotation.y = Math.PI;                       // kapalı: kanat batıya uzanır
    const vLeaf = grp('V-kanat-mese');
    const vLeafW = vw - 0.1;
    vLeaf.add(box(vLeafW, vh - 0.06, 0.045, oakM, vLeafW / 2, (vh - 0.06) / 2 + 0.01, 0, 'V-kanat-govde'));
    vLeaf.add(box(vLeafW - 0.28, vh - 0.6, 0.047, m(0x8a6c4a, { roughness: 0.7 }),
      vLeafW / 2, vh / 2, 0, 'V-kanat-panel'));
    vLeaf.add(box(0.02, 0.26, 0.035, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
      vLeafW - 0.08, 1.02, 0.04, 'V-kanat-kol'));
    vPivot.add(vLeaf);
    interior.add(vPivot);

    // ---- W1 gardırop (vestiyer batı duvarı, 2 modül) ----
    // Kapak yönü DÜZELTMESİ (Faz 4.1): her modül çifti DIŞ dikmelerden menteşeli,
    // kulplar modül ORTASINDA buluşur (standart çift kapak; eski hâli terchiydi).
    // Köşe kuralı: kuzey modülün kuzey kapağı köşe (kuzey) tarafından menteşeli
    // -> kanat köşeden DIŞA açılır.
    const w1 = grp('W1-gardirop');
    const w1zs = zV0 + 0.075, modW = D.w1_mm.module_width * mm, depth = D.w1_mm.depth * mm;
    const run1 = D.w1_mm.run_total * mm;               // 2.35
    w1.add(box(depth, 0.1, run1, m(COL.greigeDark), depth / 2, 0.05, zV0 + run1 / 2 + 0.0, 'W1-baza'));
    for (let mI = 0; mI < D.w1_mm.modules; mI++) {
      for (let dI = 0; dI < 2; dI++) {
        const z = w1zs + mI * modW + dI * (modW / 2) + modW / 4;
        // dI=0 güney kanat: kulp KUZEY kenarda (modül ortası) -> local -x;
        // dI=1 kuzey kanat: kulp GÜNEY kenarda (modül ortası) -> local +x.
        const door = shakerDoor(modW / 2 - 0.005, 1.95, 0.024, dI === 0 ? -1 : 1, 1.0,
          `W1-kapak-m${mI}-${dI === 0 ? 'g' : 'k'}`);
        door.rotation.y = Math.PI / 2;
        door.position.set(depth, 0.1, z);
        w1.add(door);
        const top = shakerDoor(modW / 2 - 0.005, 0.44, 0.024, dI === 0 ? -1 : 1, 0.1,
          `W1-ustkutu-m${mI}-${dI === 0 ? 'g' : 'k'}`);
        top.rotation.y = Math.PI / 2;
        top.position.set(depth, 2.06, z);
        w1.add(top);
      }
    }
    w1.add(box(depth, 2.4, 0.075, m(COL.niche), depth / 2, 1.3, zV0 + 0.0375, 'W1-yan-panel-guney'));
    w1.add(box(depth, 2.4, 0.075, m(COL.niche), depth / 2, 1.3, zV0 + run1 - 0.0375, 'W1-yan-panel-kuzey'));
    interior.add(w1);

    // ---- B1 bank duvarı (vestiyer doğu) ----
    const b1 = grp('B1-bank-duvari');
    const bRun = D.b1_mm.bench_run * mm;               // 1.6
    const bz0 = zV0 + 0.45, bz1 = bz0 + bRun;          // z 1.95..3.55
    const bx = W - 0.42;
    b1.add(box(0.42, 0.45, bRun, m(COL.greige), bx + 0.21, 0.225, (bz0 + bz1) / 2, 'B1-bank-govde'));
    b1.add(box(0.42, 0.06, bRun, m(COL.charcoal, { roughness: 0.95 }), bx + 0.21, 0.48, (bz0 + bz1) / 2, 'B1-minder'));
    for (let i = 0; i < D.b1_mm.drawers; i++) {
      const z = bz0 + 0.06 + i * (bRun / 2);
      b1.add(box(0.02, 0.26, bRun / 2 - 0.12, m(COL.greigeDark), bx - 0.011, 0.21, z + bRun / 4 - 0.03, 'B1-cekmece-on'));
      b1.add(box(0.012, 0.02, 0.24, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), bx - 0.02, 0.36, z + bRun / 4 - 0.03, 'B1-cekmece-kulp'));
    }
    b1.add(box(0.03, 1.34, bRun, m(COL.panel), W - 0.035, 0.51 + 0.67, (bz0 + bz1) / 2, 'B1-sirt-panel'));
    for (let i = 0; i < D.b1_mm.hooks; i++) {
      const z = bz0 + 0.15 + i * (bRun - 0.3) / (D.b1_mm.hooks - 1);
      b1.add(box(0.02, 0.09, 0.02, m(COL.black, { roughness: 0.4 }), W - 0.06, 1.68, z, 'B1-kanca'));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.016), m(COL.black, { roughness: 0.4 }));
      tip.position.set(W - 0.065, 1.645, z); tip.name = 'B1-kanca-uc'; b1.add(tip);
    }
    // niş bandı + LED
    const nx = W - 0.35;
    b1.add(box(0.35, 0.5, bRun, m(COL.niche), nx + 0.175, 2.1, (bz0 + bz1) / 2, 'B1-nis-band'));
    for (let i = 0; i < D.b1_mm.niche_bays; i++) {
      const z = bz0 + 0.05 + i * (bRun - 0.1) / D.b1_mm.niche_bays;
      b1.add(box(0.31, 0.4, (bRun - 0.1) / D.b1_mm.niche_bays - 0.04, m(0x3a352f, { roughness: 1 }),
        nx + 0.155, 2.09, z + (bRun - 0.1) / (2 * D.b1_mm.niche_bays), 'B1-nis-goz'));
    }
    const led = box(0.3, 0.015, bRun - 0.1, new THREE.MeshStandardMaterial({
      color: COL.ledWarm, emissive: 0xffb45e, emissiveIntensity: 2.0 }), nx + 0.15, 2.31, (bz0 + bz1) / 2, 'B1-led-serit');
    b1.add(led);
    const ledLight = new THREE.PointLight(0xffc37a, 5, 3, 2);
    ledLight.position.set(nx, 2.2, (bz0 + bz1) / 2); b1.add(ledLight);
    b1.add(box(0.35, 0.15, bRun, m(COL.greige), nx + 0.175, 2.425, (bz0 + bz1) / 2, 'B1-ust-dolgu'));
    interior.add(b1);

    // ---- ayakkabı kulesi AK (bölmenin vestiyer yüzü, doğu segment) ----
    // Kapak DÜZELTMESİ (Faz 4.1, bildirilen hata): menteşeli ön kapak bank ucuna
    // (100 mm) çarpıyordu — hiçbir menteşe yönü 85° açılamıyor. Çözüm: ÇİFT RAYLI
    // SÜRME (bypass) kapak, 2 panel — süpürme hacmi SIFIR, ön erişim ve kapasite
    // korunur. Gerekçe S-01/S-03 notlarında ve kapanış raporunda.
    const st = D.b1_mm.shoe_tower_south_corner;
    const stW = st.width * mm, stD = st.depth * mm, stH = st.height * mm;
    const tower = grp('AK-ayakkabi-kulesi');
    tower.add(box(stW, stH, stD, m(COL.greige), 0, stH / 2, 0, 'AK-govde'));
    for (let i = 1; i < 5; i++) {
      tower.add(box(stW - 0.04, 0.014, stD - 0.02, m(COL.greigeDark), 0, 0.25 + i * 0.42, 0.005, 'AK-raf'));
    }
    // sürme panel çifti (kuzey yüz): batı panel önde, doğu panel arkada
    const surgu = grp('AK-surme-kapak');
    surgu.add(box(stW / 2 - 0.004, stH - 0.12, 0.016, m(COL.greigeDark, { roughness: 0.85 }),
      -stW / 4, stH / 2, stD / 2 + 0.020, 'AK-surme-panel-bati'));
    surgu.add(box(stW / 2 - 0.004, stH - 0.12, 0.016, m(COL.greige, { roughness: 0.85 }),
      stW / 4, stH / 2, stD / 2 + 0.002, 'AK-surme-panel-dogu'));
    surgu.add(box(stW, 0.05, 0.05, m(COL.alu, { metalness: 0.6, roughness: 0.4 }),
      0, stH - 0.025, stD / 2 + 0.012, 'AK-surme-ust-ray'));
    surgu.add(box(0.012, 0.12, 0.012, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
      -stW / 4 - 0.11, 1.05, stD / 2 + 0.030, 'AK-surme-kulp-bati'));
    surgu.add(box(0.012, 0.12, 0.012, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
      stW / 4 + 0.11, 1.05, stD / 2 + 0.012, 'AK-surme-kulp-dogu'));
    tower.add(surgu);
    tower.position.set(1.4 + stW / 2, 0, zV0 + stD / 2);
    interior.add(tower);

    // ---- M1 ayna ünitesi (kuzey duvar): ayna + kapaklı kule + köşe rafları + köprü ----
    // Kule kapağı DÜZELTMESİ (Faz 4.1): tek 530 kanat hangi yönden menteşelense
    // bankın kuzey ucunu tarıyordu (15-25° / ~85°'de temas). ÇİFT kapak (2×~262):
    // yay yarıçapı yarıya iner, iki kanat da 90° engelsiz açılır; DIŞ dikme
    // menteşeleri köşe kuralıyla uyumlu (doğu kanat köşe tarafından menteşeli).
    const sur = D.mirror_mm.surround;
    const uX0 = sur.unit_from_west * mm, uW = sur.unit_width * mm, uD = sur.depth * mm;
    const m1 = grp('M1-ayna-unitesi');
    // ayna (gömme niş) — V kapı aksında
    const mir = grp('M1-ayna');
    mir.add(box(0.47, 1.64, 0.03, m(COL.black, { roughness: 0.35 }), 0, 0, 0, 'ayna-cerceve'));
    mir.add(box(0.43, 1.6, 0.032, new THREE.MeshStandardMaterial({
      color: 0xdfe9e8, metalness: 0.9, roughness: 0.08 }), 0, 0, 0.004, 'ayna-cam'));
    mir.position.set(D.mirror_mm.axis_from_west * mm, 0.25 + 0.8, Lt - 0.035);
    m1.add(mir);
    // kapaklı kule (dimensions: x 1.07..1.62) — Faz 4.1: SÜRME kapak (2 panel).
    // Menteşeli kanat (tek 530 ya da çift 262) her yönde bankın kuzey köşesini
    // tarıyordu; sürme süpürmesizdir, ön erişim korunur (AK ile aynı çözüm).
    const tw = sur.door_tower_width * mm, th = sur.door_tower_height * mm;
    const tX0 = uX0 + sur.mirror_recess_width * mm;    // 1.07
    m1.add(box(tw, th, uD, m(COL.greige), tX0 + tw / 2, th / 2, Lt - uD / 2, 'M1-kule-govde'));
    // Sürme donanımı GÖVDE İÇİNE gömülü (ön yüz flush, z >= kule ön düzlemi):
    // W1 kuzey kapak süpürmeleri M1 önüne 80.5°'de yaklaşır — taşan ray/kulp
    // olsaydı temas 77°'ye düşerdi (lint bulgusu). Gömme raylı sürme standart.
    const kSur = grp('M1-kule-surme-kapak');
    const kFace = Lt - uD;                              // 3.70 — kule ön düzlemi
    kSur.add(box(tw / 2 - 0.004, th - 0.1, 0.016, m(COL.greigeDark, { roughness: 0.85 }),
      tX0 + tw / 4, th / 2, kFace + 0.010, 'M1-surme-panel-bati'));
    kSur.add(box(tw / 2 - 0.004, th - 0.1, 0.016, m(COL.greige, { roughness: 0.85 }),
      tX0 + 3 * tw / 4, th / 2, kFace + 0.028, 'M1-surme-panel-dogu'));
    kSur.add(box(tw, 0.04, 0.05, m(COL.alu, { metalness: 0.6, roughness: 0.4 }),
      tX0 + tw / 2, th - 0.06, kFace + 0.028, 'M1-surme-ust-ray'));
    kSur.add(box(0.012, 0.12, 0.010, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
      tX0 + tw / 4 - 0.11, 1.05, kFace + 0.003, 'M1-surme-kulp-bati'));
    kSur.add(box(0.012, 0.12, 0.010, m(COL.brass, { metalness: 0.75, roughness: 0.3 }),
      tX0 + 3 * tw / 4 + 0.11, 1.05, kFace + 0.021, 'M1-surme-kulp-dogu'));
    m1.add(kSur);
    // köşe açık raflar (kule doğusu -> duvar)
    const shW = sur.corner_open_shelf_width * mm;
    const shX0 = tX0 + tw;                             // 1.62
    m1.add(box(0.016, th, uD, m(COL.panel), shX0, th / 2, Lt - uD / 2, 'M1-raf-yan-panel'));
    for (let i = 0; i <= sur.open_shelf_rows; i++) {
      m1.add(box(shW, 0.016, uD - 0.02, m(COL.panel), shX0 + shW / 2, 0.1 + i * (th - 0.1) / sur.open_shelf_rows, Lt - uD / 2, 'M1-acik-raf'));
    }
    // sepetler (köşe raflarında 2 adet — okunur props)
    m1.add(box(shW - 0.06, 0.16, uD - 0.08, m(COL.jute, { roughness: 1 }), shX0 + shW / 2, 0.55, Lt - uD / 2, 'M1-sepet'));
    m1.add(box(shW - 0.06, 0.16, uD - 0.08, m(COL.jute, { roughness: 1 }), shX0 + shW / 2, 1.32, Lt - uD / 2, 'M1-sepet'));
    // üst köprü — Faz 4.1: ayna üzerinden çekildi (yalnız kule+raf üstü,
    // x 1.07..2.0) ve alt kot 2.0 -> 2.1: W1 kuzey kapak/üst kutu süpürmeleri
    // köprü altından serbest geçer; ayna üstü açık kalır.
    const kbW = sur.top_bridge_width * mm;
    const kbX0 = sur.top_bridge_from_west * mm;
    const kbH = sur.top_bridge_height * mm;
    const kbY = sur.top_bridge_level * mm;
    m1.add(box(kbW, kbH, uD, m(COL.greige),
      kbX0 + kbW / 2, kbY + kbH / 2, Lt - uD / 2, 'M1-ust-kopru'));
    m1.add(box(kbW - 0.03, kbH - 0.06, 0.02, m(COL.greigeDark, { roughness: 0.9 }),
      kbX0 + kbW / 2, kbY + kbH / 2, Lt - uD + 0.012, 'M1-kopru-kapak'));  // gömme yüz (flush)
    interior.add(m1);

    // ---- süpürgelikler ----
    const sk = m(COL.panel, { roughness: 0.9 });
    interior.add(box(W, 0.07, 0.014, sk, W / 2, 0.035, Lt - 0.007, 'supurgelik-kuzey'));
    interior.add(box(0.014, 0.07, laD, sk, 0.007, 0.035, laD / 2, 'supurgelik-bati'));

    // ---- bank minderi üstünde sepet + altında 2 çift stilize ayakkabı ----
    b1.add(box(0.32, 0.2, 0.28, m(COL.jute, { roughness: 1 }), bx + 0.21, 0.61, bz1 - 0.25, 'B1-sepet'));
    for (let i = 0; i < 2; i++) {
      const z = bz0 + 0.35 + i * 0.4;
      for (const dx of [-0.06, 0.06]) {
        b1.add(box(0.075, 0.03, 0.24, m(0x4a4038, { roughness: 0.9 }), bx - 0.13 + dx, 0.015, z, 'ayakkabi-taban'));
        b1.add(box(0.07, 0.05, 0.16, m(i ? 0x555b63 : 0x7a4a33, { roughness: 0.9 }), bx - 0.13 + dx, 0.055, z - 0.03, 'ayakkabi-sayasi'));
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
  const exterior = grp('dis-cephe');
  {
    const wallH = 3.4, faceZ = 0;
    const bayX0 = 0.05, bayX1 = 2.65;
    const landY = D.stair.total_rise_mm * mm;          // 1.215 (9×135, temsili)
    const stX0 = 0.07, stX1 = 1.17;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), m(COL.ground, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    ground.name = 'zemin-bahce';
    exterior.add(ground);
    // (Faz 4.1) z=3.9'daki 20×1.7 "kaldırım şeridi" kaldırıldı: hiçbir gerçek
    // nesneye karşılık gelmiyordu ve zeminde kimliksiz dikdörtgen okunuyordu.

    exterior.add(box(4.35, wallH, 0.3, m(COL.cream), bayX0 - 4.35 / 2, wallH / 2, faceZ, 'cephe-zemin-kat-sol'));
    exterior.add(box(1.9, wallH, 0.3, m(COL.cream), bayX1 + 0.95, wallH / 2, faceZ, 'cephe-zemin-kat-sag'));

    exterior.add(box(8.85, 2.1, 0.34, m(COL.cream), 0.15, wallH + 1.05, faceZ + 0.02, 'cephe-ust-kat'));
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
    roof.name = 'cati-kiremit';
    exterior.add(roof);
    exterior.add(box(9.4, 0.2, 0.14, m(0xe7e0d0), 0.15, wallH + 2.02, faceZ + 0.3, 'sacak-oluk'));
    const roof2 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.34, 1.5),
      new THREE.MeshStandardMaterial({ map: rt.clone(), roughness: 0.9 }));
    roof2.material.map.repeat.set(6, 1);
    roof2.position.set(0.4, wallH + 0.1, faceZ + 0.32);
    roof2.rotation.x = 0.12;
    roof2.name = 'sundurma-cati-bandi';
    exterior.add(roof2);

    exterior.add(box(2.95, landY, 0.72, m(COL.stone, { roughness: 0.95 }), -0.31, landY / 2, 0.36, 'veranda-platform'));
    const hd = grp('kapi-ev-giris-mevcut');
    hd.add(box(1.02, 2.18, 0.06, m(0xffffff, { roughness: 0.6 }), 0, 1.09, 0, 'ev-giris-kasa'));
    hd.add(box(0.9, 2.06, 0.07, m(COL.houseDoor, { roughness: 0.55 }), 0, 1.03, 0.01, 'ev-giris-kanat'));
    hd.add(box(0.02, 0.24, 0.03, m(COL.brass, { metalness: 0.75, roughness: 0.3 }), 0.32, 1.02, 0.06, 'ev-giris-kol'));
    hd.position.set(-1.0, landY, faceZ + 0.16);
    exterior.add(hd);

    // TEK mevcut merdiven (Rev B kuralı) — basamak sayısı dimensions'tan, temsili
    const st = grp('merdiven-mevcut-temsili');
    const nR = D.stair.risers;
    for (let i = 0; i < nR; i++) {
      st.add(box(1.1, (D.stair.riser_mm * mm) * (i + 1), D.stair.going_mm * mm, m(0xd6cfc2),
        0.62, (D.stair.riser_mm * mm) * (i + 1) / 2,
        0.86 + (nR - 1 - i) * (D.stair.going_mm * mm), 'basamak'));
    }
    exterior.add(st);
    exterior.add(railing(stX0 - 0.02, landY, 0.86, 3.02, -0.5));
    exterior.add(railing(stX1 + 0.02, landY, 0.86, 3.02, -0.5));
    exterior.add(railing(-1.72, landY, 0.06, 0.68, 0));

    // --- ÖNCE: açık göz ---
    const before = grp('cephe-once-acik-goz');
    const bd = m(COL.bayDark, { roughness: 1 });
    before.add(box(bayX1 - bayX0, wallH, 0.08, bd, (bayX0 + bayX1) / 2, wallH / 2, -1.46, 'goz-arka-duvar'));
    before.add(box(0.08, wallH, 1.5, bd, bayX0 + 0.04, wallH / 2, -0.75, 'goz-yan-duvar'));
    before.add(box(0.08, wallH, 1.5, bd, bayX1 - 0.04, wallH / 2, -0.75, 'goz-yan-duvar'));
    before.add(box(bayX1 - bayX0, 0.1, 1.5, bd, (bayX0 + bayX1) / 2, wallH - 0.05, -0.75, 'goz-tavan'));
    before.add(box(bayX1 - bayX0, 0.3, 1.5, m(0x6a5c50, { roughness: 1 }), (bayX0 + bayX1) / 2, 0.15, -0.75, 'goz-taban-030'));
    before.add(box(0.5, 0.62, 0.5, m(0x2f6e4f, { roughness: 0.7 }), 0.85, 0.61, -0.65, 'cop-konteyner'));
    before.add(box(0.5, 0.62, 0.5, m(0x8a8d20, { roughness: 0.7 }), 1.55, 0.61, -0.65, 'cop-konteyner'));
    const bw = grp('pencere-parmaklikli');
    bw.add(box(0.66, 0.56, 0.04, m(0xe8e8e8, { roughness: 0.7 }), 0, 0, 0, 'parmaklik-pencere-cam'));
    for (let i = 0; i < 3; i++) bw.add(box(0.03, 0.56, 0.05, m(COL.iron), -0.18 + i * 0.18, 0, 0.01, 'parmaklik-demir'));
    bw.position.set(2.05, 1.9, -1.42);
    before.add(bw);
    exterior.add(before);

    // --- SONRA: sıvalı dolgu duvarı (kapısız — giriş K1'den) + cam bant + menfezler + K1 ---
    const after = grp('cephe-sonra-kapali');
    after.add(box(bayX1 - bayX0, wallH, 0.3, m(COL.render), (bayX0 + bayX1) / 2, wallH / 2, faceZ, 'dolgu-duvar-sivali'));
    // cam bant (iç doğu duvardaki 1000×450 sabit camın cephe izi): ÇERÇEVELİ ve
    // gerçek kotunda (FFL +1.25 üstü +2.0) — kimliksiz yüzen dikdörtgen değil.
    const camBantIzi = grp('cam-bant-cephe');
    // gerçek kot FFL(+1.25)+2.0 = ~3.25..3.70; stilize duvar 3.4 olduğundan bandın
    // üstü duvar içinde kalacak şekilde kelepçelenir (illüstratif cephe)
    const cbY = Math.min(
      landY + (D.glazing_band_mm.sill_level * mm) + (D.glazing_band_mm.height * mm) / 2,
      wallH - 0.30);
    camBantIzi.add(box(1.0 + 0.08, 0.45 + 0.08, 0.05, m(0xffffff, { roughness: 0.6 }), 0, 0, 0, 'cam-bant-kasa'));
    camBantIzi.add(box(1.0, 0.45, 0.06, new THREE.MeshPhysicalMaterial({
      color: COL.glass, transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0, 0.01, 'cam-bant-cam'));
    camBantIzi.position.set(1.7, cbY, faceZ + 0.16);
    after.add(camBantIzi);
    after.add(box(0.22, 0.1, 0.05, m(0x8a93a3), 1.8, 0.22, faceZ + 0.17, 'havalandirma-menfez'));
    after.add(box(0.22, 0.1, 0.05, m(0x8a93a3), 2.35, 0.22, faceZ + 0.17, 'havalandirma-menfez'));

    // K1: merdiven başı sahanlık kapısı
    const d3 = grp('kapi-K1-dis');
    const aluM = m(COL.alu, { metalness: 0.55, roughness: 0.4 });
    const l3w = k1w;                                   // 0.90 (dimensions'tan)
    const j3 = (stX1 - stX0 - l3w) / 2;
    d3.add(box(j3, 2.2, 0.1, aluM, stX0 + j3 / 2, landY + 1.1, 0.78, 'K1-dis-kasa'));
    d3.add(box(j3, 2.2, 0.1, aluM, stX1 - j3 / 2, landY + 1.1, 0.78, 'K1-dis-kasa'));
    d3.add(box(stX1 - stX0, 0.06, 0.1, aluM, (stX0 + stX1) / 2, landY + 2.17, 0.78, 'K1-dis-kasa-ust'));
    d3.add(box(l3w, 0.02, 0.12, m(COL.alu, { metalness: 0.7, roughness: 0.35 }),
      (stX0 + stX1) / 2, landY + 0.01, 0.78, 'K1-dis-esik'));
    const k1PivotExt = grp('kapi-K1-dis-kanat-pivot');
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

  // ============ KAPI SİCİLİ + SAHNE MANİFESTİ (geometry_lint veri kaynağı) ============
  // Plan düzlemi: x doğu+, z kuzey+. closedDeg: kapalı kanadın pivottan yönü
  // (0=+x, 90=+z). swingSign: açılış yönü (+1 = closedDeg artar). Tüm menteşe /
  // sürgü kararları ve gerekçeleri buradadır — lint bu sicili sahne AABB'leriyle
  // keser (kural 1) ve köşe kuralını (kural 2) doğrular.
  // (registry initViewer üst kapsamında — iç blok değişkenleri burada yeniden türetilir)
  const surR = D.mirror_mm.surround;
  const uX0R = surR.unit_from_west * mm, uDR = surR.depth * mm;
  const twR = surR.door_tower_width * mm, thR = surR.door_tower_height * mm;
  const tXR = uX0R + surR.mirror_recess_width * mm;      // kule batı dikmesi ~1.07
  const k1z1R = 0.2 + k1w + 0.1;                          // K1 boşluğu kuzey ucu 1.2
  const akT = D.b1_mm.shoe_tower_south_corner;
  const DOOR_REGISTRY = [
    { id: 'K1', type: 'hinged', pivot: [W, k1z1R - 0.05], closedDeg: 270, swingSign: -1,
      leafLen: k1w, maxDeg: 86.4, y: [0, k1h], group: 'kapi-K1-kanat-pivot',
      note: 'sahanliga ICE; mentese kuzey kasa (dimensions.swing_rationale.K1)' },
    { id: 'V', type: 'hinged', pivot: [vx0 + vw - 0.05, zV0 - pT / 2],
      closedDeg: 180, swingSign: -1, leafLen: vw - 0.1, maxDeg: 88, y: [0, vh],
      group: 'kapi-V-kanat-pivot',
      note: 'vestiyere ICE; mentese DOGU kasa (Faz 4.1: bati mentese ~18 derecede W1 yan paneline carpiyordu — geometrik imkansiz)' },
    // W1 çift kapak: DIŞ dikme menteşeleri (Faz 4.1 düzeltmesi), kulplar ortada
    ...[0, 1].flatMap(mI => {
      const zs = zV0 + 0.075 + mI * (D.w1_mm.module_width * mm);
      const half = D.w1_mm.module_width * mm / 2;
      return [
        { id: `W1-m${mI}-g`, type: 'hinged', pivot: [0.6 + 0.024, zs], closedDeg: 90,
          swingSign: -1, leafLen: half - 0.005, maxDeg: 90, y: [0.1, 2.05],
          group: `W1-kapak-m${mI}-g`, note: 'mentese guney dis dikme' },
        Object.assign(
          { id: `W1-m${mI}-k`, type: 'hinged', pivot: [0.6 + 0.024, zs + 2 * half], closedDeg: 270,
            swingSign: 1, leafLen: half - 0.005, maxDeg: 90, y: [0.1, 2.05],
            group: `W1-kapak-m${mI}-k`, note: 'mentese kuzey dis dikme (koseden DISA acilir)' },
          mI === 1 ? { maxDeg: 80, exception: { stopper: true, minDeg: 80,
            rationale: 'M1 kule bati flansi (x>=1.07, z>=3.70) 80.5 derecede yaklasir; 80 derece stoper — kanat dik-acilima yakin, erisim tam' } } : {}),
      ];
    }),
    // M1 kule: SÜRME (Faz 4.1) — menteşeli kanat (tek 530 / çift 262) her yönde
    // bankın kuzey köşesini tarıyordu; sürme süpürmesizdir.
    { id: 'M1-kule-surme', type: 'sliding', pivot: [tXR, Lt - uDR], closedDeg: 0,
      swingSign: 1, leafLen: twR, maxDeg: 0, y: [0.02, thR - 0.02],
      group: 'M1-kule-surme-kapak',
      note: 'cift rayli bypass surme, 2 panel — bank kuzey kosesi yay problemi kokten cozuldu (Faz 4.1)' },
    // W1 üst kutu kapakları: yan menteşeli çiftler (tall kapaklarla aynı yaylar,
    // y 2.06..2.5). Kuzey uçtaki m1-k kutusu M1 köprüsüne 80.5°'de yaklaşır —
    // 80° stoperli gerekçeli istisna.
    ...[0, 1].flatMap(mI => {
      const zs = zV0 + 0.075 + mI * (D.w1_mm.module_width * mm);
      const half = D.w1_mm.module_width * mm / 2;
      const mk = (dI) => ({
        id: `W1-ust-m${mI}-${dI === 0 ? 'g' : 'k'}`, type: 'hinged',
        pivot: [0.6 + 0.024, dI === 0 ? zs : zs + 2 * half],
        closedDeg: dI === 0 ? 90 : 270, swingSign: dI === 0 ? -1 : 1,
        leafLen: half - 0.005, maxDeg: 90, y: [2.06, 2.5],
        group: `W1-ustkutu-m${mI}-${dI === 0 ? 'g' : 'k'}`,
        note: 'ust kutu, yan menteseli cift',
      });
      const g = mk(0), k = mk(1);
      if (mI === 1) {
        k.maxDeg = 80;
        k.exception = { stopper: true, minDeg: 80,
          rationale: 'M1 ust koprusu (x>=1.07, y>=2.10) 80.5 derecede yaklasir; 80 derece stoper — nadir erisimli sezonluk kutu' };
      }
      return [g, k];
    }),
    // AK sürme: süpürme hacmi SIFIR — bank ucu 100 mm oldugu icin mentese cozumu yok
    { id: 'AK-surme', type: 'sliding', pivot: [1.4, zV0 + akT.depth * mm], closedDeg: 0,
      swingSign: 1, leafLen: akT.width * mm, maxDeg: 0, y: [0, akT.height * mm],
      group: 'AK-surme-kapak',
      note: 'cift rayli bypass surme, 2 panel — bank ucuna carpma sorununun cozumu (Faz 4.1)' },
    // B1 çekmeceler: doğrusal açılım (Tandembox ~450 mm batıya)
    { id: 'B1-cekmece', type: 'drawer', pivot: [W - 0.42, zV0 + 0.45 + D.b1_mm.bench_run * mm / 2],
      closedDeg: 180, swingSign: 0, leafLen: 0.45, maxDeg: 0, y: [0.08, 0.34],
      group: 'B1-cekmece-on', note: 'dogrusal acilim batiya; koridor genisligi yeterli' },
    // Mevcut kapılar (kapsam dışı — lint bilgi amaçlı listeler, yay testi yok)
    { id: 'ev-hall', type: 'mevcut-kapsam-disi', pivot: [0.975, 0], closedDeg: 0, swingSign: 0,
      leafLen: 0.91, maxDeg: 0, y: [0, 2.04], group: 'kapi-ev-hall-mevcut', note: 'degismez' },
    { id: 'kiler', type: 'mevcut-kapsam-disi', pivot: [0.035, 0.75], closedDeg: 90, swingSign: 0,
      leafLen: 0.8, maxDeg: 0, y: [0, 2.0], group: 'kapi-kiler-mevcut', note: 'degismez' },
  ];

  function buildManifest() {
    scene.updateMatrixWorld(true);
    const meshes = [];
    const bbox = new THREE.Box3();
    for (const top of [interior, exterior]) {
      top.traverse(obj => {
        if (!obj.isMesh) return;
        let eff = '', p = obj, path = [];
        while (p && p !== scene) { path.unshift(p.name || '?'); if (!eff && p.name) eff = p.name; p = p.parent; }
        bbox.setFromObject(obj);
        meshes.push({
          name: obj.name || '', effName: eff, path: path.join('/'),
          top: top.name,
          inBefore: !!obj.parent && isDescendant(obj, before_ref),
          inAfter: !!obj.parent && isDescendant(obj, after_ref),
          box: { min: [bbox.min.x, bbox.min.y, bbox.min.z], max: [bbox.max.x, bbox.max.y, bbox.max.z] },
        });
      });
    }
    const stairs = [];
    scene.traverse(obj => {
      if (obj.isGroup && /^merdiven-/.test(obj.name)) {
        stairs.push({
          name: obj.name, top: topName(obj),
          risers: obj.children.filter(c => c.isMesh && /basamak/.test(c.name)).length,
        });
      }
    });
    return {
      generated: 'model.js buildManifest',
      dims: { stair: D.stair, revision: D.meta.revision },
      doors: DOOR_REGISTRY.map(d => ({ ...d })),
      stairs,
      meshes,
    };
  }
  const before_ref = exterior.userData.before || exterior.getObjectByName('cephe-once-acik-goz');
  const after_ref = exterior.userData.after || exterior.getObjectByName('cephe-sonra-kapali');
  function isDescendant(obj, anc) {
    for (let p = obj; p; p = p.parent) if (p === anc) return true;
    return false;
  }
  function topName(obj) {
    for (let p = obj; p; p = p.parent) if (p === interior) return 'ic-mekan'; else if (p === exterior) return 'dis-cephe';
    return '?';
  }
  window.__VESTIYER_MANIFEST = buildManifest;

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
    // V doğu menteşe: kapalı taban π; açılış vestiyere doğru 88° (90° kapı stopu)
    interior.userData.vPivot.rotation.y = Math.PI + vAnim * (Math.PI / 2) * 0.978;
    k1Anim += (k1Target - k1Anim) * Math.min(1, dt * 3.2);
    interior.userData.k1Pivot.rotation.y = k1Anim * (Math.PI / 2) * 0.96;      // 86.4° ≥ 85 kuralı
    exterior.userData.k1PivotExt.rotation.y = -k1Anim * (Math.PI / 2) * 0.96;  // sahanlığa İÇE
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
