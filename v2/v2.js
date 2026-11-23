// v2 hero: a crew of small voxel Grays runs in and builds a big voxel Gray block by block, then jumps up and
// becomes the missing hard hat. Scroll down and they break off and walk to the next section; scroll back and
// they rebuild the hat. Hold the mouse to blast the figure apart; click the hat or a builder for a tip.
import * as THREE from 'three';

const canvas = document.getElementById('stage');
const tipEl = document.querySelector('.tip');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- colours (emerald is the only accent) ----------
const C = {
  skin: '#C68B61', skinD: '#AE7550', hair: '#17120F', shirt: '#D9DED9', vest: '#26352D', strip: '#3FCF8E',
  belt: '#7A5230', pouch: '#664326', buckle: '#C9B27A', denim: '#33445F', shoe: '#1B1E1D', glove: '#C59F62',
  eye: '#1A1412', teeth: '#F3F0E8', mouth: '#8E4A3C', button: '#2A2F2C', hat: '#3FCF8E', hatD: '#2FA873',
};

function rng(seed) { // small seeded random, so the curls are the same on every visit
  return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function model() { // returns a Map "x,y,z" -> colour
  const m = new Map();
  const put = (x, y, z, c) => m.set(x + ',' + y + ',' + z, c);
  const box = (x0, x1, y0, y1, z0, z1, c) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
  return { m, put, box };
}
function hollow(m) { // keep only voxels with at least one open face
  const out = [];
  for (const [k, c] of m) {
    const [x, y, z] = k.split(',').map(Number);
    const n = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([a, b, d]) => !m.has((x + a) + ',' + (y + b) + ',' + (z + d)));
    if (n) out.push({ x, y, z, c });
  }
  return out;
}

function bigGray() {
  const { m, put, box } = model();
  box(-4, -1, 0, 1, -2, 3, C.shoe); box(1, 4, 0, 1, -2, 3, C.shoe);
  box(-4, -1, 2, 9, -2, 1, C.denim); box(1, 4, 2, 9, -2, 1, C.denim);
  box(-4, 4, 10, 11, -2, 2, C.belt); box(-1, 1, 10, 11, 2, 2, C.buckle);
  box(-4, -2, 7, 10, 3, 3, C.pouch); box(2, 4, 7, 10, 3, 3, C.pouch);
  box(-4, 4, 12, 21, -2, 2, (x, y, z) => {
    if (z === 2 && Math.abs(x) <= 1) return (x === 0 && (y === 14 || y === 18)) ? C.button : C.shirt; // the shirt shows down the front
    if (y === 21 && Math.abs(x) <= 2 && z >= 1) return C.shirt; // collar
    return y === 16 ? C.strip : C.vest;
  });
  const arm = (x0, x1) => box(x0, x1, 10, 21, -1, 1, (x, y) => y >= 18 ? C.shirt : y <= 11 ? C.glove : C.skin);
  arm(-7, -6); arm(6, 7); // one voxel of air between arm and body
  box(-5, -5, 20, 21, -1, 1, C.shirt); box(5, 5, 20, 21, -1, 1, C.shirt); // shoulders
  box(-1, 1, 22, 22, -1, 1, C.skin);
  box(-4, 4, 23, 31, -4, 4, C.skin);
  box(-2, -2, 27, 28, 4, 4, C.eye); box(2, 2, 27, 28, 4, 4, C.eye); // narrow eyes, so they don't read as sunglasses
  box(-3, -2, 30, 30, 4, 4, C.hair); box(2, 3, 30, 30, 4, 4, C.hair);
  put(0, 26, 5, C.skinD);
  box(-2, 2, 25, 25, 4, 4, C.teeth); box(-1, 1, 24, 24, 4, 4, C.mouth);
  box(-5, -5, 26, 28, -1, 0, C.skin); box(5, 5, 26, 28, -1, 0, C.skin);
  // short curly black hair
  box(-4, 4, 31, 33, -4, 4, (x, y, z) => (y === 31 && z === 4 && Math.abs(x) <= 3) ? C.hair : C.hair);
  box(-4, 4, 24, 33, -5, -5, C.hair);
  box(-5, -5, 29, 32, -4, 2, C.hair); box(5, 5, 29, 32, -4, 2, C.hair);
  const r = rng(7);
  for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) if (x * x + z * z <= 26 && r() < 0.5) put(x, 34, z, C.hair);
  for (let y = 30; y <= 33; y++) for (let z = -4; z <= 2; z++) { if (r() < 0.3) put(-6, y, z, C.hair); if (r() < 0.3) put(6, y, z, C.hair); }
  const body = hollow(m);

  // the hard hat: the missing piece the crew turns into
  const h = model();
  const dome = [6.2, 5.8, 5.1, 3.9];
  for (let i = 0; i < 4; i++) for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) if (x * x + z * z <= dome[i] * dome[i]) h.put(x, 35 + i, z, C.hat);
  for (let x = -7; x <= 7; x++) for (let z = -7; z <= 9; z++) {
    const zz = z > 0 ? z * 0.78 : z;
    if (x * x + zz * zz <= 49 && !m.has(x + ',34,' + z)) h.put(x, 34, z, C.hatD);
  }
  h.box(0, 0, 39, 39, -3, 3, C.hatD);
  return { body, hat: hollow(h.m) };
}

