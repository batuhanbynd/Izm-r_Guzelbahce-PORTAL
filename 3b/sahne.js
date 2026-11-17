// =============================================
// BAS PORTAL · 3B kent sahneleri için ortak motor (kent modeli, toplu taşıma, elektrik)
// Gerçek arazi (3b/arazi.js) + bina modeli (KENT) + çizgi ve nokta katmanları.
// Kamera, fareyle seçim (binalar için kimlik tamponu), etiketler, pusula/ölçek ve gezinti burada.
// Dünya: x = modelX - W/2, z = modelY - H/2 (kuzey = -z), y yukarı (m).
// =============================================
(function () {
'use strict';

// Kat sayısı renkleri (1, 2, 3, 4, 5, 6+) ve kat bilgisi yok
var KAT_RENK = ['#4b5563', '#3f8f9c', '#52b8a3', '#e9c46a', '#f4a261', '#e76f51', '#d62f6c'];
// Tür renkleri: konut, ticari, resmi, okul, dini, sanayi, inşaat, harabe, tarım, sera, diğer
var TUR_RENK = ['#d8cbb2', '#f39a3d', '#5b8def', '#43c08a', '#a78bfa', '#8b95a7', '#f3d03d', '#8a6a52', '#9bb35a', '#a7e3ea', '#64748b'];
var TUR_AD = [['Konut', 'Residential'], ['Ticari', 'Commercial'], ['Resmî', 'Public'], ['Okul', 'School'], ['Dinî tesis', 'Religious'], ['Sanayi, imalat', 'Industry'],
  ['İnşaat hâlinde', 'Under construction'], ['Harabe', 'Ruin'], ['Ahır, ağıl', 'Barn'], ['Sera', 'Greenhouse'], ['Diğer', 'Other']];
var hex = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); };
M3.KAT_RENK = KAT_RENK; M3.TUR_RENK = TUR_RENK; M3.TUR_AD = TUR_AD;
M3.katRenk = function (k) { return KAT_RENK[Math.min(6, k)]; };

// Kulak kesme (ear clipping) üçgenleme; px, pz köşe dizileri
function ucgenle(px, pz) {
  var n = px.length, i, alan = 0;
  for (i = 0; i < n; i++) { var j = (i + 1) % n; alan += px[i] * pz[j] - px[j] * pz[i]; }
  var ix = []; for (i = 0; i < n; i++) ix.push(i);
  if (alan < 0) ix.reverse();
  var u = [], dongu = 0;
  function icinde(p, a, b, c) {
    var d1 = (px[p] - px[b]) * (pz[a] - pz[b]) - (px[a] - px[b]) * (pz[p] - pz[b]);
    var d2 = (px[p] - px[c]) * (pz[b] - pz[c]) - (px[b] - px[c]) * (pz[p] - pz[c]);
    var d3 = (px[p] - px[a]) * (pz[c] - pz[a]) - (px[c] - px[a]) * (pz[p] - pz[a]);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }
  while (ix.length > 3 && dongu++ < 2000) {
    var bulundu = false;
    for (i = 0; i < ix.length; i++) {
      var a = ix[(i + ix.length - 1) % ix.length], b = ix[i], c = ix[(i + 1) % ix.length];
      var cr = (px[b] - px[a]) * (pz[c] - pz[a]) - (pz[b] - pz[a]) * (px[c] - px[a]);
      if (cr <= 1e-9) continue;
      var ok = true;
      for (var q = 0; q < ix.length; q++) { var p = ix[q]; if (p === a || p === b || p === c) continue; if (icinde(p, a, b, c)) { ok = false; break; } }
      if (!ok) continue;
      u.push(a, b, c); ix.splice(i, 1); bulundu = true; break;
    }
    if (!bulundu) break;
  }
  for (i = 1; i + 1 < ix.length; i++) u.push(ix[0], ix[i], ix[i + 1]);
  return u;
}
function b64u16(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Uint16Array(a.buffer); }
M3.b64u16 = b64u16;

var FOG_ = 'float d=length(vW-uCam);float f=1.-exp(-pow(d*uFog,1.6));';
M3.binaVS = '#version 300 es\nlayout(location=0) in vec3 aP;layout(location=1) in vec4 aB;layout(location=2) in float aId;\n' +
    'uniform mat4 uVP;uniform float uKatH;uniform highp int uMod;uniform highp sampler2D uBR;\n' + M3.araziGLSL + '\nout vec3 vW;out vec4 vB;out float vId;out float vT;out vec3 vC;\n' +
    'float yuks(float kat,float tur){return kat>.5?kat*uKatH:(tur>8.5&&tur<9.5?.8:1.5);}\n' +
    'void main(){float kat=aB.z;vC=vec3(0.);if(uMod==3){vec4 r=texelFetch(uBR,ivec2(int(mod(aId,256.)),int(aId/256.)),0);vC=r.rgb;float ek=floor(r.a*255.+.5);if(ek>0.)kat=max(kat,1.)+ek;}' +
    'float h=yuks(kat,aB.w);float taban=araziY(aB.xy);float y=aP.z>.5?taban+h*uK:araziY(aP.xy)-2.;' +
    'vW=vec3(aP.x,y,aP.y);vB=aB;vId=aId;vT=aP.z;gl_Position=uVP*vec4(vW,1.);}';
