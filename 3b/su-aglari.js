// =============================================
// Güzelbahçe yer altı ağları: 3B model
// Sokak haritası saydam bir zemin; altında içme suyu, yağmur suyu ve atık su ağları
// temsilî derinliklerde. Veriler 3b/su-aglari-veri.js (NETS, LABELS) ve 3b/zemin.js (GROUND).
// =============================================
(() => {
"use strict";
const $ = id => document.getElementById(id);
const t = M3.t, fmt = M3.fmt, pct = M3.pct;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const W = NETS.W, H = NETS.H, HW = W / 2, HH = H / 2;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);

// Katmanlar (yukarıdan aşağı). Veri anahtarları kaynak harita dosyalarını izler:
// yoğun ağ ('rw' haritası) atık su, kısa parçalar ('ww' haritası) yağmur suyu olarak eşlenir (yöntem notu).
const LAYERS = [
  { id: 'dw', src: 'dw', ad: ['İçme suyu', 'Drinking water'], col: hex('#38bdf8'), depth: -70, thick: 11, share: 54.1 },
  { id: 'rw', src: 'ww', ad: ['Yağmur suyu', 'Rainwater'], col: hex('#34d399'), depth: -145, thick: 15, share: 4.1 },
  { id: 'ww', src: 'rw', ad: ['Atık su', 'Wastewater'], col: hex('#d9822b'), depth: -220, thick: 13, share: 41.9 }
];
const ad = L => t(L.ad[0], L.ad[1]);
// Güneybatı AAT: kapasite 21.600 m³/gün; yıllık ortalama debinin kapasiteye oranı (hesap)
const PLANT = { cap: 21600, years: [{ y: 2019, p: 108.2 }, { y: 2022, p: 94.6 }, { y: 2024, p: 100.0 }] };
const S = { glass: 0.78, gap: 1, vis: { dw: true, rw: true, ww: true }, focus: null, year: 2024, showNew: false };

const cv = $('gl');
const gl = cv.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true });
M3.arayuz();
if (!gl) { $('nogl').hidden = false; M3.yuklendi(); return; }
const prog = (v, f) => M3.program(gl, v, f);
const BG = [0.039, 0.055, 0.075];
const FOG = `float d=length(vW-uCam);float f=1.-exp(-pow(d*uFog,1.6));`;
// Boru parçaları: birim küp, x [0,1] boyunca, y/z [-.5,.5]
const pipeVS = `#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec4 iSeg;
uniform mat4 uVP;uniform float uY;uniform float uT;out vec3 vN;out vec3 vW;out float vX;
void main(){vec2 a=iSeg.xy,b=iSeg.zw;vec2 dv=b-a;float L=length(dv);vec2 dn=L>0.?dv/L:vec2(1,0);vec2 pn=vec2(-dn.y,dn.x);
 vec2 xz=a+dn*(aPos.x*(L+uT)-uT*.5)+pn*aPos.z*uT;vec3 p=vec3(xz.x,uY+aPos.y*uT,xz.y);vW=p;vX=aPos.x;
 vN=normalize(vec3(dn.x*aNor.x+pn.x*aNor.z,aNor.y,dn.y*aNor.x+pn.y*aNor.z));gl_Position=uVP*vec4(p,1.);}`;
const litFS = `#version 300 es
precision highp float;in vec3 vN;in vec3 vW;uniform vec3 uCol;uniform float uA;uniform float uEm;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;
void main(){vec3 L=normalize(vec3(-.45,.8,.35));float dif=max(dot(normalize(vN),L),0.);vec3 c=uCol*(.5+.65*dif)+uCol*uEm;
 ${FOG}c=mix(c,uBG,clamp(f,0.,.85));o=vec4(c,uA);}`;
const meshVS = `#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;uniform mat4 uVP;uniform vec3 uO;uniform vec3 uS;out vec3 vN;out vec3 vW;
void main(){vec3 p=uO+aPos*uS;vW=p;vN=aNor;gl_Position=uVP*vec4(p,1.);}`;
const planeVS = `#version 300 es
layout(location=0) in vec2 aP;uniform mat4 uVP;uniform float uY;uniform vec4 uFrame;out vec2 vUV;out vec3 vW;
void main(){vec3 p=vec3(aP.x,uY,aP.y);vW=p;vUV=(aP-uFrame.xy)/uFrame.zw;gl_Position=uVP*vec4(p,1.);}`;
const groundFS = `#version 300 es
precision highp float;in vec2 vUV;in vec3 vW;uniform sampler2D uT;uniform float uA;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;
void main(){vec3 outc=vec3(.06,.075,.095);bool inside=all(greaterThanEqual(vUV,vec2(0.)))&&all(lessThanEqual(vUV,vec2(1.)));
 vec3 c;float a=uA;if(inside){c=texture(uT,vUV).rgb;float lum=dot(c,vec3(.33));a=mix(uA,min(1.,uA+.35),smoothstep(.22,.4,lum));}
 else{vec2 g=abs(fract(vW.xz/500.)-.5);c=outc+step(.49,max(g.x,g.y))*.03;a=uA*.7;}
 ${FOG}o=vec4(mix(c,uBG,clamp(f,0.,.92)),a*(1.-clamp(f,0.,.92)*.5));}`;
