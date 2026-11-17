// =============================================
// İzmir Güzelbahçe Veri Portalı · 3B modeller: ortak arazi
// ARAZI (3b/arazi-veri.js) yükseklik ızgarasını çözer ve iki modele şunları sağlar:
// - JS'te kot örnekleme (etiketler, kamera, fareyle seçim)
// - WebGL dokusu (RG32F: kot m, sınıf) ve GLSL yardımcıları (köşe gölgelendiricide örnekleme)
// - Arazi ağı: 25 m ızgara (ilçenin tamamı) + kenarda aşağı inen etek
// Dünya koordinatı: x = modelX - W/2, z = modelY - H/2 (kuzey = -z), y yukarı (m). W, H: ilk model çerçevesi (8660 x 4420).
// Sınıf kodu (dokunun G kanalı): kod + 4 × ilçe içi; kod 0 veri yok, 1 deniz, 2 halihazır, 3 Copernicus.
// =============================================
(function () {
    'use strict';

    // Köşe gölgelendiricilere eklenecek ortak GLSL. uK: kot kabartması (1 = gerçek ölçek).
    var GLSL = [
        'uniform highp sampler2D uH;uniform vec3 uHF;uniform float uK;',
        'vec2 _hr(ivec2 c){ivec2 m=textureSize(uH,0)-1;return texelFetch(uH,clamp(c,ivec2(0),m),0).rg;}',
        'vec2 araziHam(vec2 xz){vec2 g=(xz-uHF.xy)/uHF.z;vec2 f=floor(g);vec2 a=g-f;ivec2 c=ivec2(f);',
        ' return mix(mix(_hr(c),_hr(c+ivec2(1,0)),a.x),mix(_hr(c+ivec2(0,1)),_hr(c+ivec2(1,1)),a.x),a.y);}',
        'float araziY(vec2 xz){return araziHam(xz).x*uK;}',
        'vec3 araziN(vec2 xz){float e=uHF.z;float l=araziY(xz-vec2(e,0.)),r=araziY(xz+vec2(e,0.)),b=araziY(xz-vec2(0.,e)),f=araziY(xz+vec2(0.,e));',
        ' return normalize(vec3(l-r,2.*e,b-f));}',
        // en yakın örneğin sınıfı -> (deniz, halihazır, Copernicus, ilçe içi)
        'vec4 araziSinif(vec2 xz){vec2 g=(xz-uHF.xy)/uHF.z;float s=_hr(ivec2(floor(g+.5))).y;float k=mod(s,4.);',
        ' return vec4(1.-step(.5,abs(k-1.)),1.-step(.5,abs(k-2.)),1.-step(.5,abs(k-3.)),step(3.5,s));}'
    ].join('\n');

    // Arazi ağı için köşe gölgelendirici. aP = (x, z, etek). uYo: yüzeyi aşağı/yukarı kaydırma (katman ızgaraları), uEtek: etek tabanı.
    var VS = '#version 300 es\n' +
        'layout(location=0) in vec3 aP;uniform mat4 uVP;uniform vec4 uFrame;uniform float uYo;uniform float uEtek;\n' + GLSL + '\n' +
        'out vec3 vW;out vec2 vUV;out vec3 vN;out vec4 vS;out float vH;out float vE;\n' +
        'void main(){vec2 xz=aP.xy;vec2 hs=araziHam(xz);float y=hs.x*uK+uYo;if(aP.z>.5)y=uEtek;' +
        'vW=vec3(xz.x,y,xz.y);vUV=(xz-uFrame.xy)/uFrame.zw;vN=araziN(xz);vS=araziSinif(xz);vH=hs.x;vE=aP.z;gl_Position=uVP*vec4(vW,1.);}';

    // Parça gölgelendiricilerde arazi rengi: kabartma gölgesi, yükseklik tonu, eş yükselti eğrileri; ilçe dışı soluk.
    // tex: zemin haritası rengi, N: normal, k: (deniz, halihazır, Copernicus, ilçe içi), h: gerçek kot (m), W: dünya konumu, e: etek (0/1)
    var RENK = [
        'vec3 araziRenk(vec3 tex,vec3 N,vec4 k,float h,vec3 W,float e){',
        ' vec3 L=normalize(vec3(-.5,.72,.45));',
        ' if(e>.01){vec3 nf=normalize(cross(dFdx(W),dFdy(W)));float d=abs(dot(nf,L));return mix(vec3(.10,.11,.13),vec3(.20,.19,.18),d)*(.75+.25*smoothstep(-400.,0.,W.y));}',
        ' float dif=max(dot(normalize(N),L),0.);',
        ' float deniz=k.x;float veri=k.y+k.z;float yok=clamp(1.-deniz-veri,0.,1.);float ilce=k.w;',
        ' vec3 c=tex*mix(1.,.5+.85*dif,1.-deniz);',
        ' vec3 ton=mix(vec3(.07,.12,.12),vec3(.26,.21,.15),smoothstep(0.,420.,h));',
        ' c+=ton*veri*(.45+.75*dif);',
        ' float a=h/10.;float w=fwidth(a);float l1=(1.-smoothstep(0.,1.3*w,abs(fract(a-.5)-.5)))*(1.-smoothstep(.25,.6,w));',
        ' float b=h/50.;float wb=fwidth(b);float l5=(1.-smoothstep(0.,1.6*wb,abs(fract(b-.5)-.5)))*(1.-smoothstep(.3,.7,wb));',
        ' c+=vec3(.62,.72,.78)*(l1*.07+l5*.2)*veri*step(.5,h);',
        ' float ht=step(.55,fract((W.x+W.z)/70.));c=mix(c,c*.45+vec3(.035,.035,.04)*(1.+ht),yok);',
        ' c=mix(mix(vec3(dot(c,vec3(.3,.5,.2))),c,.35)*.62,c,max(ilce,deniz));',
        ' return c;}'
    ].join('\n');

    M3.araziGLSL = GLSL;
    M3.araziVS = VS;
    M3.araziRenk = RENK;
    // Zemin haritasının dünya koordinatındaki çerçevesi [x0, z0, genişlik, yükseklik] (3b/zemin.js: ZEMIN)
    M3.zeminCerceve = function () {
        var Z = (typeof ZEMIN !== 'undefined') ? ZEMIN : { mx0: 0, my0: 0, w: 8660, h: 4420 };
        return [Z.mx0 - 4330, Z.my0 - 2210, Z.w, Z.h];
    };

    M3.arazi = function (gl, hazir) {
        // ARAZI, 3b/arazi-veri.js'te üst düzey const (window özelliği değil)
        var A = ARAZI;
        var nx = A.nx, nz = A.nz, CS = A.hucre, x0 = (A.mx0 || 0) - A.W / 2, z0 = (A.my0 || 0) - A.H / 2;
        var x1 = x0 + (nx - 1) * CS, z1 = z0 + (nz - 1) * CS;
        var h = new Float32Array(nx * nz), s = new Uint8Array(nx * nz);
        var o = { nx: nx, nz: nz, CS: CS, x0: x0, z0: z0, x1: x1, z1: z1, h: h, s: s, max: 0, hazir: false, tex: gl.createTexture() };

        // Kot (m, gerçek ölçek), çift doğrusal. Çerçeve dışında 400 m içinde 0'a (düz zemin) iner.
        o.yer = function (x, z) {
            if (!o.hazir) return 0;
            var gx = Math.max(0, Math.min(nx - 1.001, (x - x0) / CS)), gz = Math.max(0, Math.min(nz - 1.001, (z - z0) / CS));
            var i = Math.floor(gx), j = Math.floor(gz), a = gx - i, b = gz - j, k = j * nx + i;
            var v = (h[k] * (1 - a) + h[k + 1] * a) * (1 - b) + (h[k + nx] * (1 - a) + h[k + nx + 1] * a) * b;
            var dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1);
            return v * Math.max(0, 1 - Math.hypot(dx, dz) / 400);
        };
        // sınıf kodu (en yakın örnek): kod + 4 × ilçe içi (kod 0 veri yok, 1 deniz, 2 halihazır, 3 Copernicus); ızgara dışı -1
        o.sinif = function (x, z) {
            var i = Math.round((x - x0) / CS), j = Math.round((z - z0) / CS);
            if (i < 0 || j < 0 || i >= nx || j >= nz || !o.hazir) return -1;
            return s[j * nx + i];
        };
        // Işın–arazi kesişimi: e = göz, d = birim yön, k = kabartma. [x, y, z] ya da null
        o.isin = function (e, d, k) {
            var tepe = o.max * k + 1;
            if (d[1] >= 0 && e[1] > tepe) return null;
            var t0 = 0;
            if (e[1] > tepe) t0 = (e[1] - tepe) / -d[1];
            var adim = 12, onceki = t0, t = t0, son = t0 + 60000;
            for (var n = 0; n < 6000 && t < son; n++) {
                var x = e[0] + d[0] * t, y = e[1] + d[1] * t, z = e[2] + d[2] * t;
                if (y <= o.yer(x, z) * k) {
                    var a = onceki, b = t;
                    for (var q = 0; q < 18; q++) { var m = (a + b) / 2; if (e[1] + d[1] * m <= o.yer(e[0] + d[0] * m, e[2] + d[2] * m) * k) b = m; else a = m; }
                    return [e[0] + d[0] * b, e[1] + d[1] * b, e[2] + d[2] * b];
                }
                if (y < -50 && d[1] <= 0) return null;
                onceki = t; t += adim + t * 0.002;
            }
            return null;
        };
        // Programa doku ve sabitleri bağla
        o.bagla = function (gl, p, birim, k) {
            gl.activeTexture(gl.TEXTURE0 + birim); gl.bindTexture(gl.TEXTURE_2D, o.tex);
            gl.uniform1i(gl.getUniformLocation(p, 'uH'), birim);
            gl.uniform3f(gl.getUniformLocation(p, 'uHF'), x0, z0, CS);
            gl.uniform1f(gl.getUniformLocation(p, 'uK'), k);
        };

        // Ağ: yüzey köşeleri + kenarda etek köşeleri
        (function () {
            var v = [], ix = [];
            for (var j = 0; j < nz; j++) for (var i = 0; i < nx; i++) v.push(x0 + i * CS, z0 + j * CS, 0);
            for (var j2 = 0; j2 < nz - 1; j2++) for (var i2 = 0; i2 < nx - 1; i2++) {
                var a = j2 * nx + i2; ix.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
            }
            o.nYuzey = ix.length;
            var kenar = [];
            for (var i3 = 0; i3 < nx; i3++) kenar.push(i3);
            for (var j3 = 1; j3 < nz; j3++) kenar.push(j3 * nx + nx - 1);
            for (var i4 = nx - 2; i4 >= 0; i4--) kenar.push((nz - 1) * nx + i4);
            for (var j4 = nz - 2; j4 >= 1; j4--) kenar.push(j4 * nx);
            var bas = v.length / 3;
            kenar.forEach(function (k) { v.push(v[k * 3], v[k * 3 + 1], 1); });
            for (var q = 0; q < kenar.length; q++) {
                var u0 = kenar[q], u1 = kenar[(q + 1) % kenar.length], e0 = bas + q, e1 = bas + (q + 1) % kenar.length;
                ix.push(u0, e0, u1, u1, e0, e1);
            }
            o.nTum = ix.length;
            o.vao = gl.createVertexArray(); gl.bindVertexArray(o.vao);
            var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(ix), gl.STATIC_DRAW);
            gl.bindVertexArray(null);
        })();
        // Doku hazır olana kadar düz (0 m) bir doku
        gl.bindTexture(gl.TEXTURE_2D, o.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, 1, 1, 0, gl.RG, gl.FLOAT, new Float32Array([0, 6]));
        ['TEXTURE_MIN_FILTER', 'TEXTURE_MAG_FILTER'].forEach(function (p) { gl.texParameteri(gl.TEXTURE_2D, gl[p], gl.NEAREST); });
        ['TEXTURE_WRAP_S', 'TEXTURE_WRAP_T'].forEach(function (p) { gl.texParameteri(gl.TEXTURE_2D, gl[p], gl.CLAMP_TO_EDGE); });

        var img = new Image();
        img.onload = function () {
            var c = document.createElement('canvas'); c.width = nx; c.height = nz;
            var cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
            var d = cx.getImageData(0, 0, nx, nz).data, rg = new Float32Array(nx * nz * 2);
            for (var i = 0; i < nx * nz; i++) {
                var kot = (d[i * 4] * 256 + d[i * 4 + 1]) / 10, b = d[i * 4 + 2];
                h[i] = kot; s[i] = Math.round(b / 32);
                rg[i * 2] = kot; rg[i * 2 + 1] = s[i]; if (kot > o.max) o.max = kot;
            }
            gl.bindTexture(gl.TEXTURE_2D, o.tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, nx, nz, 0, gl.RG, gl.FLOAT, rg);
            o.hazir = true;
            if (hazir) hazir(o);
        };
        img.onerror = function () { if (hazir) hazir(o); };
        img.src = A.png;
        return o;
    };
})();
