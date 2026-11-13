// =============================================
// Güzelbahçe erişim boşlukları: 3B model
// 50 m'lik yerleşim hücreleri; sütun yüksekliği hücrenin seçilen yürüme eşiğini ne kadar aştığını gösterir.
// Veriler 3b/erisim-veri.js (DATA) ve 3b/zemin.js (GROUND).
// =============================================
(() => {
"use strict";
const $ = id => document.getElementById(id);
const t = M3.t, fmt = M3.fmt, pct = M3.pct, fmtM = M3.mesafe;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const W = DATA.W, H = DATA.H, CS = DATA.cell, HW = W / 2, HH = H / 2;
const FREQ = new Set(['8', '82', '684']);
const LINECOL = { '8': [0.93, 0.26, 0.24], '9': [0.24, 0.70, 0.33], '28': [0.24, 0.52, 0.86], '82': [0.88, 0.30, 0.85], '684': [0.52, 0.36, 0.98], '762': [0.98, 0.84, 0.22] };
// hücreler: [i, j, en yakın durak, en yakın sık hat durağı, en yakın konteyner] (m)
const cells = DATA.cells.map(c => ({ i: c[0], j: c[1], x: (c[0] + .5) * CS - HW, z: (c[1] + .5) * CS - HH, da: c[2], df: c[3], dc: c[4] }));
const N = cells.length;
const cellAt = new Map(cells.map((c, k) => [c.j * 10000 + c.i, k]));
const Z = (x, y) => [x - HW, y - HH];
const ZONES = [
  { id: 'west', ad: ['Batı kesimi · O-32 boyu', 'Western part · along the O-32'], ipucu: ["Kahramandere'nin batısı", 'West of Kahramandere'], c: Z(2170, 3130), r: 950 },
  { id: 'ieu', ad: ['İzmir Ekonomi Üniv. çevresi', 'Around İzmir Ekonomi Üniv.'], ipucu: ["Maltepe'nin güneyi, otoyol kenarı", 'South of Maltepe, by the motorway'], c: Z(6900, 1560), r: 750 },
  { id: 'yaka', ad: ['Yaka doğu yamaçları', 'Eastern slopes of Yaka'], ipucu: ['Yarendede Caddesi boyu', 'Along Yarendede Caddesi'], c: Z(6090, 2034), r: 620 },
  { id: 'bulv', ad: ['75. Yıl Bulvarı – otoyol arası', 'Between 75. Yıl Bulvarı and the motorway'], ipucu: ["Yalı ile Çelebi'nin kuzeyi", 'North of Yalı and Çelebi'], c: Z(4900, 1320), r: 650 },
  { id: 'south', ad: ['Güney mahalleleri', 'Southern neighbourhoods'], ipucu: ['Kahramandere, Mustafa Kemal Paşa', 'Kahramandere, Mustafa Kemal Paşa'], c: Z(2950, 3150), r: 1250 }
];
const zAd = z => t(z.ad[0], z.ad[1]);
ZONES.forEach(z => { z.cells = []; cells.forEach((c, k) => { if (Math.hypot(c.x - z.c[0], c.z - z.c[1]) <= z.r) z.cells.push(k); }); });

// ---------- durum
const S = { mode: 'transit', lines: 'all', tT: 400, tC: 100 };
function dT(c) { return S.lines === 'all' ? c.da : c.df; }
function ratio(d, th) { return Math.max(0, (d - th) / th); }
function cellState(c) {
  if (S.mode === 'transit') { const r = ratio(dT(c), S.tT); return { bad: dT(c) > S.tT, r, kind: 't' }; }
  if (S.mode === 'cont') { const r = ratio(c.dc, S.tC); return { bad: c.dc > S.tC, r, kind: 'c' }; }
  const bt = dT(c) > S.tT, bc = c.dc > S.tC, rt = ratio(dT(c), S.tT), rc = ratio(c.dc, S.tC);
  return { bad: bt || bc, r: rt + rc, kind: bt && bc ? 'both' : bt ? 't' : bc ? 'c' : 'ok' };
}
function zoneStats(z) {
  let n = 0, mx = 0;
  for (const k of z.cells) { const c = cells[k], s = cellState(c); if (s.bad) { n++; const d = S.mode === 'cont' ? c.dc : dT(c); if (d > mx) mx = d; } }
  return { n, km2: n * CS * CS / 1e6, max: mx };
}
function stats() {
  let n = 0, nb = 0; for (const c of cells) { const s = cellState(c); if (s.bad) n++; if (s.kind === 'both') nb++; }
  return { n, nb, pct: n / N * 100, km2: n * CS * CS / 1e6, km2b: nb * CS * CS / 1e6 };
}

// ---------- WebGL
const cv = $('gl');
const gl = cv.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true });
M3.arayuz();
if (!gl) { $('nogl').hidden = false; M3.yuklendi(); return; }
const BG = [0.043, 0.059, 0.078];
const boxVS = `#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;
layout(location=2) in vec4 iRect;layout(location=3) in float iH;layout(location=4) in vec4 iCol;
uniform mat4 uVP;out vec3 vN;out vec4 vCol;out float vY;out vec3 vW;out float vH;
void main(){vec3 p=vec3(iRect.x+aPos.x*iRect.z,aPos.y*iH,iRect.y+aPos.z*iRect.w);vW=p;vN=aNor;vCol=iCol;vY=aPos.y;vH=iH;gl_Position=uVP*vec4(p,1.);}`;
const boxFS = `#version 300 es
precision highp float;in vec3 vN;in vec4 vCol;in float vY;in vec3 vW;in float vH;
uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;
void main(){vec3 L=normalize(vec3(-.45,.8,.35));float dif=max(dot(vN,L),0.);
float amb=.42;float side=mix(.55,1.,vY);if(vN.y>.5)side=1.12;
vec3 c=vCol.rgb*(amb+.7*dif)*side;
c+=vCol.rgb*vCol.a*.35*pow(vY,6.)*step(60.,vH);
float d=length(vW-uCam);float f=1.-exp(-pow(d*uFog,1.6));c=mix(c,uBG,clamp(f,0.,.85));
o=vec4(c,1.);}`;
const gVS = `#version 300 es
layout(location=0) in vec2 aP;uniform mat4 uVP;uniform vec4 uFrame;out vec2 vUV;out vec3 vW;
void main(){vec3 p=vec3(aP.x,0.,aP.y);vW=p;vUV=(aP-uFrame.xy)/uFrame.zw;gl_Position=uVP*vec4(p,1.);}`;
const gFS = `#version 300 es
precision highp float;in vec2 vUV;in vec3 vW;uniform sampler2D uT;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;
void main(){vec3 out_c=vec3(.067,.08,.1);vec3 c;
bool inside=all(greaterThanEqual(vUV,vec2(0.)))&&all(lessThanEqual(vUV,vec2(1.)));
if(inside){c=texture(uT,vUV).rgb;}else{vec2 g=abs(fract(vW.xz/500.)-.5);float l=step(.49,max(g.x,g.y));c=out_c+l*.025;}
vec2 e=min(vUV,1.-vUV);float edge=inside?smoothstep(0.,.012,min(e.x,e.y)*1.):0.;c=mix(out_c,c,inside?mix(.6,1.,edge):1.);
float d=length(vW-uCam);float f=1.-exp(-pow(d*uFog,1.6));o=vec4(mix(c,uBG,clamp(f,0.,.92)),1.);}`;
const PB = M3.program(gl, boxVS, boxFS), PG = M3.program(gl, gVS, gFS);
const U = (p, n) => gl.getUniformLocation(p, n);
// küp (tabansız)
const cubeV = [], cubeI = [];
function face(n, a, b, c, d) { const o = cubeV.length / 6; [a, b, c, d].forEach(v => cubeV.push(...v, ...n)); cubeI.push(o, o + 1, o + 2, o, o + 2, o + 3); }
face([0, 1, 0], [-.5, 1, -.5], [-.5, 1, .5], [.5, 1, .5], [.5, 1, -.5]);
face([0, 0, 1], [-.5, 0, .5], [.5, 0, .5], [.5, 1, .5], [-.5, 1, .5]);
face([0, 0, -1], [.5, 0, -.5], [-.5, 0, -.5], [-.5, 1, -.5], [.5, 1, -.5]);
face([1, 0, 0], [.5, 0, .5], [.5, 0, -.5], [.5, 1, -.5], [.5, 1, .5]);
face([-1, 0, 0], [-.5, 0, -.5], [-.5, 0, .5], [-.5, 1, .5], [-.5, 1, -.5]);
const cubeVB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cubeVB); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeV), gl.STATIC_DRAW);
const cubeIB = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIB); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeI), gl.STATIC_DRAW);
function makeInst(n) {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVB);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIB);
  const rect = new Float32Array(n * 4), h = new Float32Array(n), col = new Float32Array(n * 4);
  const bR = gl.createBuffer(), bH = gl.createBuffer(), bC = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bR); gl.bufferData(gl.ARRAY_BUFFER, rect, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, bH); gl.bufferData(gl.ARRAY_BUFFER, h, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(3, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, bC); gl.bufferData(gl.ARRAY_BUFFER, col, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(4, 1);
  gl.bindVertexArray(null);
  return { vao, n, rect, h, col,
    upload() { gl.bindBuffer(gl.ARRAY_BUFFER, bR); gl.bufferSubData(gl.ARRAY_BUFFER, 0, rect); gl.bindBuffer(gl.ARRAY_BUFFER, bH); gl.bufferSubData(gl.ARRAY_BUFFER, 0, h); gl.bindBuffer(gl.ARRAY_BUFFER, bC); gl.bufferSubData(gl.ARRAY_BUFFER, 0, col); } };
}
const IC = makeInst(N);
cells.forEach((c, k) => { IC.rect.set([c.x, c.z, 42, 42], k * 4); });
const hTgt = new Float32Array(N), cTgt = new Float32Array(N * 4);
const stops = DATA.stops.map(s => ({ x: s[0] - HW, z: s[1] - HH, l: s[2] }));
const IS = makeInst(stops.length);
const IK = makeInst(DATA.conts.length);
DATA.conts.forEach((p, k) => { IK.rect.set([p[0] - HW, p[1] - HH, 11, 11], k * 4); IK.h[k] = 10; IK.col.set([0.56, 0.83, 1.0, 0], k * 4); }); IK.upload();
const GQ = (() => {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  const E = 30000; gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-E, -E, E, -E, E, E, -E, -E, E, E, -E, E]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); return vao;
})();
const tex = gl.createTexture(); let texReady = false;
const img = new Image();
img.onload = () => {
  gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  texReady = true; dirty = true; setTimeout(M3.yuklendi, 250);
};
img.onerror = () => M3.yuklendi();
img.src = GROUND;