const gridFS = `#version 300 es
precision highp float;in vec2 vUV;in vec3 vW;uniform vec3 uCol;uniform float uA;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;
void main(){if(any(lessThan(vUV,vec2(0.)))||any(greaterThan(vUV,vec2(1.))))discard;vec2 g=abs(fract(vW.xz/250.)-.5);float l=step(.485,max(g.x,g.y));
 vec2 e=min(vUV,1.-vUV);float edge=1.-smoothstep(0.,.004,min(e.x,e.y));${FOG}
 o=vec4(uCol,(uA*.35+l*uA+edge*uA*2.)*(1.-clamp(f,0.,.9)));}`;
const PP = prog(pipeVS, litFS), PM = prog(meshVS, litFS), PGd = prog(planeVS, groundFS), PGr = prog(planeVS, gridFS);
const U = (p, n) => gl.getUniformLocation(p, n);

// Küp (6 yüz, x [0,1])
const cv6 = [], ci6 = [];
function face(n, a, b, c, d) { const o = cv6.length / 6; [a, b, c, d].forEach(v => cv6.push(...v, ...n)); ci6.push(o, o + 1, o + 2, o, o + 2, o + 3); }
face([0, 1, 0], [0, .5, -.5], [0, .5, .5], [1, .5, .5], [1, .5, -.5]); face([0, -1, 0], [0, -.5, .5], [0, -.5, -.5], [1, -.5, -.5], [1, -.5, .5]);
face([0, 0, 1], [0, -.5, .5], [1, -.5, .5], [1, .5, .5], [0, .5, .5]); face([0, 0, -1], [1, -.5, -.5], [0, -.5, -.5], [0, .5, -.5], [1, .5, -.5]);
face([1, 0, 0], [1, -.5, .5], [1, -.5, -.5], [1, .5, -.5], [1, .5, .5]); face([-1, 0, 0], [0, -.5, -.5], [0, -.5, .5], [0, .5, .5], [0, .5, -.5]);
function geo(verts, idx) {
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  return { vb, ib, n: idx.length };
}
const CUBE = geo(cv6, ci6);
function segVAO(segs) {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, CUBE.vb);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, CUBE.ib); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  const f = new Float32Array(segs.length * 4); segs.forEach((s, k) => f.set([s[0] - HW, s[1] - HH, s[2] - HW, s[3] - HH], k * 4)); gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1); gl.bindVertexArray(null);
  return { vao, n: segs.length };
}
LAYERS.forEach(L => {
  L.vao = segVAO(NETS.nets[L.src]);
  const e = NETS.ext[L.src]; const s = [];
  for (let i = 0; i < e.length; i++) {
    const a = e[i], b = e[(i + 1) % e.length]; const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 60));
    for (let k = 0; k < n; k += 2) { const p = k / n, q = Math.min(1, (k + 1) / n); s.push([a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]); }
  }
  L.extVAO = segVAO(s); L.cur = 1; L.tgt = 1;
});
// 75. Yıl Cumhuriyet Bulvarı'ndaki yeni hatlar
const bp = NETS.bulvar; const bsegs = [];
for (let i = 0; i + 1 < bp.length; i++) bsegs.push([bp[i][0], bp[i][1], bp[i + 1][0], bp[i + 1][1]]);
const BULV = segVAO(bsegs);
// Silindir (arıtma tesisi haznesi)
const CYL = (() => {
  const v = [], ix = [], N = 48;
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); v.push(c, 0, s, c, 0, s, c, 1, s, c, 0, s); }
  for (let i = 0; i < N; i++) { const a = i * 2; ix.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  const o = v.length / 6; v.push(0, 1, 0, 0, 1, 0);
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2; v.push(Math.cos(a), 1, Math.sin(a), 0, 1, 0); }
  for (let i = 0; i < N; i++) ix.push(o, o + 1 + i + 1, o + 1 + i);
  const g = geo(v, ix); const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, g.vb);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib); gl.bindVertexArray(null); return { vao, n: g.n };
})();
const QUAD = (() => {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); const E = 30000;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-E, -E, E, -E, E, E, -E, -E, E, E, -E, E]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); return vao;
})();
const tex = gl.createTexture(); let texReady = false; const img = new Image();
img.onload = () => {
  gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  texReady = true; dirty = true; setTimeout(M3.yuklendi, 250);
};
img.onerror = () => M3.yuklendi();
img.src = GROUND;