function miniGray() {
  const { m, put, box } = model();
  box(-2, -1, 0, 0, -1, 1, C.shoe); box(1, 2, 0, 0, -1, 1, C.shoe);
  box(-2, -1, 1, 2, -1, 0, C.denim); box(1, 2, 1, 2, -1, 0, C.denim);
  box(-2, 2, 3, 3, -1, 1, C.belt); put(0, 3, 1, C.buckle);
  box(-2, 2, 4, 6, -1, 1, (x, y, z) => (z === 1 && x === 0) ? C.shirt : y === 5 ? C.strip : C.vest);
  box(-3, -3, 3, 6, 0, 0, (x, y) => y === 6 ? C.shirt : y === 3 ? C.glove : C.skin);
  box(3, 3, 3, 6, 0, 0, (x, y) => y === 6 ? C.shirt : y === 3 ? C.glove : C.skin);
  box(-2, 2, 7, 10, -2, 2, C.skin);
  put(-1, 9, 2, C.eye); put(1, 9, 2, C.eye); put(0, 8, 2, C.teeth);
  box(-2, 2, 10, 10, -2, -2, C.hair); box(-2, -2, 10, 10, -2, 0, C.hair); box(2, 2, 10, 10, -2, 0, C.hair);
  box(-3, 3, 11, 11, -3, 3, (x, y, z) => (Math.abs(x) === 3 && Math.abs(z) === 3) ? null : C.hatD);
  box(-2, 2, 12, 13, -2, 2, (x, y, z) => (y === 13 && Math.abs(x) === 2 && Math.abs(z) === 2) ? null : C.hat);
  for (const [k, c] of m) if (!c) m.delete(k);
  return hollow(m);
}

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setClearColor('#0D110F');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#0D110F', 120, 220);
const camera = new THREE.PerspectiveCamera(35, 1, 1, 400);
const CAM_Z = 95;
camera.position.set(0, 19, CAM_Z);

scene.add(new THREE.HemisphereLight('#DFE9E3', '#0D110F', 1.6));
const sun = new THREE.DirectionalLight('#FFFFFF', 2.4); sun.position.set(30, 60, 50); scene.add(sun);
const rim = new THREE.DirectionalLight('#3FCF8E', 2.2); rim.position.set(-40, 30, -50); scene.add(rim);

const fig = new THREE.Group(); scene.add(fig); // the big Gray: feet at y = 0
const cube = new THREE.BoxGeometry(0.94, 0.94, 0.94);
const { body, hat } = bigGray();

function instanced(list, mat) {
  const mesh = new THREE.InstancedMesh(cube, mat, list.length);
  const col = new THREE.Color();
  list.forEach((v, i) => mesh.setColorAt(i, col.set(v.c)));
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}
const bodyMesh = instanced(body, new THREE.MeshStandardMaterial({ roughness: 0.75 }));
const hatMesh = instanced(hat, new THREE.MeshStandardMaterial({ roughness: 0.45, emissive: '#3FCF8E', emissiveIntensity: 0.28 }));
fig.add(bodyMesh, hatMesh);