// ---------- renkler
const C_OK = [0.18, 0.50, 0.48], C_W = [0.95, 0.66, 0.23], C_H = [0.94, 0.29, 0.25], C_D = [0.75, 0.14, 0.36], C_V = [0.62, 0.50, 0.98], C_B = [0.93, 0.20, 0.42];
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
function ramp(r) { return r < 1 ? mix(C_W, C_H, r) : mix(C_H, C_D, Math.min(1, (r - 1) / 1.5)); }
function computeTargets() {
  for (let k = 0; k < N; k++) {
    const s = cellState(cells[k]); let h, col, a = 0;
    if (!s.bad) { h = 5; col = C_OK; }
    else if (S.mode === 'both') { h = 30 + Math.min(s.r, 5) * 150; col = s.kind === 'both' ? C_B : s.kind === 't' ? C_W : C_V; a = s.kind === 'both' ? 1 : .4; }
    else { h = 30 + Math.min(s.r, 3.5) * 200; col = ramp(s.r); a = 1; }
    hTgt[k] = h; cTgt.set([col[0], col[1], col[2], a], k * 4);
  }
  stops.forEach((s, k) => {
    const f = FREQ.has(s.l); const dim = S.lines === 'freq' && !f; const c = LINECOL[s.l] || [1, 1, 1];
    IS.rect.set([s.x, s.z, dim ? 16 : 24, dim ? 16 : 24], k * 4); IS.h[k] = dim ? 40 : 150; IS.col.set(dim ? [c[0] * .35, c[1] * .35, c[2] * .35, 0] : [c[0], c[1], c[2], .8], k * 4);
  });
  IS.upload(); animT = 1; dirty = true;
}
let animT = 0;
function stepAnim(dt) {
  if (animT <= 0) return false;
  const a = reduce ? 1 : Math.min(1, dt * 5.5); let moving = false;
  for (let k = 0; k < N; k++) {
    const d = hTgt[k] - IC.h[k]; if (Math.abs(d) > .5) { IC.h[k] += d * a; moving = true; } else IC.h[k] = hTgt[k];
    for (let q = 0; q < 4; q++) { const i = k * 4 + q; IC.col[i] += (cTgt[i] - IC.col[i]) * a; }
  }
  IC.upload(); if (!moving) animT = 0; return true;
}