// Tesis haznesi (şematik konum: çerçevenin doğusu, Narlıdere yönü)
const TANK = { x: HW + 1100, z: -HH + 1100, r: 260, h: 520 };
let tankLevel = 0, tankTgt = 1, glassCur = S.glass, gapCur = 1;

// ---------- kamera
const cam = { tx: 0, tz: 0, ty: -80, dist: 9000, yaw: 0.32, pitch: 0.6 };
const HOME = { tx: -300, tz: 150, ty: -80, dist: 9000, yaw: 0.32, pitch: 0.6 };
function aspK() { const a = innerWidth / innerHeight; return a < 1.25 ? Math.min(2.2, 1.25 / a) : 1; }
let fly = null, spin = false;
function camPos() { const cp = Math.cos(cam.pitch); return [cam.tx + cam.dist * cp * Math.sin(cam.yaw), cam.ty + cam.dist * Math.sin(cam.pitch), cam.tz + cam.dist * cp * Math.cos(cam.yaw)]; }
const FOV = 40 * Math.PI / 180; let VP = null, EYE = null;
function flyTo(tg, ms = 2600, olcekle = true) {
  if (reduce) ms = 1; tg = { ...tg }; if (tg.dist && olcekle) tg.dist *= aspK();
  fly = { from: { ...cam }, to: { ...cam, ...tg }, t0: performance.now(), ms };
  let dy = fly.to.yaw - fly.from.yaw; dy = ((dy + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; fly.to.yaw = fly.from.yaw + dy;
}
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// ---------- etkileşim
const ptrs = new Map();
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey }); userTouched(); cv.classList.add('drag'); });
const up = e => { ptrs.delete(e.pointerId); cv.classList.remove('drag'); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('contextmenu', e => e.preventDefault());
function clampCam() { cam.tx = Math.max(-HW - 1500, Math.min(HW + 1800, cam.tx)); cam.tz = Math.max(-HH - 1000, Math.min(HH + 1000, cam.tz)); cam.dist = Math.max(600, Math.min(17000, cam.dist)); cam.pitch = Math.max(0.04, Math.min(1.45, cam.pitch)); }
function pan(dx, dy) { const s = cam.dist * 0.0011, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); cam.tx -= (dx * cy + dy * sy) * s; cam.tz -= (-dx * sy + dy * cy) * s; clampCam(); }
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y;
  if (ptrs.size === 1) { if (p.b === 2 || p.sh || e.shiftKey) pan(dx, dy); else { cam.yaw -= dx * 0.005; cam.pitch += dy * 0.004; clampCam(); } }
  else if (ptrs.size === 2) {
    const a = [...ptrs.values()]; const d0 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); p.x = e.clientX; p.y = e.clientY;
    const b = [...ptrs.values()]; const d1 = Math.hypot(b[0].x - b[1].x, b[0].y - b[1].y); if (d1 > 0) cam.dist *= d0 / d1; pan(dx / 2, dy / 2); clampCam(); dirty = true; return;
  }
  p.x = e.clientX; p.y = e.clientY; dirty = true;
});
cv.addEventListener('wheel', e => { e.preventDefault(); userTouched(); cam.dist *= Math.exp(e.deltaY * 0.0012); clampCam(); dirty = true; }, { passive: false });
function zoomBy(k) { userTouched(); flyTo({ dist: Math.max(600, Math.min(17000, cam.dist * k)) }, 420, false); }