// the crate the crew starts in (intro only); a small emerald stamp on the front
function crateModel() {
  const { m, box } = model();
  box(-4, 4, 0, 7, -4, 4, (x, y, z) => {
    if (z === 4 && (y === 3 || y === 4) && Math.abs(x) <= 1) return C.hat;
    const edge = (Math.abs(x) === 4) + (Math.abs(z) === 4) + (y === 0 || y === 7) >= 2;
    return edge ? '#5A3D22' : (y % 2 ? '#8A6239' : '#7C5733');
  });
  return hollow(m).map(v => ({ ...v, z: v.z + 7 }));
}
const crateList = crateModel();
const crateMesh = instanced(crateList, new THREE.MeshStandardMaterial({ roughness: 0.85 }));
fig.add(crateMesh);

// a soft emerald glow on the floor
{
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(63,207,142,.35)'); gr.addColorStop(1, 'rgba(63,207,142,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5; fig.add(floor);
}

// spare blocks drifting in the dark, behind everything
const SPARE = 46, spareMesh = new THREE.InstancedMesh(cube, new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: '#3FCF8E', emissiveIntensity: 0.06 }), SPARE);
const spares = [];
{
  const r = rng(3), col = new THREE.Color();
  for (let i = 0; i < SPARE; i++) {
    spares.push({ x: (r() - 0.5) * 150, y: r() * 110 - 30, z: -20 - r() * 70, s: 0.4 + r() * 1.6, sp: 0.2 + r() * 0.6, a: r() * 6 });
    spareMesh.setColorAt(i, col.set(r() < 0.18 ? '#2FA873' : '#1F2A25'));
  }
  scene.add(spareMesh);
}

// ---------- the crew ----------
const miniList = miniGray();
const MINI = 0.34;
let crewCount = 8;
const crew = [];
function makeMini() {
  const mesh = instanced(miniList, new THREE.MeshStandardMaterial({ roughness: 0.7 }));
  const mat = new THREE.Matrix4();
  miniList.forEach((v, i) => mesh.setMatrixAt(i, mat.makeTranslation(v.x, v.y, v.z)));
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

// ---------- layout ----------
let figScale = 1, figX = 0, camY = 19, unitsPerPx = 0.1, mobile = false;
const slots = []; // where each builder stands, in the big figure's local space
function layout() {
  const w = innerWidth, h = innerHeight;
  mobile = w < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  figScale = mobile ? 0.55 : 0.86;
  camY = mobile ? 27 : 22; // phones: feet just above the bottom edge, head below the buttons
  figX = mobile ? 0 : Math.min(14, 6 * camera.aspect); // a little right of centre, clear of the headline
  camera.position.set(0, camY, CAM_Z); camera.lookAt(0, camY, 0);
  camera.updateProjectionMatrix();
  unitsPerPx = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / h;
  fig.scale.setScalar(figScale);
  fig.position.x = figX;
  fig.updateMatrixWorld();
  if (!crew.length) { // the crew size is fixed on first load; the hat is split for it
    crewCount = mobile ? 5 : 8;
    while (crew.length < crewCount) crew.push({ mesh: makeMini(), pos: new THREE.Vector3(), mode: 'wait', s: 1, tw: null, hop: -9, dodge: 0, face: 0, k: crew.length });
  }
  slots.length = 0;
  const span = mobile ? 15 : 18;
  for (let k = 0; k < crewCount; k++) slots.push(new THREE.Vector3(-span + (2 * span) * k / (crewCount - 1), 0, 9 + (k % 2) * 2));
}
layout();
addEventListener('resize', layout);

const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), q = new THREE.Quaternion(), mat = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1).normalize();
function screenToWorld(fx, fy, planeZ, out) {
  out.set(fx * 2 - 1, -(fy * 2 - 1), 0.5).unproject(camera).sub(camera.position).normalize();
  const t = (planeZ - camera.position.z) / out.z;
  return out.multiplyScalar(t).add(camera.position);
}
const slotWorld = (k, out) => fig.localToWorld(out.copy(slots[k]));