// ---------- kamera
const cam = { tx: 0, tz: 0, dist: 9800, yaw: 0.32, pitch: 0.78 };
let fly = null, spin = false;
function camPos() { const cp = Math.cos(cam.pitch); return [cam.tx + cam.dist * cp * Math.sin(cam.yaw), cam.dist * Math.sin(cam.pitch), cam.tz + cam.dist * cp * Math.cos(cam.yaw)]; }
const FOV = 40 * Math.PI / 180; let VP = null, EYE = null;
function aspK() { const a = innerWidth / innerHeight; return a < 1.25 ? Math.min(2.2, 1.25 / a) : 1; }
function flyTo(tg, ms = 2600, olcekle = true) {
  if (reduce) ms = 1; tg = { ...tg }; if (tg.dist && olcekle) tg.dist *= aspK();
  fly = { from: { ...cam }, to: { ...cam, ...tg }, t0: performance.now(), ms };
  let dy = fly.to.yaw - fly.from.yaw; dy = ((dy + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; fly.to.yaw = fly.from.yaw + dy;
}
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const HOME = { tx: -650, tz: 250, dist: 9600, yaw: 0.32, pitch: 0.78 };

// ---------- etkileşim
const ptrs = new Map();
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey }); userTouched(); cv.classList.add('drag'); });
cv.addEventListener('pointerup', e => { ptrs.delete(e.pointerId); cv.classList.remove('drag'); });
cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); });
cv.addEventListener('contextmenu', e => e.preventDefault());
function pan(dx, dy) { const s = cam.dist * 0.0011; const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); cam.tx -= (dx * cy + dy * sy) * s; cam.tz -= (-dx * sy + dy * cy) * s; clampCam(); }
function clampCam() { cam.tx = Math.max(-HW - 800, Math.min(HW + 800, cam.tx)); cam.tz = Math.max(-HH - 800, Math.min(HH + 800, cam.tz)); cam.dist = Math.max(700, Math.min(17000, cam.dist)); cam.pitch = Math.max(0.16, Math.min(1.45, cam.pitch)); }
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) { hover(e.clientX, e.clientY); return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  if (ptrs.size === 1) { if (p.b === 2 || p.sh || e.shiftKey) pan(dx, dy); else { cam.yaw -= dx * 0.005; cam.pitch += dy * 0.004; clampCam(); } }
  else if (ptrs.size === 2) {
    const a = [...ptrs.values()]; const d0 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); p.x = e.clientX; p.y = e.clientY;
    const b = [...ptrs.values()]; const d1 = Math.hypot(b[0].x - b[1].x, b[0].y - b[1].y);
    if (d1 > 0) cam.dist *= d0 / d1; pan(dx / 2, dy / 2); clampCam(); dirty = true; return;
  }
  p.x = e.clientX; p.y = e.clientY; dirty = true; $('tip').hidden = true;
});
cv.addEventListener('wheel', e => { e.preventDefault(); userTouched(); cam.dist *= Math.exp(e.deltaY * 0.0012); clampCam(); dirty = true; }, { passive: false });
cv.addEventListener('pointerleave', () => { $('tip').hidden = true; });
function zoomBy(k) { userTouched(); flyTo({ dist: Math.max(700, Math.min(17000, cam.dist * k)) }, 420, false); }
function ray(mx, my) {
  const r = cv.getBoundingClientRect(); const nx = (mx - r.left) / r.width * 2 - 1, ny = 1 - (my - r.top) / r.height * 2;
  const e = camPos(); const f = [cam.tx - e[0], -e[1], cam.tz - e[2]]; const fl = Math.hypot(...f); f.forEach((v, i) => f[i] = v / fl);
  let rt = [f[2], 0, -f[0]]; const rl = Math.hypot(...rt); rt = rt.map(v => -v / rl); const up = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]];
  const th = Math.tan(FOV / 2), asp = r.width / r.height; const d = [0, 1, 2].map(i => f[i] + rt[i] * nx * th * asp + up[i] * ny * th);
  if (d[1] >= 0) return null; const k = -e[1] / d[1]; return [e[0] + d[0] * k, e[2] + d[2] * k];
}
function hover(mx, my) {
  const p = ray(mx, my); const tip = $('tip'); if (!p) { tip.hidden = true; return; }
  const i = Math.floor((p[0] + HW) / CS), j = Math.floor((p[1] + HH) / CS); const k = cellAt.get(j * 10000 + i);
  if (k === undefined) { tip.hidden = true; return; }
  const c = cells[k]; const bc = c.dc > S.tC;
  tip.innerHTML = `<b>${t('50 m yerleşim hücresi', '50 m settlement cell')}</b>
   <div><span>${t('En yakın durak', 'Nearest stop')}</span><span class="${c.da > S.tT ? 'bad' : 'good'}">${fmtM(c.da)}</span></div>
   <div><span>${t('Sık hat durağı', 'Frequent-line stop')}</span><span class="${c.df > S.tT ? 'bad' : 'good'}">${fmtM(c.df)}</span></div>
   <div><span>${t('En yakın konteyner', 'Nearest container')}</span><span class="${bc ? 'bad' : 'good'}">${fmtM(c.dc)}</span></div>`;
  tip.hidden = false; const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.min(innerWidth - tw - 8, mx + 14) + 'px'; tip.style.top = Math.max(64, my - th - 10) + 'px';
}