// ---------- etiketler
const LB = $('labels'); const tags = [];
function addTag(el, x, y, z, kind) { LB.appendChild(el); const tg = { el, x, y, z, kind }; tags.push(tg); return tg; }
Object.entries(LABELS).filter(([n]) => n !== 'Güzelbahçe Merkez').forEach(([n, p]) => { const el = document.createElement('div'); el.className = 'lbl'; el.textContent = n; addTag(el, p[0] - HW, 0, p[1] - HH, 'name'); });
const layTags = LAYERS.map(L => { const el = document.createElement('div'); el.className = 'lay'; el.style.setProperty('--c', `rgb(${L.col.map(v => v * 255 | 0)})`); return addTag(el, HW + 150, 0, 0, 'layer'); });
function mk(col, x, z, layer) { const el = document.createElement('div'); el.className = 'mk'; el.style.setProperty('--c', col); el.style.opacity = 0; const tg = addTag(el, x, 0, z, 'mk'); tg.layer = layer; return tg; }
const mkPlant = mk('#d9822b', TANK.x, TANK.z, 'tank');
const mkWell = mk('#38bdf8', 5589 - HW, HH + 250, 'dw');
const mkBalc = mk('#38bdf8', HW + 250, -HH + 2300, 'dw');
const mkBulv = mk('#f8fafc', (NETS.bulvar[0][0] + NETS.bulvar[NETS.bulvar.length - 1][0]) / 2 - HW, NETS.bulvar[Math.floor(NETS.bulvar.length / 2)][1] - HH, 'new');
function isaretleriYaz() {
  LAYERS.forEach((L, i) => { layTags[i].el.textContent = ad(L); });
  mkPlant.el.innerHTML = t('Güneybatı AAT · Narlıdere<small>şematik konum</small>', 'Güneybatı WWTP · Narlıdere<small>schematic location</small>');
  mkWell.el.innerHTML = t('↓ Küçükkaya kuyusu<small>yaklaşık 1,5 km güneyde · 2023</small>', '↓ Küçükkaya well<small>about 1.5 km to the south · 2023</small>');
  mkBalc.el.innerHTML = t('Ortak İZSU sistemi →<small>Tahtalı, Gördes, Göksu, Balçova</small>', 'Shared İZSU system →<small>Tahtalı, Gördes, Göksu, Balçova</small>');
  mkBulv.el.innerHTML = t('75. Yıl Bulvarı · 2025<small>' + fmt(1808) + ' m atık su · ' + fmt(3158) + ' m yağmur suyu</small>',
    '75. Yıl Bulvarı · 2025<small>' + fmt(1808) + ' m wastewater · ' + fmt(3158) + ' m rainwater</small>');
}
function depthOf(L) { return L.depth * gapCur; }
function project(x, y, z) {
  const o = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) o[i] = VP[i] * x + VP[4 + i] * y + VP[8 + i] * z + VP[12 + i];
  if (o[3] <= 0) return null; return [(o[0] / o[3] * .5 + .5) * innerWidth, (1 - (o[1] / o[3] * .5 + .5)) * innerHeight];
}
function placeTags() {
  LAYERS.forEach((L, i) => { layTags[i].y = depthOf(L); layTags[i].on = S.vis[L.id] && gapCur > 0.35; });
  mkPlant.y = TANK.h + 120; mkWell.y = depthOf(LAYERS[0]); mkBalc.y = depthOf(LAYERS[0]); mkBulv.y = 60;
  for (const tg of tags) {
    const p = project(tg.x, tg.y, tg.z); if (!p) { tg.el.style.display = 'none'; continue; }
    tg.el.style.display = ''; tg.el.style.left = p[0] + 'px'; tg.el.style.top = p[1] + 'px';
    let op = 1; if (tg.kind === 'layer') op = tg.on ? 1 : 0;
    if (tg.kind === 'mk') {
      if (tg.layer === 'dw') op = S.vis.dw && S.focus === 'dw' ? 1 : 0;
      if (tg.layer === 'new') op = S.showNew ? 1 : 0;
      if (tg.layer === 'tank') op = S.vis.ww && (S.focus === null || S.focus === 'ww' || S.focus === 'plant') ? 1 : 0;
    }
    if (tg.kind === 'name') op = 0.35 + glassCur * 0.65;
    tg.el.style.opacity = op;
  }
  M3.haritaGostergeleri(project, [cam.tx, 0, cam.tz], cam.yaw);
}