M3.binaFS = '#version 300 es\nprecision highp float;in vec3 vW;in vec4 vB;in float vId;in float vT;in vec3 vC;\n' +
    'uniform vec3 uKat[7];uniform vec3 uTur[11];uniform highp int uMod;uniform float uMin;uniform float uSec;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;\n' +
    'void main(){vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));if(n.y<0.)n=-n;vec3 L=normalize(vec3(-.5,.72,.45));float dif=max(dot(n,L),0.);\n' +
    ' int k=int(vB.z+.5);int t=int(vB.w+.5);vec3 c=uMod==0?uKat[min(k,6)]:(uMod==1?uTur[t]:(uMod==3?vC:vec3(.36,.4,.46)));\n' +
    ' bool cati=n.y>.85;float s=cati?1.08:(.55+.5*dif);s*=mix(.72,1.,clamp(vT,0.,1.));c*=s;\n' +
    ' if(uMin>.5&&float(k)<uMin){c=mix(vec3(dot(c,vec3(.3,.5,.2))),uBG,.55)*.8;}\n' +
    ' if(abs(vId-uSec)<.5)c=mix(c,vec3(1.),.45);\n' + FOG_ + 'o=vec4(mix(c,uBG,clamp(f,0.,.9)),1.);}';

M3.binaAgi = function (gl, HW, HH) {
  var BN = { n: 0, bilgi: [] };
  (function () {
    if (typeof KENT === 'undefined') return;
    var a = b64u16(KENT.veri), o = KENT.olcek, p = 0, id = 0;
    var vP = [], vB = [], vI = [], ix = [], taban = 0;
    while (p < a.length) {
      var n = a[p], m = a[p + 1], kat = m & 255, tur = m >> 8; p += 2;
      var px = [], pz = [], cx = 0, cz = 0;
      for (var i = 0; i < n; i++) { px.push(a[p + i * 2] * o + (KENT.ox || 0) - HW); pz.push(a[p + i * 2 + 1] * o + (KENT.oy || 0) - HH); cx += px[i]; cz += pz[i]; }
      p += n * 2; cx /= n; cz /= n;
      var alan = 0; for (i = 0; i < n; i++) { var j = (i + 1) % n; alan += px[i] * pz[j] - px[j] * pz[i]; }
      BN.bilgi.push({ kat: kat, tur: tur, x: cx, z: cz, alan: Math.abs(alan) / 2 * KENT.birim * KENT.birim });
      taban = vP.length / 3;
      for (i = 0; i < n; i++) { vP.push(px[i], pz[i], 0, px[i], pz[i], 1); vB.push(cx, cz, kat, tur, cx, cz, kat, tur); vI.push(id, id); }
      for (i = 0; i < n; i++) {
        var k2 = (i + 1) % n, b0 = taban + i * 2, b1 = taban + k2 * 2;
        ix.push(b0, b1, b1 + 1, b0, b1 + 1, b0 + 1);
      }
      var u = ucgenle(px, pz);
      for (i = 0; i < u.length; i++) ix.push(taban + u[i] * 2 + 1);
      id++;
    }
    BN.n = id; BN.nIx = ix.length;
    BN.vao = gl.createVertexArray(); gl.bindVertexArray(BN.vao);
    [[vP, 3, 0], [vB, 4, 1], [vI, 1, 2]].forEach(function (q) {
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(q[0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(q[2]); gl.vertexAttribPointer(q[2], q[1], gl.FLOAT, false, 0, 0);
    });
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(ix), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  })();
  return BN;
};
M3.binaRenkU = function () { var k = [], t = []; KAT_RENK.forEach(function (h) { k.push.apply(k, hex(h)); }); TUR_RENK.forEach(function (h) { t.push.apply(t, hex(h)); }); return { kat: k, tur: t }; };

M3.sahne = function (ayar) {
  ayar = ayar || {};
  var $ = function (id) { return document.getElementById(id); };
  M3.arayuz();
  var cv = $('gl');
  var gl = cv.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true });
  if (!gl) { $('nogl').hidden = false; M3.yuklendi(); return null; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = ARAZI.W, H = ARAZI.H, HW = W / 2, HH = H / 2;
  var BG = [0.039, 0.055, 0.075];
  var U = function (p, n) { return gl.getUniformLocation(p, n); };
  var SC = { gl: gl, W: W, H: H, HW: HW, HH: HH, kab: ayar.kab || 1.5, kabCur: ayar.kab || 1.5, binaMod: ayar.binaMod || 'kat', minKat: 0, secili: -1,
    binaGoster: ayar.binalar !== false, binaSoluk: !!ayar.binaSoluk, katmanlar: [], ortuVar: false, ortuA: 0.55 };
  var dirty = true, ZC = M3.zeminCerceve();
  SC.yenile = function () { dirty = true; };

  // ---------- gölgelendiriciler
  var FOG = 'float d=length(vW-uCam);float f=1.-exp(-pow(d*uFog,1.6));';
  var terrFS = '#version 300 es\nprecision highp float;in vec3 vW;in vec2 vUV;in vec3 vN;in vec4 vS;in float vH;in float vE;\n' +
    'uniform sampler2D uT;uniform sampler2D uO;uniform float uOA;uniform float uSoluk;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;\n' + M3.araziRenk + '\n' +
    'void main(){vec2 uv=clamp(vUV,0.,1.);vec3 tex=texture(uT,uv).rgb*mix(1.,.55,uSoluk);vec3 c=araziRenk(tex,vN,vS,vH,vW,vE);' +
    'if(vE<.01){vec4 ov=texture(uO,uv);c=mix(c,ov.rgb,ov.a*uOA);}' + FOG + 'o=vec4(mix(c,uBG,clamp(f,0.,.92)),1.);}';
  var binaVS = M3.binaVS, binaFS = M3.binaFS;
  var secFS = '#version 300 es\nprecision highp float;in vec3 vW;in vec4 vB;in float vId;in float vT;out vec4 o;\n' +
    'void main(){float i=vId+1.;o=vec4(mod(i,256.),mod(floor(i/256.),256.),floor(i/65536.),255.)/255.;}';
  var araziSecFS = '#version 300 es\nprecision highp float;in vec3 vW;out vec4 o;void main(){o=vec4(0.,0.,0.,1.);}';
  // çizgi parçaları (kutu örnekleri). uDuz=1: uçlar arasında düz (havai hat), 0: araziyi izler
  var hatVS = '#version 300 es\nlayout(location=0) in vec3 aPos;layout(location=2) in vec4 iSeg;\n' +
    'uniform mat4 uVP;uniform float uT;uniform float uTy;uniform float uY;uniform float uYan;uniform float uDuz;\n' + M3.araziGLSL + '\nout vec3 vW;out vec3 vN;\n' +
    'void main(){vec2 a=iSeg.xy,b=iSeg.zw;vec2 dv=b-a;float L=length(dv);vec2 dn=L>0.?dv/L:vec2(1,0);vec2 pn=vec2(-dn.y,dn.x);a+=pn*uYan;\n' +
    ' vec2 xz=a+dn*(aPos.x*(L+uT)-uT*.5)+pn*aPos.z*uT;float yb=uDuz>.5?mix(araziY(a),araziY(b+pn*uYan),aPos.x):araziY(xz);\n' +
    ' vec3 p=vec3(xz.x,yb+uY+aPos.y*uTy,xz.y);vW=p;vN=vec3(0,1,0);gl_Position=uVP*vec4(p,1.);}';
  var litFS = '#version 300 es\nprecision highp float;in vec3 vW;in vec3 vN;uniform vec3 uCol;uniform float uEm;uniform vec3 uCam;uniform vec3 uBG;uniform float uFog;out vec4 o;\n' +
    'void main(){vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));if(n.y<0.)n=-n;vec3 L=normalize(vec3(-.5,.72,.45));float dif=abs(dot(n,L));' +
    'vec3 c=uCol*(.55+.55*dif)+uCol*uEm;' + FOG + 'o=vec4(mix(c,uBG,clamp(f,0.,.88)),1.);}';
  // noktalar: dikey kutu örnekleri, tabanı arazide
  var noktaVS = '#version 300 es\nlayout(location=0) in vec3 aPos;layout(location=2) in vec2 iP;\n' +
    'uniform mat4 uVP;uniform float uG;uniform float uY0;uniform float uY1;\n' + M3.araziGLSL + '\nout vec3 vW;out vec3 vN;\n' +
    'void main(){float t=araziY(iP);vec3 p=vec3(iP.x+(aPos.x-.5)*uG,t+mix(uY0,uY1,aPos.y),iP.y+aPos.z*uG);vW=p;vN=vec3(0,1,0);gl_Position=uVP*vec4(p,1.);}';
  var PT = M3.program(gl, M3.araziVS, terrFS), PB = M3.program(gl, binaVS, binaFS), PBs = M3.program(gl, binaVS, secFS), PTs = M3.program(gl, M3.araziVS, araziSecFS);
  var PH = M3.program(gl, hatVS, litFS), PN = M3.program(gl, noktaVS, litFS);

  var AR = M3.arazi(gl, function () { dirty = true; hazirKontrol(); });
  SC.AR = AR;
  SC.yer = function (x, z) { return AR.yer(x, z) * SC.kabCur; };

  // ---------- dokular
  var tex = gl.createTexture(), texHazir = false;
  var img = new Image();
  img.onload = function () {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    texHazir = true; dirty = true; hazirKontrol();
  };
  img.onerror = function () { texHazir = true; hazirKontrol(); };
  img.src = GROUND;
  var ortu = gl.createTexture();
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, ortu);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  // Arazi üstü örtü: sayfa, model çerçevesine hizalı bir tuval verir (ör. erişim alanları)
  SC.ortu = function (tuval, aci) {
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, ortu);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tuval); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    SC.ortuVar = !!tuval; if (aci !== undefined) SC.ortuA = aci; dirty = true;
  };

  // ---------- bina modeli
  var BN = M3.binaAgi(gl, HW, HH);
  SC.binalar = BN.bilgi;

  // ---------- kutu geometrisi (çizgi ve nokta katmanları için): x [0,1], y [0,1] / [-.5,.5], z [-.5,.5]
  function kutuVAO(yMerkez) {
    var y0 = yMerkez ? -.5 : 0, y1 = yMerkez ? .5 : 1;
    var v = [[0, y0, -.5], [1, y0, -.5], [1, y1, -.5], [0, y1, -.5], [0, y0, .5], [1, y0, .5], [1, y1, .5], [0, y1, .5]];
    var f = []; v.forEach(function (q) { f.push(q[0], q[1], q[2]); });
    var ix = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2];
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(f), gl.STATIC_DRAW);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ix), gl.STATIC_DRAW);
    return { vb: vb, ib: ib };
  }
  var KH = kutuVAO(true), KN = kutuVAO(false);
  function ornekVAO(kutu, dizi, boyut) {
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, kutu.vb); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, kutu.ib);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dizi), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, boyut, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null); return vao;
  }
  // Çizgi katmanı: cizgiler = [[[x,y],...],...] model koordinatında. ozellik: renk, gen, kal, y, yan, duz, em, gorunur
  SC.cizgiKatmani = function (cizgiler, oz) {
    var f = [];
    cizgiler.forEach(function (c) { for (var i = 0; i + 1 < c.length; i++) f.push(c[i][0] - HW, c[i][1] - HH, c[i + 1][0] - HW, c[i + 1][1] - HH); });
    var K = Object.assign({ tur: 'cizgi', renk: '#ffffff', gen: 8, kal: 4, y: 3, yan: 0, duz: 0, em: 0.3, gorunur: true }, oz);
    K.vao = ornekVAO(KH, f, 4); K.n = f.length / 4; K.col = hex(K.renk); SC.katmanlar.push(K); dirty = true; return K;
  };
  // Nokta katmanı: noktalar = [[x,y],...] model koordinatında. ozellik: renk, gen, y0, y1, em, gorunur
  SC.noktaKatmani = function (noktalar, oz) {
    var f = []; noktalar.forEach(function (p) { f.push(p[0] - HW, p[1] - HH); });
    var K = Object.assign({ tur: 'nokta', renk: '#ffffff', gen: 6, y0: 0, y1: 10, em: 0.3, gorunur: true }, oz);
    K.vao = ornekVAO(KN, f, 2); K.n = noktalar.length; K.col = hex(K.renk); K.noktalar = noktalar; SC.katmanlar.push(K); dirty = true; return K;
  };
  SC.renkAyarla = function (K, renk) { K.renk = renk; K.col = hex(renk); dirty = true; };
  // Bina başına renk ve ek kat (senaryo): rgba Uint8Array, bina başına 4 bayt (r, g, b, ek kat). binaMod = 'ozel' ile kullanılır.
  var brTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, brTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([90, 100, 115, 0]));
  ['TEXTURE_MIN_FILTER', 'TEXTURE_MAG_FILTER'].forEach(function (q) { gl.texParameteri(gl.TEXTURE_2D, gl[q], gl.NEAREST); });
  SC.binaRenkleri = function (rgba) {
    var y = Math.max(1, Math.ceil(BN.n / 256)), d = new Uint8Array(256 * y * 4); d.set(rgba.subarray(0, Math.min(rgba.length, d.length)));
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, brTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, d); dirty = true;
  };
  // Nokta katmanının noktalarını değiştir (eklenen tesisler)
  SC.noktaGuncelle = function (K, noktalar) {
    var f = new Float32Array(noktalar.length * 2); noktalar.forEach(function (p, i) { f[i * 2] = p[0] - HW; f[i * 2 + 1] = p[1] - HH; });
    gl.bindVertexArray(K.vao);
    if (!K.dinBuf) { K.dinBuf = gl.createBuffer(); }
    gl.bindBuffer(gl.ARRAY_BUFFER, K.dinBuf); gl.bufferData(gl.ARRAY_BUFFER, f, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null); K.noktalar = noktalar; K.n = noktalar.length; dirty = true;
  };

  // ---------- kamera
  var cam = { tx: 0, tz: 0, dist: 9600, yaw: 0.32, pitch: 0.78 };
  SC.cam = cam;
  // İlçe merkezi (ARAZI.sinir sınır kutusunun ortası, dünya koordinatı)
  var IM = (function () { var xs = [], ys = []; (ARAZI.sinir || [[[0, 0], [W, H]]]).forEach(function (r) { r.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    return { x: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2 - HW, z: (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2 - HH }; })();
  SC.ilceMerkez = IM;
  var HOME = Object.assign({ tx: IM.x, tz: IM.z, dist: 15500, yaw: 0.3, pitch: 0.8 }, ayar.home || {});
  SC.HOME = HOME;
  var fly = null, spin = false, tyS = 0;
  var FOV = 40 * Math.PI / 180, VP = null, EYE = null;
  function aspK() { var a = innerWidth / innerHeight; return a < 1.25 ? Math.min(2.2, 1.25 / a) : 1; }
  function tyHedef() { return AR.yer(cam.tx, cam.tz) * SC.kabCur; }
  function camPos() { var cp = Math.cos(cam.pitch); return [cam.tx + cam.dist * cp * Math.sin(cam.yaw), tyS + cam.dist * Math.sin(cam.pitch), cam.tz + cam.dist * cp * Math.cos(cam.yaw)]; }
  SC.flyTo = function (tg, ms, olcekle) {
    if (ms === undefined) ms = 2600; if (olcekle === undefined) olcekle = true;
    if (reduce) ms = 1; tg = Object.assign({}, tg); if (tg.dist && olcekle) tg.dist *= aspK();
    fly = { from: Object.assign({}, cam), to: Object.assign({}, cam, tg), t0: performance.now(), ms: ms };
    var dy = fly.to.yaw - fly.from.yaw; dy = ((dy + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; fly.to.yaw = fly.from.yaw + dy;
  };
  var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  function clampCam() { cam.tx = Math.max(AR.x0, Math.min(AR.x1, cam.tx)); cam.tz = Math.max(AR.z0, Math.min(AR.z1, cam.tz)); cam.dist = Math.max(250, Math.min(26000, cam.dist)); cam.pitch = Math.max(0.12, Math.min(1.45, cam.pitch)); }
  function pan(dx, dy) { var s = cam.dist * 0.0011, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); cam.tx -= (dx * cy + dy * sy) * s; cam.tz -= (-dx * sy + dy * cy) * s; clampCam(); }
  function zoomBy(k) { kullanici(); SC.flyTo({ dist: Math.max(250, Math.min(26000, cam.dist * k)) }, 420, false); }
  var ptrs = new Map();
  cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey }); kullanici(); cv.classList.add('drag'); $('tip').hidden = true; });
  var basX = 0, basY = 0, basT = 0;
  cv.addEventListener('pointerdown', function (e) { basX = e.clientX; basY = e.clientY; basT = performance.now(); });
  cv.addEventListener('pointerup', function (e) {
    var tek = ptrs.size === 1;
    ptrs.delete(e.pointerId); cv.classList.remove('drag');
    if (tek && ayar.tikla && e.button === 0 && Math.hypot(e.clientX - basX, e.clientY - basY) < 6 && performance.now() - basT < 600) {
      var q = SC.ekrandanZemine(e.clientX, e.clientY); if (q) ayar.tikla(q[0], q[1]);
    }
  });
  cv.addEventListener('pointercancel', function (e) { ptrs.delete(e.pointerId); });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  cv.addEventListener('pointermove', function (e) {
    var p = ptrs.get(e.pointerId);
    if (!p) { fareX = e.clientX; fareY = e.clientY; secimIste = true; dirty = true; return; }
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (ptrs.size === 1) { if (p.b === 2 || p.sh || e.shiftKey) pan(dx, dy); else { cam.yaw -= dx * 0.005; cam.pitch += dy * 0.004; clampCam(); } }
    else if (ptrs.size === 2) {
      var a = Array.from(ptrs.values()); var d0 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); p.x = e.clientX; p.y = e.clientY;
      var b = Array.from(ptrs.values()); var d1 = Math.hypot(b[0].x - b[1].x, b[0].y - b[1].y);
      if (d1 > 0) cam.dist *= d0 / d1; pan(dx / 2, dy / 2); clampCam(); dirty = true; return;
    }
    p.x = e.clientX; p.y = e.clientY; dirty = true;
  });
  cv.addEventListener('wheel', function (e) { e.preventDefault(); kullanici(); cam.dist *= Math.exp(e.deltaY * 0.0012); clampCam(); dirty = true; }, { passive: false });
  cv.addEventListener('pointerleave', function () { $('tip').hidden = true; SC.secili = -1; dirty = true; });
  var bag = function (id, fn) { var el = $(id); if (el) el.onclick = fn; };
  bag('b-yak', function () { zoomBy(0.72); });
  bag('b-uzak', function () { zoomBy(1.38); });
  bag('b-kuzey', function () { kullanici(); SC.flyTo({ yaw: 0 }, 700, false); });
  bag('b-reset', function () { turDur(); SC.flyTo(HOME); });
  bag('b-top', function () { turDur(); SC.flyTo({ tx: IM.x, tz: IM.z, dist: 15000, yaw: 0, pitch: 1.45 }); });
  bag('b-spin', function () { spin = !spin; $('b-spin').setAttribute('aria-pressed', spin); });
  bag('more', function () { $('panel').classList.toggle('open'); });
  addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || !$('yardim').hidden) return;
    if (e.key === 'ArrowRight') turGit(tStep + 1);
    else if (e.key === 'ArrowLeft') turGit(tStep - 1);
    else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); oynat(); }
    else if (e.key === '+' || e.key === '=') zoomBy(0.72);
    else if (e.key === '-' || e.key === '_') zoomBy(1.38);
  });

  // ---------- seçim (fare altındaki bina ya da nokta)
  var fareX = 0, fareY = 0, secimIste = false;
  var fbo = gl.createFramebuffer(), fboRenk = gl.createRenderbuffer(), fboDer = gl.createRenderbuffer(), fboW = 0, fboH = 0;
  function fboHazirla() {
    if (fboW === cv.width && fboH === cv.height) return;
    fboW = cv.width; fboH = cv.height;
    gl.bindRenderbuffer(gl.RENDERBUFFER, fboRenk); gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, fboW, fboH);
    gl.bindRenderbuffer(gl.RENDERBUFFER, fboDer); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, fboW, fboH);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, fboRenk);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fboDer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function binaSec() {
    if (!BN.n || !SC.binaGoster) return -1;
    fboHazirla();
    var r = cv.getBoundingClientRect(), sx = Math.round((fareX - r.left) / r.width * cv.width), sy = Math.round((1 - (fareY - r.top) / r.height) * cv.height);
    if (sx < 0 || sy < 0 || sx >= cv.width || sy >= cv.height) return -1;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, cv.width, cv.height);
    gl.enable(gl.SCISSOR_TEST); gl.scissor(sx, sy, 1, 1);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    gl.useProgram(PTs); gl.uniformMatrix4fv(U(PTs, 'uVP'), false, VP); AR.bagla(gl, PTs, 1, SC.kabCur);
    gl.uniform4f(U(PTs, 'uFrame'), ZC[0], ZC[1], ZC[2], ZC[3]); gl.uniform1f(U(PTs, 'uYo'), 0); gl.uniform1f(U(PTs, 'uEtek'), -60);
    gl.bindVertexArray(AR.vao); gl.drawElements(gl.TRIANGLES, AR.nYuzey, gl.UNSIGNED_INT, 0);
    gl.useProgram(PBs); gl.uniformMatrix4fv(U(PBs, 'uVP'), false, VP); AR.bagla(gl, PBs, 1, SC.kabCur); gl.uniform1f(U(PBs, 'uKatH'), 3);
    gl.uniform1i(U(PBs, 'uMod'), SC.binaMod === 'ozel' ? 3 : 0); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, brTex); gl.uniform1i(U(PBs, 'uBR'), 3);
    gl.bindVertexArray(BN.vao); gl.drawElements(gl.TRIANGLES, BN.nIx, gl.UNSIGNED_INT, 0);
    var px = new Uint8Array(4); gl.readPixels(sx, sy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.disable(gl.SCISSOR_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height);
    var id = px[0] + px[1] * 256 + px[2] * 65536 - 1;
    return id >= 0 && id < BN.n ? id : -1;
  }
  function project(x, y, z) {
    var o = [0, 0, 0, 0]; for (var i = 0; i < 4; i++) o[i] = VP[i] * x + VP[4 + i] * y + VP[8 + i] * z + VP[12 + i];
    if (o[3] <= 0) return null; return [(o[0] / o[3] * .5 + .5) * innerWidth, (1 - (o[1] / o[3] * .5 + .5)) * innerHeight, o[3]];
  }
  SC.project = project;
  // Ekran noktasından araziye ışın; model koordinatı [x, y] ya da null
  SC.ekrandanZemine = function (mx, my) {
    if (!EYE) return null;
    var r = cv.getBoundingClientRect(), nx = (mx - r.left) / r.width * 2 - 1, ny = 1 - (my - r.top) / r.height * 2;
    var e = EYE, f = [cam.tx - e[0], tyS - e[1], cam.tz - e[2]], fl = Math.hypot(f[0], f[1], f[2]); f = f.map(function (v) { return v / fl; });
    var rt = [f[2], 0, -f[0]], rl = Math.hypot(rt[0], rt[1], rt[2]); rt = rt.map(function (v) { return -v / rl; });
    var up = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]];
    var th = Math.tan(FOV / 2), asp = r.width / r.height, d = [0, 1, 2].map(function (i) { return f[i] + rt[i] * nx * th * asp + up[i] * ny * th; });
    var dl = Math.hypot(d[0], d[1], d[2]); d = d.map(function (v) { return v / dl; });
    var p = AR.isin(e, d, SC.kabCur);
    return p ? [p[0] + HW, p[2] + HH] : null;
  };
  // Ekranda fareye en yakın seçilebilir nokta (katman.secilebilir = true)
  function noktaSec() {
    var en = null, enD = 14;
    SC.katmanlar.forEach(function (K) {
      if (K.tur !== 'nokta' || !K.secilebilir || !K.gorunur) return;
      for (var i = 0; i < K.noktalar.length; i++) {
        var p = K.noktalar[i], x = p[0] - HW, z = p[1] - HH, y = SC.yer(x, z) + (K.y1 || 0) * 0.5;
        var s = project(x, y, z); if (!s) continue;
        var d = Math.hypot(s[0] - fareX, s[1] - fareY); if (d < enD) { enD = d; en = { katman: K, i: i }; }
      }
    });
    return en;
  }
  function secimYap() {
    secimIste = false;
    var tip = $('tip');
    var n = noktaSec(), b = n ? -1 : binaSec(), html = '';
    SC.secili = b;
    if (n && ayar.noktaIpucu) html = ayar.noktaIpucu(n.katman, n.i);
    else if (b >= 0 && ayar.binaIpucu) html = ayar.binaIpucu(BN.bilgi[b], b);
    if (!html) { tip.hidden = true; return; }
    tip.innerHTML = html; tip.hidden = false;
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.min(innerWidth - tw - 8, fareX + 14) + 'px'; tip.style.top = Math.max(64, fareY - th - 10) + 'px';
  }

  // ---------- etiketler
  var LB = $('labels'), etiketler = [];
  SC.etiket = function (metin, x, z, sinif, yEk) {
    var el = document.createElement('div'); el.className = sinif || 'lbl'; el.textContent = metin; LB.appendChild(el);
    var e = { el: el, x: x - HW, z: z - HH, y: yEk || 25, gorunur: true }; etiketler.push(e); return e;
  };
  if (ayar.etiketler !== false && typeof KENT !== 'undefined') Object.keys(KENT.etiket).forEach(function (n) { if (n !== 'Güzelbahçe Merkez') SC.etiket(n, KENT.etiket[n][0], KENT.etiket[n][1]); });
  function etiketleriYerlestir() {
    // Çakışan etiketlerden kameraya yakın olan kalır, diğeri gizlenir
    var yerlesen = [];
    etiketler.map(function (l) { return { l: l, p: l.gorunur ? project(l.x, SC.yer(l.x, l.z) + l.y, l.z) : null }; })
      .sort(function (a, b) { return (a.p ? a.p[2] : 1e9) - (b.p ? b.p[2] : 1e9); })
      .forEach(function (o) {
        var l = o.l, p = o.p;
        if (!p) { l.el.style.display = 'none'; return; }
        var w = (l.gen || (l.gen = l.el.textContent.length * 7.6 + 12)), kutu = [p[0] - w / 2, p[1] - 30, p[0] + w / 2, p[1]];
        var carp = yerlesen.some(function (k) { return kutu[0] < k[2] && kutu[2] > k[0] && kutu[1] < k[3] && kutu[3] > k[1]; });
        if (carp) { l.el.style.display = 'none'; return; }
        yerlesen.push(kutu);
        l.el.style.display = ''; l.el.style.left = p[0] + 'px'; l.el.style.top = p[1] + 'px';
      });
    M3.haritaGostergeleri(project, [cam.tx, tyS, cam.tz], cam.yaw);
  }

  // ---------- çizim
  var katU = [], turU = [];
  KAT_RENK.forEach(function (h) { katU.push.apply(katU, hex(h)); }); TUR_RENK.forEach(function (h) { turU.push.apply(turU, hex(h)); });
  function resize() { var dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); gl.viewport(0, 0, cv.width, cv.height); dirty = true; }
  addEventListener('resize', resize); resize();
  function ortak(p, fog) { gl.uniformMatrix4fv(U(p, 'uVP'), false, VP); gl.uniform3f(U(p, 'uCam'), EYE[0], EYE[1], EYE[2]); gl.uniform3f(U(p, 'uBG'), BG[0], BG[1], BG[2]); gl.uniform1f(U(p, 'uFog'), fog); }
  function ciz() {
    EYE = camPos(); VP = M3.mul(M3.persp(FOV, cv.width / cv.height, 10, 80000), M3.lookAt(EYE, [cam.tx, tyS, cam.tz], [0, 1, 0]));
    var fog = 1 / (cam.dist * 2.6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(BG[0], BG[1], BG[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    // arazi
    gl.useProgram(PT); ortak(PT, fog); AR.bagla(gl, PT, 1, SC.kabCur);
    gl.uniform4f(U(PT, 'uFrame'), ZC[0], ZC[1], ZC[2], ZC[3]); gl.uniform1f(U(PT, 'uYo'), 0); gl.uniform1f(U(PT, 'uEtek'), -60);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texHazir ? tex : null); gl.uniform1i(U(PT, 'uT'), 0);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, ortu); gl.uniform1i(U(PT, 'uO'), 2); gl.uniform1f(U(PT, 'uOA'), SC.ortuVar ? SC.ortuA : 0);
    gl.uniform1f(U(PT, 'uSoluk'), ayar.zeminSoluk ? 1 : 0);
    gl.bindVertexArray(AR.vao); gl.drawElements(gl.TRIANGLES, AR.nTum, gl.UNSIGNED_INT, 0);
    // binalar
    if (BN.n && SC.binaGoster) {
      gl.useProgram(PB); ortak(PB, fog); AR.bagla(gl, PB, 1, SC.kabCur);
      gl.uniform1f(U(PB, 'uKatH'), 3); gl.uniform3fv(U(PB, 'uKat'), katU); gl.uniform3fv(U(PB, 'uTur'), turU);
      gl.uniform1i(U(PB, 'uMod'), SC.binaMod === 'kat' ? 0 : SC.binaMod === 'tur' ? 1 : SC.binaMod === 'ozel' ? 3 : 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, brTex); gl.uniform1i(U(PB, 'uBR'), 3);
      gl.uniform1f(U(PB, 'uMin'), SC.minKat); gl.uniform1f(U(PB, 'uSec'), SC.secili);
      gl.bindVertexArray(BN.vao); gl.drawElements(gl.TRIANGLES, BN.nIx, gl.UNSIGNED_INT, 0);
    }
    // çizgi ve nokta katmanları
    SC.katmanlar.forEach(function (K) {
      if (!K.gorunur || !K.n) return;
      if (K.tur === 'cizgi') {
        gl.useProgram(PH); ortak(PH, fog); AR.bagla(gl, PH, 1, SC.kabCur);
        gl.uniform1f(U(PH, 'uT'), K.gen); gl.uniform1f(U(PH, 'uTy'), K.kal); gl.uniform1f(U(PH, 'uY'), K.y); gl.uniform1f(U(PH, 'uYan'), K.yan); gl.uniform1f(U(PH, 'uDuz'), K.duz);
        gl.uniform3f(U(PH, 'uCol'), K.col[0], K.col[1], K.col[2]); gl.uniform1f(U(PH, 'uEm'), K.em);
        gl.bindVertexArray(K.vao); gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, K.n);
      } else {
        gl.useProgram(PN); ortak(PN, fog); AR.bagla(gl, PN, 1, SC.kabCur);
        gl.uniform1f(U(PN, 'uG'), K.gen); gl.uniform1f(U(PN, 'uY0'), K.y0); gl.uniform1f(U(PN, 'uY1'), K.y1);
        gl.uniform3f(U(PN, 'uCol'), K.col[0], K.col[1], K.col[2]); gl.uniform1f(U(PN, 'uEm'), K.em);
        gl.bindVertexArray(K.vao); gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, K.n);
      }
    });
    gl.bindVertexArray(null);
    if (secimIste && !ptrs.size && !fly) secimYap();
    etiketleriYerlestir();
    if (SC.cizimSonrasi) SC.cizimSonrasi();
  }
  var lastT = performance.now();
  function kare(now) {
    var dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    if (fly) { var p = Math.min(1, (now - fly.t0) / fly.ms), e = ease(p); ['tx', 'tz', 'dist', 'yaw', 'pitch'].forEach(function (k) { cam[k] = fly.from[k] + (fly.to[k] - fly.from[k]) * e; }); if (p >= 1) fly = null; dirty = true; }
    if (spin && !fly) { cam.yaw += dt * 0.06; dirty = true; }
    var pk = SC.kabCur, pt = tyS;
    SC.kabCur = reduce ? SC.kab : SC.kabCur + (SC.kab - SC.kabCur) * Math.min(1, dt * 4);
    tyS = reduce ? tyHedef() : tyS + (tyHedef() - tyS) * Math.min(1, dt * 6);
    if (Math.abs(pk - SC.kabCur) > 1e-4 || Math.abs(pt - tyS) > 0.05) dirty = true;
    if (dirty) { ciz(); dirty = false; }
    requestAnimationFrame(kare);
  }
  var hazirSay = 0;
  function hazirKontrol() { if (AR.hazir && texHazir && !hazirSay++) setTimeout(M3.yuklendi, 250); }

  // ---------- gezinti
  var TOUR = [], tStep = -1, tTimer = null, playing = false, ADIM_MS = 8500;
  var dots = $('t-dots');
  function turMetni() {
    if (!$('t-title')) return;
    if (tStep < 0) {
      $('t-title').textContent = M3.t('Gezinti', 'Guided tour');
      $('t-text').textContent = ayar.turGiris ? ayar.turGiris() : '';
      $('t-step').textContent = TOUR.length + M3.t(' durak', ' stops');
    } else {
      var st = TOUR[tStep]; $('t-title').textContent = typeof st.baslik === 'function' ? st.baslik() : M3.t(st.baslik[0], st.baslik[1]);
      $('t-text').textContent = st.metin(); $('t-step').textContent = (tStep + 1) + ' / ' + TOUR.length;
    }
    $('t-play').textContent = playing ? M3.t('❚❚ Duraklat', '❚❚ Pause') : (tStep >= 0 ? M3.t('▶ Devam et', '▶ Continue') : M3.t('▶ Gezintiyi başlat', '▶ Start the tour'));
  }
  function turGit(i) {
    if (!TOUR.length) return;
    tStep = (i + TOUR.length) % TOUR.length; var st = TOUR[tStep];
    if (st.ayar) st.ayar();
    SC.flyTo(st.cam || HOME, 3000);
    turMetni();
    Array.from(dots.children).forEach(function (d, k) { d.className = k === tStep ? 'on' : k < tStep ? 'done' : ''; });
    clearTimeout(tTimer);
    if (playing) { M3.ilerleme(ADIM_MS); tTimer = setTimeout(function () { if (tStep < TOUR.length - 1) turGit(tStep + 1); else turDur(); }, ADIM_MS); }
  }
  function turDur() { playing = false; clearTimeout(tTimer); M3.ilerleme(0); turMetni(); }
  function kullanici() { if (playing) turDur(); fly = null; }
  function oynat() { if (playing) { turDur(); return; } playing = true; turGit(tStep < 0 || tStep >= TOUR.length - 1 ? 0 : tStep + 1); }
  SC.tur = function (adimlar) {
    TOUR = adimlar; dots.innerHTML = ''; TOUR.forEach(function () { dots.appendChild(document.createElement('i')); });
    $('t-play').onclick = oynat; $('t-next').onclick = function () { turGit(tStep + 1); }; $('t-prev').onclick = function () { turGit(tStep <= 0 ? TOUR.length - 1 : tStep - 1); };
    turMetni();
  };
  SC.turMetni = turMetni;
  addEventListener('m3dil', function () { turMetni(); $('tip').hidden = true; dirty = true; });

  // ---------- yardımcılar
  // r yarıçap (m) içindeki binalar
  SC.yakinBinalar = function (x, z, r) { x -= HW; z -= HH; return BN.bilgi.filter(function (b) { return Math.hypot(b.x - x, b.z - z) <= r; }); };
  SC.basla = function () { Object.assign(cam, HOME); cam.dist *= aspK(); turMetni(); requestAnimationFrame(kare); };
  return SC;
};
})();