// ---------- blocks ----------
function blocks(list) { return list.map(v => ({ target: new THREE.Vector3(v.x, v.y, v.z), pos: new THREE.Vector3(v.x, v.y, v.z), from: new THREE.Vector3(), vel: new THREE.Vector3(), axis: new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize(), ang: 0, spin: 0, s: 0, mode: 'hidden', t: 0, arc: 0, who: 0 })); }
const B = blocks(body), H = blocks(hat), K = blocks(crateList);

// each builder throws the blocks on its side of the figure, bottom row first
B.forEach(b => { b.who = Math.min(7, Math.max(0, Math.floor((b.target.x + 8) / 16 * 8))); });
const order = B.map((b, i) => [b.target.y + Math.random() * 1.5, i]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
order.forEach(i => { B[i].arc = 5 + B[i].target.y * 0.18; B[i].spin = (Math.random() - .5) * 8; });
function scheduleGray(t0, span) { order.forEach((i, rank) => { B[i].mode = 'wait'; B[i].t = t0 + rank / B.length * span; }); }

// the hat is split into wedges, one per builder
let hatGroups = [];
function splitHat() {
  const idx = H.map((b, i) => [Math.atan2(b.target.z, b.target.x), i]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  hatGroups = [];
  const per = Math.ceil(idx.length / crewCount);
  for (let k = 0; k < crewCount; k++) {
    const ids = idx.slice(k * per, (k + 1) * per), c = new THREE.Vector3();
    ids.forEach(i => c.add(H[i].target)); c.divideScalar(Math.max(1, ids.length));
    hatGroups.push({ ids, centre: c });
    ids.forEach(i => { H[i].who = k; });
  }
}
splitHat();

function writeBlocks(list, mesh, now, dt) {
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    switch (b.mode) {
      case 'wait': b.s = 0; if (state === 'build' && now >= b.t) { const m = crew[b.who % crewCount]; fig.worldToLocal(b.from.copy(m.pos).add(tmp.set(0, 4.5 * figScale, 0))); b.mode = 'fly'; b.t0 = now; m.throwT = now; } break;
      case 'fly': {
        const u = Math.min(1, (now - b.t0) / 0.6), e = 1 - Math.pow(1 - u, 3);
        b.pos.lerpVectors(b.from, b.target, e); b.pos.y += Math.sin(Math.PI * u) * b.arc;
        b.ang = (1 - u) * b.spin; b.s = 0.4 + 0.6 * Math.min(1, u * 3);
        if (u >= 1) { b.mode = 'set'; b.pos.copy(b.target); b.ang = 0; b.s = 1; }
        break;
      }
      case 'set': if (blasting) { b.mode = 'blast'; kick(b); } break;
      case 'blast': b.pos.addScaledVector(b.vel, dt); b.vel.multiplyScalar(Math.pow(0.08, dt)); b.ang += b.spin * dt; if (!blasting) b.mode = 'back'; break;
      case 'back': {
        const k = 1 - Math.exp(-dt * 6);
        b.pos.lerp(b.target, k); b.ang *= 1 - k;
        if (blasting) { b.mode = 'blast'; kick(b); } else if (b.pos.distanceToSquared(b.target) < 0.0004) { b.mode = 'set'; b.pos.copy(b.target); b.ang = 0; }
        break;
      }
      case 'pop': { const u = Math.max(0, Math.min(1, (now - b.t0) / 0.35)); b.pos.copy(b.target); b.s = backOut(u); if (u >= 1) { b.mode = 'set'; b.s = 1; } break; }
      case 'shrink': { const u = Math.min(1, (now - b.t0) / 0.2); b.s = 1 - u; if (u >= 1) b.mode = 'hidden'; break; }
      case 'toss': // thrown loose (the crate lid and walls), then gone
        if (now < b.t0) break;
        b.vel.y -= 45 * dt; b.pos.addScaledVector(b.vel, dt); b.ang += b.spin * dt;
        if (now - b.t0 > 0.9) { b.mode = 'shrink'; b.t0 = now; }
        break;
      case 'hidden': b.s = 0; break;
    }
    q.setFromAxisAngle(b.axis, b.ang);
    mesh.setMatrixAt(i, mat.compose(b.pos, q, tmp2.set(b.s, b.s, b.s)));
  }
  mesh.instanceMatrix.needsUpdate = true;
}
function kick(b) {
  b.vel.copy(b.pos).sub(tmp.set(0, 19, 0)).normalize().multiplyScalar(22 + Math.random() * 30);
  b.vel.y += 6 + Math.random() * 10;
  b.spin = (Math.random() - .5) * 10;
}
function backOut(u) { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }

// ---------- crew moves ----------
function jump(m, toFn, dur, arc, s0, s1, after, delay = 0) {
  m.tw = { from: m.pos.clone(), toFn, t0: now + delay, dur, arc, s0, s1, after };
}
function awayPos(k, out) { // the crew stands at the top of the next section and rides along with it
  const top = (innerHeight - scrollY) / innerHeight;
  const fy = Math.min(0.95, Math.max(0.3, top + (mobile ? 0.1 : 0.16)));
  const fx = mobile ? 0.14 + k * 0.18 : 0.56 + k * 0.05;
  return screenToWorld(fx, fy, 10, out);
}
const hatCentreWorld = (k, out) => fig.localToWorld(out.copy(hatGroups[k].centre));

function toHat(m, delay) {
  m.mode = 'jump';
  jump(m, o => hatCentreWorld(m.k, o), 0.75, 12, 1, 0.25, () => {
    m.mode = 'hat'; m.mesh.visible = false;
    hatGroups[m.k].ids.forEach((i, n) => { H[i].mode = 'pop'; H[i].t0 = now + n * 0.006; });
  }, delay);
}
function fromHat(m, dest, delay) {
  hatGroups[m.k].ids.forEach(i => { if (H[i].mode !== 'hidden') { H[i].mode = 'shrink'; H[i].t0 = now + delay; } });
  hatCentreWorld(m.k, m.pos);
  m.mode = 'jump'; m.s = 0.25;
  jump(m, o => dest === 'away' ? awayPos(m.k, o) : slotWorld(m.k, o), 0.8, 10, 0.25, 1, () => { m.mode = dest; }, delay);
}

// ---------- state ----------
let now = 0, state = 'enter', blasting = false, peekUntil = 0;
const mouse = { x: 0, y: 0, in: false }, cursor = new THREE.Vector3();

const root = document.documentElement;
function endIntro() { root.classList.remove('intro'); try { sessionStorage.setItem('gt-v2-intro', '1'); } catch (e) { /* storage blocked: the intro just plays again */ } }

// repeat visits in the same tab: the page is already there, the crew runs in and builds only the figure
function start() {
  crew.forEach((m, k) => {
    if (k >= crewCount) { m.mesh.visible = false; return; }
    slotWorld(k, m.pos); m.pos.x += (k < crewCount / 2 ? -1 : 1) * 70;
    m.mode = 'jump'; m.run = true;
    jump(m, o => slotWorld(k, o), 1.0 + k * 0.04, 0, 1, 1, () => { m.mode = 'base'; m.run = false; });
  });
  scheduleGray(1.15, 2.7);
  state = 'build';
}

// first visit: the crew is packed in a crate. It shakes, the lid pops, they jump out and build every part of the
// page (each element is revealed block by block as a builder walks along it), then the figure, then the hat.
const OPEN = 0.75;
function elPoint(el, side, out) {
  const r = el.getBoundingClientRect();
  return screenToWorld((side ? r.right - 6 : r.left + 6) / innerWidth, Math.min(0.97, (r.bottom + 4) / innerHeight), 10, out);
}
function nextJob(m) {
  const el = m.jobs.shift();
  if (!el) { m.mode = 'jump'; jump(m, o => slotWorld(m.k, o), 0.7, 8, 1, 1, () => { m.mode = 'base'; }); return; }
  jump(m, o => elPoint(el, 0, o), 0.45, 3, 1, 1, () => {
    el.classList.add('built'); m.run = true;
    jump(m, o => elPoint(el, 1, o), 0.55, 0, 1, 1, () => { m.run = false; nextJob(m); });
  });
}
function intro() {
  K.forEach(b => { b.mode = 'set'; b.s = 1; });
  B.forEach(b => { b.mode = 'wait'; b.t = Infinity; });
  const els = [...document.querySelectorAll('.bld')].filter(el => el.getClientRects().length)
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  crew.slice(0, crewCount).forEach(m => { m.jobs = []; });
  els.forEach((el, j) => crew[j % crewCount].jobs.push(el));
  K.forEach(b => { // lid flies up at OPEN, the walls fall apart once everyone is out
    const lid = b.target.y === 7;
    b.t0 = lid ? OPEN : OPEN + crewCount * 0.11 + 0.35;
    b.vel.set((b.target.x) * (lid ? 1.2 : 2.2) + (Math.random() - .5) * 6, lid ? 22 + Math.random() * 14 : 6 + Math.random() * 6, (b.target.z - 7) * (lid ? 1.2 : 2.2));
    b.spin = (Math.random() - .5) * 12;
    b.mode = 'toss';
  });
  crew.slice(0, crewCount).forEach((m, k) => {
    fig.localToWorld(m.pos.set(0, 1, 7)); // inside the crate, hidden by its walls
    m.mode = 'jump';
    jump(m, o => m.jobs.length ? elPoint(m.jobs[0], 0, o) : slotWorld(k, o), 0.6, 10, 0.4, 1, () => nextJob(m), OPEN + 0.1 + k * 0.11);
  });
  state = 'page';
}
function finishNow() { // reduced motion, or "Skip intro": everything finished, nothing moving
  endIntro();
  B.forEach(b => { b.mode = 'set'; b.s = 1; b.ang = 0; b.pos.copy(b.target); });
  H.forEach(b => { b.mode = 'set'; b.s = 1; });
  K.forEach(b => { b.mode = 'hidden'; });
  crew.forEach(m => { m.mode = 'hat'; m.tw = null; m.run = false; m.mesh.visible = false; });
  state = 'done';
}
if (reduced) finishNow(); else if (root.classList.contains('intro')) intro(); else start();
const skipBtn = document.querySelector('.skip-intro');
if (skipBtn) skipBtn.addEventListener('click', finishNow);

function updateCrew(dt) {
  screenToWorld((mouse.x + 1) / 2, (1 - mouse.y) / 2, 10, cursor);
  for (let k = 0; k < crewCount; k++) {
    const m = crew[k];
    if (m.mode === 'hat' || m.mode === 'wait') { m.mesh.visible = false; continue; }
    m.mesh.visible = true;
    let bob = 0;
    if (m.tw && now >= m.tw.t0) {
      const t = m.tw, u = Math.min(1, (now - t.t0) / t.dur), e = u * u * (3 - 2 * u);
      t.toFn(tmp);
      m.pos.lerpVectors(t.from, tmp, e); m.pos.y += Math.sin(Math.PI * u) * t.arc;
      m.s = t.s0 + (t.s1 - t.s0) * e;
      if (m.run) bob = Math.abs(Math.sin(now * 16)) * 0.9;
      if (u >= 1) { m.tw = null; t.after && t.after(); }
    } else if (m.mode === 'base') slotWorld(k, m.pos);
    else if (m.mode === 'away') awayPos(k, m.pos);
    // look at the cursor, step aside when it gets close
    const dx = cursor.x - m.pos.x, near = mouse.in && Math.hypot(dx, cursor.y - (m.pos.y + 2)) < 3.2;
    m.dodge += ((near ? -Math.sign(dx || 1) * 3 : 0) - m.dodge) * Math.min(1, dt * 8);
    m.face += ((mouse.in ? THREE.MathUtils.clamp(dx * 0.08, -1.1, 1.1) : 0) - m.face) * Math.min(1, dt * 6);
    const hop = now - m.hop < 0.5 ? Math.sin(Math.PI * (now - m.hop) / 0.5) * 2.6 : 0;
    const thr = m.throwT && now - m.throwT < 0.25 ? Math.sin(Math.PI * (now - m.throwT) / 0.25) * 0.5 : 0;
    m.mesh.position.set(m.pos.x + (m.mode === 'base' || m.mode === 'away' ? m.dodge : 0), m.pos.y + bob + hop + thr, m.pos.z);
    m.mesh.rotation.y = m.face;
    m.mesh.scale.setScalar(MINI * figScale * m.s);
  }
}

function stateStep() {
  const sy = scrollY / innerHeight;
  if (state === 'page' && crew.slice(0, crewCount).every(m => m.mode === 'base' && !m.tw)) { // the page is built: now the figure
    endIntro();
    scheduleGray(now + 0.15, 2.3);
    state = 'build';
  } else if (state === 'build' && B.every(b => b.mode === 'set') && crew.slice(0, crewCount).every(m => m.mode === 'base')) {
    crew.slice(0, crewCount).forEach((m, k) => toHat(m, k * 0.08));
    state = 'capping';
  } else if (state === 'capping' && crew.slice(0, crewCount).every(m => m.mode === 'hat')) state = 'done';
  else if (state === 'done' && sy > 0.3 && !reduced) { crew.slice(0, crewCount).forEach((m, k) => fromHat(m, 'away', k * 0.05)); state = 'out'; }
  else if (state === 'out' && sy < 0.15 && crew.slice(0, crewCount).every(m => !m.tw)) { crew.slice(0, crewCount).forEach((m, k) => toHat(m, k * 0.05)); state = 'capping'; }
  else if (state === 'peek') {
    if (sy > 0.3) { speakQ = []; crew.slice(0, crewCount).forEach((m, k) => { m.mode = 'jump'; jump(m, o => awayPos(m.k, o), 0.7, 6, 1, 1, () => { m.mode = 'away'; }, k * 0.04); }); state = 'out'; }
    else if (now > peekUntil && crew.slice(0, crewCount).every(m => !m.tw)) { crew.slice(0, crewCount).forEach((m, k) => toHat(m, k * 0.06)); state = 'capping'; }
  }
}

// ---------- tips ----------
const DID = [ // things Gray did, in results an owner cares about (from the live site; keep them honest)
  'I helped a coaching business go from 2 to 3 booked calls a week to 13 to 15.',
  'I built a courier website that Google\'s AI answer pointed to first, days after launch.',
  'I built and tested an email assistant that replies in minutes, not hours.',
  'I wrote 37 pages of guides so a team could run things without me.',
  'I built a lead clean-up so nobody on the team calls the same person twice.',
  'I turned quick work notes into daily and weekly reports, ready to send.',
  'I turned meetings into to-do lists with owners and due dates.',
  'I built posts that get written and published on 4 platforms.',
];
let tipMini = null, tipUntil = 0, tipN = 0, speakQ = [];
function say(m) { tipMini = m; tipUntil = now + 2.6; tipEl.textContent = DID[tipN++ % DID.length]; tipEl.classList.add('on'); }
function placeTip() {
  if (!tipMini) return;
  if (now > tipUntil || !tipMini.mesh.visible) { tipEl.classList.remove('on'); tipMini = null; return; }
  tmp.copy(tipMini.mesh.position); tmp.y += 6 * figScale; tmp.project(camera);
  tipEl.style.left = ((tmp.x + 1) / 2 * innerWidth) + 'px';
  tipEl.style.top = ((1 - tmp.y) / 2 * innerHeight - 8) + 'px';
}

// ---------- pointer ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const interactive = el => el.closest && el.closest('a, button, input, label, textarea, select');
function pick(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const minis = crew.slice(0, crewCount).filter(m => m.mesh.visible).map(m => m.mesh);
  const hit = ray.intersectObjects(state === 'done' ? [...minis, hatMesh] : minis, false)[0];
  if (!hit) return null;
  if (hit.object === hatMesh) return { hat: true, k: H[hit.instanceId].who };
  return { mini: crew.find(m => m.mesh === hit.object) };
}
addEventListener('pointermove', e => {
  mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; mouse.in = e.pointerType !== 'touch';
  if (e.pointerType !== 'touch' && !interactive(e.target)) document.body.style.cursor = pick(e) ? 'pointer' : '';
});
document.documentElement.addEventListener('pointerleave', () => { mouse.in = false; });

let holdTimer = 0, didBlast = false;
addEventListener('pointerdown', e => {
  if (reduced || e.button !== 0 || e.pointerType === 'touch' || interactive(e.target) || !['done', 'peek', 'out', 'capping'].includes(state)) return;
  didBlast = false;
  holdTimer = setTimeout(() => { blasting = true; didBlast = true; }, 170);
});
const release = () => { clearTimeout(holdTimer); blasting = false; setTimeout(() => { didBlast = false; }, 0); }; // only the click that ends a blast is ignored
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('blur', release);

addEventListener('click', e => {
  if (didBlast) { didBlast = false; return; }
  if (interactive(e.target)) return;
  const p = pick(e);
  if (!p) return;
  if (p.hat) {
    if (reduced) { // no crew moving: the line shows above the hat instead
      tipEl.textContent = DID[tipN++ % DID.length]; tipEl.classList.add('on');
      const r = hatMesh.getWorldPosition(tmp).add(tmp2.set(0, 40 * figScale, 0)).project(camera);
      tipEl.style.left = ((r.x + 1) / 2 * innerWidth) + 'px'; tipEl.style.top = ((1 - r.y) / 2 * innerHeight) + 'px';
      setTimeout(() => tipEl.classList.remove('on'), 3400); return;
    }
    crew.slice(0, crewCount).forEach((m, k) => fromHat(m, 'base', k * 0.04));
    // three of them take turns saying what Gray did; the next click carries on through the list
    speakQ = [0, 1, 2].map(j => ({ at: now + 0.9 + j * 2.7, k: (p.k + j * 3) % crewCount }));
    state = 'peek'; peekUntil = now + 0.9 + 3 * 2.7;
  } else if (p.mini && !p.mini.tw) { p.mini.hop = now; say(p.mini); if (state === 'peek') peekUntil = Math.max(peekUntil, now + 3); }
});

// ---------- loop ----------
const clock = new THREE.Clock();
let rotY = -0.3, rotX = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  now += dt;
  fig.position.y = scrollY * unitsPerPx + (reduced ? 0 : Math.sin(now * 1.3) * 0.25 * figScale);
  if (!reduced) {
    rotY += ((mouse.in ? mouse.x * 0.45 : 0) - 0.3 - rotY) * Math.min(1, dt * 3);
    rotX += ((mouse.in ? -mouse.y * 0.06 : 0) - rotX) * Math.min(1, dt * 3);
  }
  fig.rotation.set(rotX, rotY, 0);
  fig.updateMatrixWorld();
  writeBlocks(B, bodyMesh, now, dt);
  writeBlocks(H, hatMesh, now, dt);
  writeBlocks(K, crateMesh, now, dt);
  crateMesh.rotation.z = now < OPEN && state === 'page' ? Math.sin(now * 42) * 0.05 * (now / OPEN) : 0; // the crate shakes before it opens
  while (speakQ.length && now >= speakQ[0].at) { const s = speakQ.shift(), m = crew[s.k]; if (m.mesh.visible) { m.hop = now; say(m); } }
  hatMesh.computeBoundingSphere(); bodyMesh.computeBoundingSphere();
  updateCrew(dt);
  stateStep();
  // spare blocks drift up slowly and move with the scroll, a little slower than the page
  for (let i = 0; i < SPARE; i++) {
    const s = spares[i];
    let y = s.y + (reduced ? 0 : now * s.sp) + scrollY * unitsPerPx * 0.5;
    y = ((y + 30) % 110 + 110) % 110 - 30 + camY - 19;
    q.setFromAxisAngle(one, s.a + (reduced ? 0 : now * s.sp * 0.5));
    spareMesh.setMatrixAt(i, mat.compose(tmp.set(s.x, y, s.z), q, tmp2.set(s.s, s.s, s.s)));
  }
  spareMesh.instanceMatrix.needsUpdate = true;
  placeTip();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);