// ---------- çizim
let dirty = true, lastT = performance.now();
function resize() { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); gl.viewport(0, 0, cv.width, cv.height); dirty = true; }
addEventListener('resize', resize); resize();
function approach(c, tg, dt, k = 5) { return reduce ? tg : c + (tg - c) * Math.min(1, dt * k); }
function frame(now) {
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  if (fly) { const p = Math.min(1, (now - fly.t0) / fly.ms), e = ease(p); for (const k of ['tx', 'tz', 'dist', 'yaw', 'pitch', 'ty']) if (fly.to[k] !== undefined) cam[k] = fly.from[k] + (fly.to[k] - fly.from[k]) * e; if (p >= 1) fly = null; dirty = true; }
  if (spin && !fly) { cam.yaw += dt * 0.06; dirty = true; }
  const pv = [glassCur, gapCur, tankLevel]; glassCur = approach(glassCur, S.glass, dt, 4); gapCur = approach(gapCur, S.gap, dt, 4);
  const yr = PLANT.years.find(y => y.y === S.year); tankTgt = yr.p / 100; tankLevel = approach(tankLevel, tankTgt, dt, 2.5);
  LAYERS.forEach(L => {
    L.tgt = !S.vis[L.id] ? 0 : (S.focus && S.focus !== L.id && S.focus !== 'plant' ? 0.18 : 1);
    if (S.focus === 'plant') L.tgt = L.id === 'ww' ? 1 : 0.18; if (S.focus === 'new') L.tgt = L.id === 'dw' ? 0.15 : 0.45;
    const o = L.cur; L.cur = approach(L.cur, L.tgt, dt, 5); if (Math.abs(o - L.cur) > 1e-3) dirty = true;
  });
  if (Math.abs(pv[0] - glassCur) + Math.abs(pv[1] - gapCur) + Math.abs(pv[2] - tankLevel) > 1e-4) dirty = true;
  if (dirty) { draw(); dirty = false; }
  requestAnimationFrame(frame);
}
function setCommon(p) { gl.uniformMatrix4fv(U(p, 'uVP'), false, VP); gl.uniform3f(U(p, 'uCam'), ...EYE); gl.uniform3f(U(p, 'uBG'), ...BG); gl.uniform1f(U(p, 'uFog'), 1 / (cam.dist * 2.8)); }
function draw() {
  EYE = camPos(); VP = M3.mul(M3.persp(FOV, cv.width / cv.height, 20, 80000), M3.lookAt(EYE, [cam.tx, cam.ty, cam.tz], [0, 1, 0]));
  gl.clearColor(...BG, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
  // borular
  gl.useProgram(PP); setCommon(PP);
  for (const L of LAYERS) {
    if (L.cur < 0.02) continue; gl.uniform1f(U(PP, 'uY'), depthOf(L)); gl.uniform1f(U(PP, 'uT'), L.thick);
    const k = 0.25 + 0.75 * L.cur; gl.uniform3f(U(PP, 'uCol'), L.col[0] * k, L.col[1] * k, L.col[2] * k); gl.uniform1f(U(PP, 'uA'), 1); gl.uniform1f(U(PP, 'uEm'), L.cur > 0.9 ? 0.35 : 0.);
    gl.bindVertexArray(L.vao.vao); gl.drawElementsInstanced(gl.TRIANGLES, CUBE.n, gl.UNSIGNED_SHORT, 0, L.vao.n);
    gl.uniform1f(U(PP, 'uT'), 4); const kk = 0.55 * L.cur; gl.uniform3f(U(PP, 'uCol'), L.col[0] * kk, L.col[1] * kk, L.col[2] * kk); gl.uniform1f(U(PP, 'uEm'), 0.);
    gl.bindVertexArray(L.extVAO.vao); gl.drawElementsInstanced(gl.TRIANGLES, CUBE.n, gl.UNSIGNED_SHORT, 0, L.extVAO.n);
  }
  if (S.showNew) {
    gl.uniform1f(U(PP, 'uT'), 22); gl.uniform3f(U(PP, 'uCol'), 1, 1, 1); gl.uniform1f(U(PP, 'uEm'), 0.6); gl.bindVertexArray(BULV.vao);
    for (const id of ['ww', 'rw']) { const L = LAYERS.find(l => l.id === id); if (!S.vis[id]) continue; gl.uniform1f(U(PP, 'uY'), depthOf(L)); gl.uniform3f(U(PP, 'uCol'), ...L.col.map(v => Math.min(1, v * 1.3 + .25))); gl.drawElementsInstanced(gl.TRIANGLES, CUBE.n, gl.UNSIGNED_SHORT, 0, BULV.n); }
    gl.uniform1f(U(PP, 'uY'), 6); gl.uniform3f(U(PP, 'uCol'), 1, 1, 1); gl.drawElementsInstanced(gl.TRIANGLES, CUBE.n, gl.UNSIGNED_SHORT, 0, BULV.n);
  }
  // hazne suyu
  const plantOn = S.vis.ww; const lvl = Math.max(0.001, Math.min(1, tankLevel));
  if (plantOn) {
    gl.useProgram(PM); setCommon(PM); gl.bindVertexArray(CYL.vao);
    const over = tankLevel > 1.0005; const wc = over ? [0.94, 0.3, 0.24] : [0.85, 0.53, 0.17];
    gl.uniform3f(U(PM, 'uO'), TANK.x, 0, TANK.z); gl.uniform3f(U(PM, 'uS'), TANK.r * 0.96, TANK.h * lvl, TANK.r * 0.96); gl.uniform3f(U(PM, 'uCol'), ...wc); gl.uniform1f(U(PM, 'uA'), 1); gl.uniform1f(U(PM, 'uEm'), 0.25);
    gl.drawElements(gl.TRIANGLES, CYL.n, gl.UNSIGNED_SHORT, 0);
    if (over) { const ex = tankLevel - 1; gl.uniform3f(U(PM, 'uO'), TANK.x, TANK.h, TANK.z); gl.uniform3f(U(PM, 'uS'), TANK.r * 1.12, TANK.h * ex * 1.6 + 6, TANK.r * 1.12); gl.uniform3f(U(PM, 'uCol'), 1, .25, .2); gl.uniform1f(U(PM, 'uEm'), 0.8); gl.drawElements(gl.TRIANGLES, CYL.n, gl.UNSIGNED_SHORT, 0); }
  }
  // saydam katmanlar: ızgaralar, zemin, hazne kabuğu
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  gl.useProgram(PGr); setCommon(PGr); gl.bindVertexArray(QUAD); gl.uniform4f(U(PGr, 'uFrame'), -HW, -HH, W, H);
  for (const L of LAYERS) { if (L.cur < 0.02 || gapCur < 0.2) continue; gl.uniform1f(U(PGr, 'uY'), depthOf(L) - L.thick); gl.uniform3f(U(PGr, 'uCol'), ...L.col); gl.uniform1f(U(PGr, 'uA'), 0.05 * L.cur); gl.drawArrays(gl.TRIANGLES, 0, 6); }
  gl.useProgram(PGd); setCommon(PGd); gl.uniform4f(U(PGd, 'uFrame'), -HW, -HH, W, H); gl.uniform1f(U(PGd, 'uY'), 0); gl.uniform1f(U(PGd, 'uA'), 1 - glassCur * 0.92);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texReady ? tex : null); gl.uniform1i(U(PGd, 'uT'), 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
  if (plantOn) { gl.useProgram(PM); setCommon(PM); gl.bindVertexArray(CYL.vao); gl.uniform3f(U(PM, 'uO'), TANK.x, 0, TANK.z); gl.uniform3f(U(PM, 'uS'), TANK.r, TANK.h, TANK.r); gl.uniform3f(U(PM, 'uCol'), .75, .82, .9); gl.uniform1f(U(PM, 'uA'), .16); gl.uniform1f(U(PM, 'uEm'), 0.); gl.drawElements(gl.TRIANGLES, CYL.n, gl.UNSIGNED_SHORT, 0); }
  gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  placeTags();
}

// ---------- arayüz
function syncUI() {
  LAYERS.forEach(L => { $('ly-' + L.id).setAttribute('aria-pressed', S.vis[L.id]); $('pay-' + L.id).textContent = pct(L.share, 1); });
  $('c-glass').value = Math.round(S.glass * 100); $('o-glass').textContent = pct(Math.round(S.glass * 100), 0);
  $('c-gap').value = Math.round(S.gap * 100); $('o-gap').textContent = fmt(S.gap, 1) + '×';
  document.querySelectorAll('.yr').forEach(b => b.setAttribute('aria-pressed', +b.dataset.y === S.year)); dirty = true;
}
LAYERS.forEach(L => { $('ly-' + L.id).onclick = () => { S.vis[L.id] = !S.vis[L.id]; S.focus = null; syncUI(); }; });
$('c-glass').oninput = e => { S.glass = e.target.value / 100; syncUI(); };
$('c-gap').oninput = e => { S.gap = e.target.value / 100; syncUI(); };
$('more').onclick = () => $('panel').classList.toggle('open');
// Tesis çubukları (kapasiteye oran, hesap)
const BOX = $('bars'), MAXP = 120;
function cubuklariYaz() {
  BOX.querySelectorAll('.yr').forEach(b => b.remove());
  PLANT.years.forEach(y => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'yr' + (y.p > 100 ? ' over' : ''); b.dataset.y = y.y;
    b.setAttribute('aria-label', y.y + ': ' + pct(y.p, 1));
    b.innerHTML = `<b>${pct(y.p, 1)}</b><div class="bar" style="height:${y.p / MAXP * 64}px"></div><small>${y.y}</small>`;
    b.onclick = () => { S.year = y.y; S.vis.ww = true; syncUI(); }; BOX.appendChild(b);
  });
  $('cap').style.bottom = (100 / MAXP * 64 + 18) + 'px';
  $('cap').querySelector('span').textContent = pct(100, 0);
  $('plant-p').textContent = t('Narlıdere · kapasite ' + fmt(21600) + ' m³/gün · yıllık ortalama debinin kapasiteye oranı (hesap) · kesik çizgi ' + pct(100, 0),
    'Narlıdere · capacity ' + fmt(21600) + ' m³/day · average annual flow as a share of capacity (calc.) · dashed line ' + pct(100, 0));
  syncUI();
}
$('b-reset').onclick = () => { stopTour(); S.focus = null; S.showNew = false; flyTo(HOME); };
$('b-side').onclick = () => { stopTour(); S.gap = Math.max(S.gap, 1.6); S.glass = Math.max(S.glass, .8); syncUI(); flyTo({ tx: -200, tz: 200, ty: -160, dist: 6200, yaw: 0.05, pitch: 0.07 }); };
$('b-spin').onclick = () => { spin = !spin; $('b-spin').setAttribute('aria-pressed', spin); };
$('b-yak').onclick = () => zoomBy(0.72);
$('b-uzak').onclick = () => zoomBy(1.38);
$('b-kuzey').onclick = () => { userTouched(); flyTo({ yaw: 0 }, 700, false); };

