// =============================================
// Güzelbahçe 3B · vitrin sayfası
// Kahraman alanında yavaşça salınan gerçek arazi (3b/arazi-veri.js) ve üzerinde
// halihazır haritadaki binalar, paftadaki kat adediyle (3b/kent-veri.js, 3b/sahne.js'teki bina ağı).
// Etkileşim yok; yalnızca vitrin. WebGL2 yoksa CSS'teki görsel kalır.
// =============================================
(() => {
"use strict";
M3.arayuz();
const cv = document.getElementById('gl');
const hero = document.querySelector('.v-hero');
const gl = cv.getContext('webgl2', { antialias: true, alpha: false });
if (!gl) return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BG = [0.039, 0.055, 0.075];
const KAB = 1.6;

const terrFS = `#version 300 es
precision highp float;in vec3 vW;in vec2 vUV;in vec3 vN;in vec4 vS;in float vH;in float vE;
uniform sampler2D uT;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;
${M3.araziRenk}
void main(){vec3 tex=texture(uT,clamp(vUV,0.,1.)).rgb;vec3 c=araziRenk(tex,vN,vS,vH,vW,vE);
 float d=length(vW-uCam);float f=1.-exp(-pow(d*uFog,1.6));o=vec4(mix(c,uBG,clamp(f,0.,.95)),1.);}`;
const PT = M3.program(gl, M3.araziVS, terrFS), PB = M3.program(gl, M3.binaVS, M3.binaFS);
const U = (p, n) => gl.getUniformLocation(p, n);

let hazirArazi = false, hazirDoku = false;
const AR = M3.arazi(gl, () => { hazirArazi = true; basla(); });
const HW = ARAZI.W / 2, HH = ARAZI.H / 2;
const BN = M3.binaAgi(gl, HW, HH), BR = M3.binaRenkU();

const tex = gl.createTexture(); const img = new Image();
img.onload = () => {
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  hazirDoku = true; basla();
};
img.src = GROUND;

function boyut() {
  const dpr = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); gl.viewport(0, 0, cv.width, cv.height);
}
addEventListener('resize', () => { boyut(); if (reduce) ciz(0); });

let gorunur = true, calisiyor = false, t0 = performance.now();
new IntersectionObserver(e => { gorunur = e[0].isIntersecting; if (gorunur && !reduce) dongu(); }).observe(hero);
function basla() {
  if (!hazirArazi || !hazirDoku) return;
  boyut(); ciz(0); cv.classList.add('hazir');
  if (!reduce) dongu();
}
function dongu() {
  if (calisiyor) return; calisiyor = true;
  const adim = now => { if (!gorunur || document.hidden) { calisiyor = false; return; } ciz((now - t0) / 1000); requestAnimationFrame(adim); };
  requestAnimationFrame(adim);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && gorunur && !reduce) dongu(); });

const ortak = (p, VP, eye, fog) => { gl.uniformMatrix4fv(U(p, 'uVP'), false, VP); gl.uniform3f(U(p, 'uCam'), ...eye); gl.uniform3f(U(p, 'uBG'), ...BG); gl.uniform1f(U(p, 'uFog'), fog); };
function ciz(sn) {
  const asp = cv.width / cv.height, genis = asp > 1.25;
  // merkez (Çelebi) çevresinde yavaş salınım
  const yaw = 0.25 + 0.45 * Math.sin(sn * 0.05), pitch = 0.5 + 0.06 * Math.sin(sn * 0.04);
  const dist = genis ? 6200 : 6200 * Math.min(2.2, 1.3 / asp);
  const tx = 450, tz = -150, ty = 40;
  const cp = Math.cos(pitch);
  const eye = [tx + dist * cp * Math.sin(yaw), ty + dist * Math.sin(pitch), tz + dist * cp * Math.cos(yaw)];
  const VP = M3.mul(M3.persp(36 * Math.PI / 180, asp, 20, 80000), M3.lookAt(eye, [tx, ty, tz], [0, 1, 0]));
  // geniş ekranda modeli sağa kaydır (solda metin var)
  const ox = genis ? 0.26 : 0, oy = genis ? 0.0 : 0.3;
  for (let i = 0; i < 4; i++) { VP[i * 4] += ox * VP[i * 4 + 3]; VP[i * 4 + 1] += oy * VP[i * 4 + 3]; }
  const fog = 1 / (dist * 2.6);
  gl.clearColor(...BG, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
  gl.useProgram(PT); ortak(PT, VP, eye, fog);
  AR.bagla(gl, PT, 1, KAB); gl.uniform4f(U(PT, 'uFrame'), ...M3.zeminCerceve()); gl.uniform1f(U(PT, 'uYo'), 0); gl.uniform1f(U(PT, 'uEtek'), -80);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U(PT, 'uT'), 0);
  gl.bindVertexArray(AR.vao); gl.drawElements(gl.TRIANGLES, AR.nTum, gl.UNSIGNED_INT, 0);
  if (BN.n) {
    gl.useProgram(PB); ortak(PB, VP, eye, fog); AR.bagla(gl, PB, 1, KAB);
    gl.uniform1f(U(PB, 'uKatH'), 3); gl.uniform3fv(U(PB, 'uKat'), BR.kat); gl.uniform3fv(U(PB, 'uTur'), BR.tur);
    gl.uniform1i(U(PB, 'uMod'), 0); gl.uniform1f(U(PB, 'uMin'), 0); gl.uniform1f(U(PB, 'uSec'), -1);
    gl.bindVertexArray(BN.vao); gl.drawElements(gl.TRIANGLES, BN.nIx, gl.UNSIGNED_INT, 0);
  }
  gl.bindVertexArray(null);
}
})();