// ---------- etiketler
const LBL = $('labels'); const labelEls = [];
Object.entries(DATA.labels).filter(([n]) => n !== 'Güzelbahçe Merkez').forEach(([n, p]) => { const el = document.createElement('div'); el.className = 'lbl'; el.textContent = n; LBL.appendChild(el); labelEls.push({ el, x: p[0] - HW, y: 0, z: p[1] - HH }); });
const lblKampus = (() => { const el = document.createElement('div'); el.className = 'lbl dim'; LBL.appendChild(el); const cp = DATA.campus; let sx = 0, sz = 0; cp.forEach(p => { sx += p[0]; sz += p[1]; }); labelEls.push({ el, x: sx / cp.length - HW, y: 0, z: sz / cp.length - HH }); return el; })();
const lblKorfez = (() => { const el = document.createElement('div'); el.className = 'lbl dim'; LBL.appendChild(el); labelEls.push({ el, x: 600, y: 0, z: -HH + 150 }); return el; })();
const zoneTags = ZONES.map(z => { const el = document.createElement('div'); el.className = 'zt'; el.style.opacity = 0; el.innerHTML = '<b></b>'; LBL.appendChild(el); return { el, z, x: z.c[0], y: 780, zz: z.c[1], on: false }; });
function etiketleriYaz() {
  lblKampus.textContent = t('Kara Harp Okulu · analiz dışı', 'Kara Harp Okulu · not analysed');
  lblKorfez.textContent = t('İzmir Körfezi', 'Gulf of İzmir');
  zoneTags.forEach(zt => { zt.el.querySelector('b').textContent = zAd(zt.z); });
}
function project(x, y, z) {
  const o = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) o[i] = VP[i] * x + VP[4 + i] * y + VP[8 + i] * z + VP[12 + i];
  if (o[3] <= 0) return null; return [(o[0] / o[3] * .5 + .5) * innerWidth, (1 - (o[1] / o[3] * .5 + .5)) * innerHeight, o[3]];
}
function placeLabels() {
  labelEls.forEach(l => { const p = project(l.x, l.y, l.z); if (!p) { l.el.style.display = 'none'; return; } l.el.style.display = ''; l.el.style.left = p[0] + 'px'; l.el.style.top = p[1] + 'px'; });
  zoneTags.forEach(zt => { const p = project(zt.x, zt.y, zt.zz); if (!p) { zt.el.style.display = 'none'; return; } zt.el.style.display = ''; zt.el.style.left = p[0] + 'px'; zt.el.style.top = p[1] + 'px'; zt.el.style.opacity = zt.on ? 1 : 0; });
  M3.haritaGostergeleri(project, [cam.tx, 0, cam.tz], cam.yaw);
}
function showZone(id) { zoneTags.forEach(zt => zt.on = zt.z.id === id); dirty = true; }