// ---------- gezinti
const C = (x, y) => ({ tx: x - HW, tz: y - HH });
const TOUR = [
  { title: ['Yüzeyin altı', 'Below the surface'], s: { glass: .1, gap: 1, focus: null, showNew: false, year: 2024 }, cam: { ...HOME, pitch: 0.72 },
    text: () => t('Güzelbahçe sokaklarının altında üç ayrı boru ağı var: içme suyu, yağmur suyu ve atık su. Zemin şimdi saydamlaşıyor.',
      'There are three separate pipe networks under the streets of Güzelbahçe: drinking water, rainwater and wastewater. The ground is now becoming transparent.') },
  { title: () => t('İçme suyu · ', 'Drinking water · ') + pct(54.1), s: { glass: .8, gap: 1, focus: 'dw', showNew: false }, cam: { ...C(4300, 2300), ty: -70, dist: 5200, yaw: 0.45, pitch: 0.62 },
    text: () => t('Toplam hat uzunluğunun yarısından fazlası. İlçe, İZSU\'nun 11 ilçelik ortak sisteminden besleniyor; sistemin günlük üretiminde Tahtalı ' + pct(32.2) + ', Gördes ' + pct(29.4) + ', Göksu kuyuları ' + pct(16.8) + ' paya sahip. İlçe içindeki tek yerel kaynak 2023\'te açılan Küçükkaya kuyusu (yaklaşık 265 kişi).',
      'More than half of the total line length. The district is supplied by İZSU\'s shared 11-district system; in the system\'s daily production, Tahtalı has a share of ' + pct(32.2) + ', Gördes ' + pct(29.4) + ' and the Göksu wells ' + pct(16.8) + '. The only local source inside the district is the Küçükkaya well, opened in 2023 (about 265 people).') },
  { title: ['Yaz aylarında basınç', 'Pressure in summer'], s: { glass: .8, gap: 1, focus: 'dw', showNew: false }, cam: { ...C(3000, 3600), ty: -70, dist: 4200, yaw: -0.5, pitch: 0.5 },
    text: () => t('Yaz aylarında basınç ve debi sorunu yaşanıyor. İZSU Mayıs 2026\'da Yelki\'ye 3 km uzunluğunda, 400 mm çapında yeni bir iletim hattının yapımına başladı. Hattın devreye girdiğini gösteren bir belgeye ulaşılamadı.',
      'There are pressure and flow problems in the summer months. In May 2026, İZSU started building a new 3 km transmission line, 400 mm in diameter, to Yelki. No document was found showing that the line has been put into service.') },
  { title: () => t('Atık su · ', 'Wastewater · ') + pct(41.9), s: { glass: .85, gap: 1, focus: 'ww', showNew: false }, cam: { ...C(4500, 2700), ty: -220, dist: 4600, yaw: 0.2, pitch: 0.55 },
    text: () => t('Kahramandere, Atatürk, Çelebi ve Yaka\'yı saran yoğun ağ. En alttaki katman bu, çünkü atık su eğimle akar. İlçenin atık suyu Narlıdere\'deki Güneybatı Atıksu Arıtma Tesisi\'ne gidiyor.',
      'The dense network around Kahramandere, Atatürk, Çelebi and Yaka. It is the lowest layer because wastewater flows downhill. The district\'s wastewater goes to the Güneybatı Wastewater Treatment Plant in Narlıdere.') },
  { title: ['Arıtma tesisi sınırda', 'The treatment plant is at its limit'], s: { glass: .85, gap: 1, focus: 'plant', showNew: false, year: 2019 }, cam: { tx: TANK.x - 700, tz: TANK.z + 300, ty: 120, dist: 3600, yaw: -0.6, pitch: 0.32 },
    text: () => t('Tesisin kapasitesi günde ' + fmt(21600) + ' m³. Yıllık ortalama debi 2019\'da kapasitenin ' + pct(108.2) + '\'sine çıktı, 2024\'te ' + pct(100.0) + '\'e ulaştı (hesap). Tesis Narlıdere\'nin bir bölümüne de hizmet veriyor. Kapasite artırımı için kredi ve izin süreci 2025\'te sürüyordu.',
      'The plant\'s capacity is ' + fmt(21600) + ' m³ a day. The average annual flow rose to ' + pct(108.2) + ' of capacity in 2019 and reached ' + pct(100.0) + ' in 2024 (calc.). The plant also serves part of Narlıdere. The loan and permit process for a capacity increase was still going on in 2025.'),
    after: () => setTimeout(() => { if (tStep === 4) { S.year = 2024; syncUI(); } }, 3200) },
  { title: () => t('Yağmur suyu · ', 'Rainwater · ') + pct(4.1), s: { glass: .85, gap: 1, focus: 'rw', showNew: false, year: 2024 }, cam: { ...C(5200, 2200), ty: -145, dist: 4300, yaw: 0.7, pitch: 0.55 },
    text: () => t('Ağın yalnızca ' + pct(4.1) + '\'i yağmur suyu hattı. Haritada birkaç kısa parça ve otoyol boyunca uzanan bir hat görünüyor; ilçenin büyük kısmında ayrı bir yağmur suyu hattı görünmüyor.',
      'Only ' + pct(4.1) + ' of the network is rainwater pipe. The map shows a few short pieces and one line along the motorway; most of the district has no separate rainwater line on the map.') },
  { title: ['75. Yıl Bulvarı · yeni hatlar', '75. Yıl Bulvarı · new lines'], s: { glass: .75, gap: 1, focus: 'new', showNew: true }, cam: { ...C(4900, 900), ty: -120, dist: 2600, yaw: 0.35, pitch: 0.42 },
    text: () => t('İBB\'nin 23 Ağustos 2025 açıklamasına göre bulvarda ' + fmt(1808) + ' m atık su ve ' + fmt(3158) + ' m yağmur suyu hattı döşendi. Toplam yatırım ' + fmt(87.35, 2) + ' milyon TL. Yağmur suyu iki noktadan Bozukiçi Deresi\'ne verilecek.',
      'According to İBB\'s statement of 23 August 2025, ' + fmt(1808) + ' m of wastewater pipe and ' + fmt(3158) + ' m of rainwater pipe were laid on the boulevard. The total investment is ' + fmt(87.35, 2) + ' million TL. Rainwater will be discharged into Bozukiçi Deresi at two points.') },
  { title: ['Kesit', 'Cross-section'], s: { glass: .85, gap: 1.7, focus: null, showNew: false, year: 2024 }, cam: { tx: -200, tz: 200, ty: -200, dist: 5300, yaw: 0.05, pitch: 0.08 },
    text: () => t('Üç katman yan yana. Derinlikler okunabilsin diye abartıldı ve aralar açıldı. Her ağ kendi haritasının kapsadığı alanla sınırlı; kesik çizgiler bu sınırları gösteriyor.',
      'The three layers side by side. The depths are exaggerated and the gaps widened so they are easy to read. Each network is limited to the area its own map covers; the dashed lines show these limits.') }
];
const baslik = st => typeof st.title === 'function' ? st.title() : t(st.title[0], st.title[1]);
const ADIM_MS = 9000;
let tStep = -1, tTimer = null, playing = false;
const dots = $('t-dots'); TOUR.forEach(() => dots.appendChild(document.createElement('i')));
function turMetni() {
  if (tStep < 0) {
    $('t-title').textContent = t('Gezinti', 'Guided tour');
    $('t-text').textContent = t('Kamera üç katmanı sırayla gezer: içme suyu, atık su ve arıtma tesisi, yağmur suyu ve 75. Yıl Bulvarı\'ndaki yeni hatlar.',
      'The camera visits the three layers in turn: drinking water, wastewater and the treatment plant, rainwater, and the new lines on 75. Yıl Bulvarı.');
    $('t-step').textContent = TOUR.length + t(' durak', ' stops');
  } else {
    const st = TOUR[tStep]; $('t-title').textContent = baslik(st); $('t-text').textContent = st.text(); $('t-step').textContent = `${tStep + 1} / ${TOUR.length}`;
  }
  $('t-play').textContent = playing ? t('❚❚ Duraklat', '❚❚ Pause') : (tStep >= 0 ? t('▶ Devam et', '▶ Continue') : t('▶ Gezintiyi başlat', '▶ Start the tour'));
}
function goStep(i) {
  tStep = (i + TOUR.length) % TOUR.length; const st = TOUR[tStep];
  S.vis = { dw: true, rw: true, ww: true }; Object.assign(S, st.s); syncUI(); flyTo(st.cam, 3000); if (st.after) st.after();
  turMetni();
  [...dots.children].forEach((d, k) => { d.className = k === tStep ? 'on' : k < tStep ? 'done' : ''; });
  clearTimeout(tTimer);
  if (playing) { M3.ilerleme(ADIM_MS); tTimer = setTimeout(() => { if (tStep < TOUR.length - 1) goStep(tStep + 1); else stopTour(); }, ADIM_MS); }
}
function stopTour() { playing = false; clearTimeout(tTimer); M3.ilerleme(0); turMetni(); }
function userTouched() { if (playing) stopTour(); fly = null; }
function oynat() { if (playing) { stopTour(); return; } playing = true; goStep(tStep < 0 || tStep >= TOUR.length - 1 ? 0 : tStep + 1); }
$('t-play').onclick = oynat;
$('t-next').onclick = () => goStep(tStep + 1); $('t-prev').onclick = () => goStep(tStep <= 0 ? TOUR.length - 1 : tStep - 1);
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || !$('yardim').hidden) return;
  if (e.key === 'ArrowRight') goStep(tStep + 1);
  else if (e.key === 'ArrowLeft') goStep(tStep - 1);
  else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); oynat(); }
  else if (e.key === '+' || e.key === '=') zoomBy(0.72);
  else if (e.key === '-' || e.key === '_') zoomBy(1.38);
});

// Dil değişince dinamik metinleri yeniden yaz
addEventListener('m3dil', () => { isaretleriYaz(); cubuklariYaz(); turMetni(); dirty = true; });

Object.assign(cam, HOME); cam.dist *= aspK(); tankLevel = 1.0;
isaretleriYaz(); cubuklariYaz(); turMetni();
requestAnimationFrame(frame);
})();
