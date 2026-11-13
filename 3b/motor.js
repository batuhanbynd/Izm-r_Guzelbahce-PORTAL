// =============================================
// BAS PORTAL · 3B modeller: ortak yardımcılar
// - Dil (TR / EN): portalla aynı "bas-dil" seçimini kullanır
// - Sayı biçimi, pusula, ölçek çubuğu, tam ekran, yardım, yükleniyor ekranı
// - WebGL ve matris yardımcıları
// =============================================
(function () {
    'use strict';
    var ANAHTAR = 'bas-dil';
    var dil = 'tr';
    try { if (localStorage.getItem(ANAHTAR) === 'en') dil = 'en'; } catch (e) { /* depolama kapalı */ }
    document.documentElement.setAttribute('lang', dil);

    var M3 = window.M3 = {};
    M3.dil = function () { return dil; };
    M3.en = function () { return dil === 'en'; };
    // M3.t('Türkçe', 'English')
    M3.t = function (tr, en) { return dil === 'en' ? en : tr; };
    M3.yerel = function () { return dil === 'en' ? 'en-US' : 'tr-TR'; };
    M3.fmt = function (n, d) {
        d = d || 0;
        return Number(n).toLocaleString(M3.yerel(), { minimumFractionDigits: d, maximumFractionDigits: d });
    };
    // Yüzde: TR %48,2 · EN 48.2%
    M3.pct = function (n, d) {
        var s = M3.fmt(n, d === undefined ? 1 : d);
        return dil === 'en' ? s + '%' : '%' + s;
    };
    M3.mesafe = function (m) {
        return m >= 1000 ? M3.fmt(m / 1000, 2) + ' km' : M3.fmt(Math.round(m / 10) * 10) + ' m';
    };

    // ---- Sabit metinler: data-en özniteliği olan öğeler
    function sabitleriCevir() {
        document.querySelectorAll('[data-en]').forEach(function (el) {
            if (!el.hasAttribute('data-tr')) el.setAttribute('data-tr', el.textContent);
            el.textContent = dil === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-tr');
        });
        ['aria-label', 'title'].forEach(function (oz) {
            document.querySelectorAll('[data-en-' + oz + ']').forEach(function (el) {
                if (!el.hasAttribute('data-tr-' + oz)) el.setAttribute('data-tr-' + oz, el.getAttribute(oz) || '');
                el.setAttribute(oz, dil === 'en' ? el.getAttribute('data-en-' + oz) : el.getAttribute('data-tr-' + oz));
            });
        });
        var bas = document.querySelector('meta[name="m3-baslik-en"]');
        if (bas) {
            if (!M3._trBaslik) M3._trBaslik = document.title;
            document.title = dil === 'en' ? bas.getAttribute('content') : M3._trBaslik;
        }
        document.querySelectorAll('.dil button').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-dil') === dil));
        });
    }

    M3.dilAyarla = function (yeni) {
        if (yeni === dil) return;
        dil = yeni;
        document.documentElement.setAttribute('lang', dil);
        try { localStorage.setItem(ANAHTAR, dil); } catch (e) { /* depolama kapalı */ }
        sabitleriCevir();
        window.dispatchEvent(new CustomEvent('m3dil', { detail: dil }));
    };

    // ---- Üst çubuk, yardım, tam ekran
    M3.arayuz = function () {
        sabitleriCevir();
        document.querySelectorAll('.dil button').forEach(function (b) {
            b.addEventListener('click', function () { M3.dilAyarla(b.getAttribute('data-dil')); });
        });

        var yardim = document.getElementById('yardim');
        var yardimBtn = document.getElementById('b-yardim');
        var oncekiOdak = null;
        function yardimAc() {
            oncekiOdak = document.activeElement;
            yardim.hidden = false;
            var k = yardim.querySelector('button');
            if (k) k.focus();
        }
        function yardimKapat() {
            yardim.hidden = true;
            if (oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
        }
        if (yardimBtn && yardim) {
            yardimBtn.addEventListener('click', yardimAc);
            yardim.addEventListener('click', function (e) { if (e.target === yardim || e.target.closest('[data-kapat]')) yardimKapat(); });
        }
        addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT') return;
            if (yardim && !yardim.hidden && e.key === 'Escape') { yardimKapat(); return; }
            if (yardim && (e.key === '?' || ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey))) {
                if (yardim.hidden) yardimAc(); else yardimKapat();
            }
            if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) tamEkran();
        });

        var tamBtn = document.getElementById('b-tam');
        function tamEkran() {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
            } else if (document.exitFullscreen) document.exitFullscreen();
        }
        if (tamBtn) {
            if (!document.documentElement.requestFullscreen) tamBtn.hidden = true;
            tamBtn.addEventListener('click', tamEkran);
            document.addEventListener('fullscreenchange', function () {
                tamBtn.setAttribute('aria-pressed', String(!!document.fullscreenElement));
            });
        }
    };

    M3.yuklendi = function () {
        var y = document.getElementById('yukleniyor');
        if (!y) return;
        y.classList.add('bitti');
        setTimeout(function () { y.hidden = true; }, 700);
    };

    // ---- Pusula ve ölçek çubuğu (dünya birimi = 1 m, kuzey = -z)
    var OLCEKLER = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
    M3.haritaGostergeleri = function (proj, hedef, yaw) {
        var p0 = proj(hedef[0], hedef[1], hedef[2]);
        var p1 = proj(hedef[0], hedef[1], hedef[2] - 500);
        var pus = document.querySelector('.pusula svg');
        if (p0 && p1 && pus) {
            var aci = Math.atan2(p1[0] - p0[0], -(p1[1] - p0[1])) * 180 / Math.PI;
            pus.style.transform = 'rotate(' + aci.toFixed(1) + 'deg)';
        }
        var olcek = document.getElementById('olcek');
        if (!olcek || !p0) return;
        var rx = Math.cos(yaw), rz = -Math.sin(yaw);
        var p2 = proj(hedef[0] + rx * 1000, hedef[1], hedef[2] + rz * 1000);
        if (!p2) { olcek.hidden = true; return; }
        var pxKm = Math.hypot(p2[0] - p0[0], p2[1] - p0[1]);
        if (!(pxKm > 0)) { olcek.hidden = true; return; }
        var sec = OLCEKLER[0];
        for (var i = 0; i < OLCEKLER.length; i++) { if (OLCEKLER[i] / 1000 * pxKm <= 130) sec = OLCEKLER[i]; }
        olcek.hidden = false;
        olcek.querySelector('i').style.width = Math.round(sec / 1000 * pxKm) + 'px';
        olcek.querySelector('b').textContent = sec >= 1000 ? M3.fmt(sec / 1000, sec % 1000 ? 1 : 0) + ' km' : sec + ' m';
    };

    // ---- Gezinti ilerleme çubuğu
    M3.ilerleme = function (ms) {
        var s = document.querySelector('.ilerleme-cubugu span');
        if (!s) return;
        s.style.transition = 'none';
        s.style.width = '0';
        if (!ms) return;
        void s.offsetWidth;
        s.style.transition = 'width ' + ms + 'ms linear';
        s.style.width = '100%';
    };

    // ---- WebGL ve matris yardımcıları
    M3.program = function (gl, vs, fs) {
        function sh(t, src) {
            var s = gl.createShader(t);
            gl.shaderSource(s, src); gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
            return s;
        }
        var p = gl.createProgram();
        gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
    };
    M3.persp = function (fy, as, n, f) { var t = 1 / Math.tan(fy / 2), nf = 1 / (n - f); return [t / as, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; };
    M3.lookAt = function (e, c, u) {
        var z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; var l = Math.hypot(z[0], z[1], z[2]); z = z.map(function (v) { return v / l; });
        var x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]; l = Math.hypot(x[0], x[1], x[2]); x = x.map(function (v) { return v / l; });
        var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
        return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
    };
    M3.mul = function (a, b) { var o = new Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };
})();