// ---------- çizim
let dirty = true, lastT = performance.now();
function resize() { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); gl.viewport(0, 0, cv.width, cv.height); dirty = true; }
addEventListener('resize', resize); resize();
function frame(now) {
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  if (fly) { const p = Math.min(1, (now - fly.t0) / fly.ms), e = ease(p); for (const k of ['tx', 'tz', 'dist', 'yaw', 'pitch']) cam[k] = fly.from[k] + (fly.to[k] - fly.from[k]) * e; if (p >= 1) fly = null; dirty = true; }
  if (spin && !fly) { cam.yaw += dt * 0.06; dirty = true; }
  if (stepAnim(dt)) dirty = true;
  if (dirty) { draw(); dirty = false; }
  requestAnimationFrame(frame);
}
function draw() {
  const asp = cv.width / cv.height; EYE = camPos();
  VP = M3.mul(M3.persp(FOV, asp, 20, 80000), M3.lookAt(EYE, [cam.tx, 0, cam.tz], [0, 1, 0]));
  const fog = 1 / (cam.dist * 2.6);
  gl.clearColor(...BG, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
  gl.useProgram(PG); gl.uniformMatrix4fv(U(PG, 'uVP'), false, VP); gl.uniform4f(U(PG, 'uFrame'), -HW, -HH, W, H); gl.uniform3f(U(PG, 'uCam'), ...EYE); gl.uniform3f(U(PG, 'uBG'), ...BG); gl.uniform1f(U(PG, 'uFog'), fog);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texReady ? tex : null); gl.uniform1i(U(PG, 'uT'), 0);
  gl.bindVertexArray(GQ); gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.useProgram(PB); gl.uniformMatrix4fv(U(PB, 'uVP'), false, VP); gl.uniform3f(U(PB, 'uCam'), ...EYE); gl.uniform3f(U(PB, 'uBG'), ...BG); gl.uniform1f(U(PB, 'uFog'), fog);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -1);
  gl.bindVertexArray(IC.vao); gl.drawElementsInstanced(gl.TRIANGLES, 30, gl.UNSIGNED_SHORT, 0, N);
  if (S.mode !== 'transit') { gl.bindVertexArray(IK.vao); gl.drawElementsInstanced(gl.TRIANGLES, 30, gl.UNSIGNED_SHORT, 0, IK.n); }
  if (S.mode !== 'cont') { gl.bindVertexArray(IS.vao); gl.drawElementsInstanced(gl.TRIANGLES, 30, gl.UNSIGNED_SHORT, 0, IS.n); }
  gl.disable(gl.POLYGON_OFFSET_FILL); gl.bindVertexArray(null);
  placeLabels();
}

// ---------- arayüz
function setPressed(ids, on) { ids.forEach(id => $(id).setAttribute('aria-pressed', id === on ? 'true' : 'false')); }
function legend() {
  const k = $('lg-key');
  const sw = (c, txt) => `<span><i style="background:${c}"></i>${txt}</span>`;
  const rgb = a => `rgb(${a.map(v => Math.round(v * 255)).join(',')})`;
  let h = sw(rgb(C_OK), t('Eşik içinde', 'Within threshold'));
  if (S.mode === 'both') {
    $('lg-ramp').hidden = true;
    h += sw(rgb(C_B), t('İkisine de uzak', 'Far from both')) + sw(rgb(C_W), t('Sadece durağa uzak', 'Far from a stop only')) + sw(rgb(C_V), t('Sadece konteynere uzak', 'Far from a container only'));
  } else $('lg-ramp').hidden = false;
  $('lg-esik').textContent = t('eşik', 'threshold');
  if (S.mode !== 'cont') h += Object.entries(LINECOL).map(([l, c]) => sw(rgb(c), t('Hat ', 'Line ') + l)).join('');
  if (S.mode !== 'transit') h += sw('#8fd3ff', t('Konteyner', 'Container'));
  k.innerHTML = h;
}
function renderStats() {
  const s = stats();
  if (S.mode === 'both') {
    $('s-pct').textContent = pct(s.nb / N * 100, 1);
    $('s-txt').textContent = t(`yerleşim alanı hem durağa ${S.tT} m'den hem konteynere ${S.tC} m'den uzak`, `of the settlement area is more than ${S.tT} m from a stop and more than ${S.tC} m from a container`);
    $('s-km').textContent = t(`${fmt(s.km2b, 2)} km² çift dezavantajlı · ${fmt(s.km2, 2)} km² en az birinde eksik`, `${fmt(s.km2b, 2)} km² doubly disadvantaged · ${fmt(s.km2, 2)} km² lacking at least one`);
  } else {
    $('s-pct').textContent = pct(s.pct, 1);
    $('s-txt').textContent = S.mode === 'transit'
      ? (S.lines === 'freq' ? t(`yerleşim alanı en yakın sık hat durağına ${S.tT} m'den uzak`, `of the settlement area is more than ${S.tT} m from the nearest frequent-line stop`)
        : t(`yerleşim alanı en yakın durağa ${S.tT} m'den uzak`, `of the settlement area is more than ${S.tT} m from the nearest stop`))
      : t(`yerleşim alanı en yakın konteynere ${S.tC} m'den uzak`, `of the settlement area is more than ${S.tC} m from the nearest container`);
    $('s-km').textContent = t(`${fmt(s.km2, 2)} km² / toplam ${fmt(N * CS * CS / 1e6, 2)} km² yerleşim`, `${fmt(s.km2, 2)} km² of ${fmt(N * CS * CS / 1e6, 2)} km² settled area`);
  }
  const zl = $('zones'); zl.querySelectorAll('.zone').forEach(e => e.remove());
  ZONES.map(z => ({ z, s: zoneStats(z) })).sort((a, b) => b.s.n - a.s.n).forEach(({ z, s }) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'zone';
    b.innerHTML = `<i class="${s.n ? '' : 'none'}"></i><span>${zAd(z)}<small>${t(z.ipucu[0], z.ipucu[1])}</small></span><em>${s.n ? fmt(s.km2, 2) + ' km²' : t('eşik içinde', 'within threshold')}</em>`;
    b.onclick = () => { stopTour(); goZone(z); }; zl.appendChild(b);
  });
}
function goZone(z) { flyTo({ tx: z.c[0], tz: z.c[1], dist: z.r * 3.4 + 900, pitch: 0.62, yaw: cam.yaw }); showZone(z.id); }
function apply() {
  setPressed(['m-transit', 'm-cont', 'm-both'], 'm-' + S.mode); setPressed(['l-all', 'l-freq'], 'l-' + S.lines);
  $('lineopt').hidden = S.mode === 'cont'; $('ctl-t').hidden = S.mode === 'cont'; $('ctl-c').hidden = S.mode === 'transit';
  $('t-trans').value = S.tT; $('t-cont').value = S.tC; $('o-trans').textContent = S.tT + ' m'; $('o-cont').textContent = S.tC + ' m';
  computeTargets(); renderStats(); legend();
}
$('m-transit').onclick = () => { S.mode = 'transit'; apply(); };
$('m-cont').onclick = () => { S.mode = 'cont'; apply(); };
$('m-both').onclick = () => { S.mode = 'both'; apply(); };
$('l-all').onclick = () => { S.lines = 'all'; apply(); };
$('l-freq').onclick = () => { S.lines = 'freq'; apply(); };
$('t-trans').oninput = e => { S.tT = +e.target.value; apply(); };
$('t-cont').oninput = e => { S.tC = +e.target.value; apply(); };
$('b-reset').onclick = () => { stopTour(); showZone(null); flyTo(HOME); };
$('b-top').onclick = () => { stopTour(); flyTo({ tx: -200, tz: 100, dist: 7600, yaw: 0, pitch: 1.45 }); };
$('b-spin').onclick = () => { spin = !spin; $('b-spin').setAttribute('aria-pressed', spin); };
$('b-yak').onclick = () => zoomBy(0.72);
$('b-uzak').onclick = () => zoomBy(1.38);
$('b-kuzey').onclick = () => { userTouched(); flyTo({ yaw: 0 }, 700, false); };
$('more').onclick = () => { $('panel').classList.toggle('open'); };

// ---------- gezinti
const zone = id => ZONES.find(z => z.id === id);
const TOUR = [
  { title: ['Çalışma alanı', 'Study area'], set: { mode: 'transit', lines: 'all', tT: 400, tC: 100 }, cam: HOME, zone: null,
    text: () => { const s = stats(); return t(`Kıyı şeridi ve merkez durağa yakın. Yerleşim alanının ${pct(s.pct, 1)}'i (${fmt(s.km2, 2)} km²) ise en yakın ESHOT durağına 400 m'den uzak. Yükselen sütunlar bu bölgeler.`,
      `The coast and the centre are close to a stop. But ${pct(s.pct, 1)} of the settlement area (${fmt(s.km2, 2)} km²) is more than 400 m from the nearest ESHOT stop. The raised columns are these areas.`); } },
  { title: ['Batı kesimi · O-32 boyu', 'Western part · along the O-32'], set: { mode: 'transit', lines: 'all', tT: 400, tC: 100 }, zone: 'west',
    text: () => { const s = zoneStats(zone('west')); return t(`Otoyolun iki yanındaki dağınık yapılaşma, Kahramandere'nin batısı. ${fmt(s.km2, 2)} km² alan 400 m dışında kalıyor. En uzak noktada durak ${fmtM(s.max)} ötede.`,
      `Scattered buildings on both sides of the motorway, west of Kahramandere. ${fmt(s.km2, 2)} km² is outside 400 m. At the farthest point the stop is ${fmtM(s.max)} away.`); } },
  { title: ['İzmir Ekonomi Üniv. çevresi', 'Around İzmir Ekonomi Üniv.'], set: { mode: 'transit', lines: 'all', tT: 400, tC: 100 }, zone: 'ieu',
    text: () => { const s = zoneStats(zone('ieu')); return t(`Maltepe'nin güneyi ve otoyol kenarı. Çalışmadaki 6 hattın hiçbiri burada 400 m içinde durmuyor. ${fmt(s.km2, 2)} km² alanda en uzak nokta durağa ${fmtM(s.max)} uzaklıkta.`,
      `South of Maltepe, by the motorway. None of the 6 lines in the study stops within 400 m here. In this ${fmt(s.km2, 2)} km² area the farthest point is ${fmtM(s.max)} from a stop.`); } },
  { title: ['Yaka doğu yamaçları', 'Eastern slopes of Yaka'], set: { mode: 'transit', lines: 'all', tT: 400, tC: 100 }, zone: 'yaka',
    text: () => { const s = zoneStats(zone('yaka')); return t(`Yarendede Caddesi boyunca yokuşa tırmanan konutlar. ${fmt(s.km2, 2)} km² alanda durak ${fmtM(s.max)} uzaklığa kadar çıkıyor. Eğim yüzünden gerçek yürüme daha da zor.`,
      `Houses climbing the hill along Yarendede Caddesi. In this ${fmt(s.km2, 2)} km² area a stop can be up to ${fmtM(s.max)} away. Because of the slope, the real walk is even harder.`); } },
  { title: ['75. Yıl Bulvarı – otoyol arası', 'Between 75. Yıl Bulvarı and the motorway'], set: { mode: 'transit', lines: 'all', tT: 400, tC: 100 }, zone: 'bulv',
    text: () => { const s = zoneStats(zone('bulv')); return t(`Bulvarın 1. etabı tamamlandı, ancak çalışmadaki 6 hattın bulvar üzerinde durağı yok. Bulvar ile otoyol arasındaki ${fmt(s.km2, 2)} km² alanda durak ${fmtM(s.max)} uzaklığa kadar çıkıyor.`,
      `Stage 1 of the boulevard is complete, but none of the 6 lines in the study has a stop on it. In the ${fmt(s.km2, 2)} km² area between the boulevard and the motorway, a stop can be up to ${fmtM(s.max)} away.`); } },
  { title: ['Sık hatlar: güney açıkta', 'Frequent lines: the south is left out'], set: { mode: 'transit', lines: 'freq', tT: 400, tC: 100 }, zone: 'south', camOver: { dist: 6200, pitch: 0.7 },
    text: () => { const s = stats(); return t(`Yalnızca 21–30 dakikada bir gelen 8, 82 ve 684 sayıldığında oran ${pct(s.pct, 1)}'e çıkıyor. Kahramandere ve Mustafa Kemal Paşa çevresi 2–4 saatte bir gelen 9, 28 ve 762 numaralı hatlara bağlı kalıyor.`,
      `When only lines 8, 82 and 684, which come every 21–30 minutes, are counted, the share rises to ${pct(s.pct, 1)}. The area around Kahramandere and Mustafa Kemal Paşa depends on lines 9, 28 and 762, which come every 2–4 hours.`); } },
  { title: ['Çöp konteynerleri', 'Waste containers'], set: { mode: 'cont', lines: 'all', tT: 400, tC: 100 }, cam: HOME, zone: null,
    text: () => { const s = stats(); return t(`Konteyner ağı çok daha yoğun. Yerleşim alanının ${pct(s.pct, 1)}'i (${fmt(s.km2, 2)} km²) en yakın konteynere 100 m'den uzak. Boşluklar batıda ve doğu ucunda toplanıyor.`,
      `The container network is much denser. ${pct(s.pct, 1)} of the settlement area (${fmt(s.km2, 2)} km²) is more than 100 m from the nearest container. The gaps are in the west and at the eastern end.`); } },
  { title: ['Konteyner boşluğu · batı', 'Container gap · west'], set: { mode: 'cont', lines: 'all', tT: 400, tC: 100 }, zone: 'west',
    text: () => { const s = zoneStats(zone('west')); return t(`Otoyol çevresindeki dağınık konutlarda konteyner ${fmtM(s.max)} uzaklığa kadar çıkıyor. Bu bölge ulaşımda da en zayıf bölgelerden biri.`,
      `In the scattered houses around the motorway, a container can be up to ${fmtM(s.max)} away. This area is also one of the weakest for transport.`); } },
  { title: ['Çift dezavantaj', 'Double disadvantage'], set: { mode: 'both', lines: 'all', tT: 400, tC: 100 }, cam: { ...HOME, dist: 8600 }, zone: null,
    text: () => { const s = stats(); return t(`Kırmızı sütunlar hem durağa hem konteynere uzak: ${fmt(s.km2b, 2)} km². Turuncular yalnızca ulaşımda, morlar yalnızca konteynerde eksik. Öncelikli müdahale alanları kırmızı bölgeler.`,
      `The red columns are far from both a stop and a container: ${fmt(s.km2b, 2)} km². Orange ones lack only transport and purple ones lack only containers. The red areas are the priority areas for action.`); } }
];
const ADIM_MS = 8500;
let tStep = -1, tTimer = null, playing = false;
const dots = $('t-dots'); TOUR.forEach(() => dots.appendChild(document.createElement('i')));
function turMetni() {
  if (tStep < 0) {
    $('t-title').textContent = t('Gezinti', 'Guided tour');
    $('t-text').textContent = t('Kamera, ulaşım ve çöp konteyneri açısından erişimi zor bölgeleri sırayla gezer.', 'The camera visits, one by one, the areas that are hard to reach by transport and far from waste containers.');
    $('t-step').textContent = TOUR.length + t(' durak', ' stops');
  } else {
    const st = TOUR[tStep]; $('t-title').textContent = t(st.title[0], st.title[1]); $('t-text').textContent = st.text(); $('t-step').textContent = `${tStep + 1} / ${TOUR.length}`;
  }
  $('t-play').textContent = playing ? t('❚❚ Duraklat', '❚❚ Pause') : (tStep >= 0 ? t('▶ Devam et', '▶ Continue') : t('▶ Gezintiyi başlat', '▶ Start the tour'));
}
function goStep(i) {
  tStep = (i + TOUR.length) % TOUR.length; const st = TOUR[tStep]; Object.assign(S, st.set); apply();
  if (st.zone) { const z = zone(st.zone); flyTo({ tx: z.c[0], tz: z.c[1], dist: (st.camOver && st.camOver.dist) || z.r * 3.4 + 900, pitch: (st.camOver && st.camOver.pitch) || 0.6, yaw: 0.32 + tStep * 0.35 }); }
  else flyTo(st.cam);
  showZone(st.zone);
  turMetni();
  [...dots.children].forEach((d, k) => { d.className = k === tStep ? 'on' : k < tStep ? 'done' : ''; });
  clearTimeout(tTimer);
  if (playing) { M3.ilerleme(ADIM_MS); tTimer = setTimeout(() => { if (tStep < TOUR.length - 1) goStep(tStep + 1); else stopTour(); }, ADIM_MS); }
}
function stopTour() { playing = false; clearTimeout(tTimer); M3.ilerleme(0); turMetni(); }
function userTouched() { if (playing) stopTour(); fly = null; }
function oynat() { if (playing) { stopTour(); return; } playing = true; goStep(tStep < 0 || tStep >= TOUR.length - 1 ? 0 : tStep + 1); }
$('t-play').onclick = oynat;
$('t-next').onclick = () => { goStep(tStep + 1); };
$('t-prev').onclick = () => { goStep(tStep <= 0 ? TOUR.length - 1 : tStep - 1); };
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || !$('yardim').hidden) return;
  if (e.key === 'ArrowRight') goStep(tStep + 1);
  else if (e.key === 'ArrowLeft') goStep(tStep - 1);
  else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); oynat(); }
  else if (e.key === '+' || e.key === '=') zoomBy(0.72);
  else if (e.key === '-' || e.key === '_') zoomBy(1.38);
});

// Dil değişince dinamik metinleri yeniden yaz
addEventListener('m3dil', () => { etiketleriYaz(); renderStats(); legend(); turMetni(); $('tip').hidden = true; dirty = true; });

etiketleriYaz(); apply(); Object.assign(cam, HOME); cam.dist *= aspK(); turMetni();
// ilk kare: hücreleri anında göster
for (let k = 0; k < N; k++) { IC.h[k] = hTgt[k]; IC.col.set(cTgt.subarray(k * 4, k * 4 + 4), k * 4); } IC.upload(); animT = 0;
requestAnimationFrame(frame);
})();
