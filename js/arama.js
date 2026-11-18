// =============================================
// Portal içi akıllı arama (Ctrl+K / ⌘K ya da "/")
// - Dizin (js/arama-dizin.js) ilk açılışta yüklenir; _tools/arama/dizin_uret.py üretir.
// - Türkçe karakterlere duyarsız (ç=c, ğ=g, ı=i, ö=o, ş=s, ü=u), her kelime aranır; başlıkta geçenler öne çıkar.
// - Sonuca gidilince hedef sayfada ilgili kart bulunur, kaydırılır ve kısa süre vurgulanır (#bul=...).
// - İngilizce modda sonuçlar sözlükten çevrilir; arama iki dilde birden yapılır.
// =============================================
(function () {
    const kok = document.documentElement;
    const en = () => kok.lang === 'en';
    const cev = (s) => (s && en() && typeof window.basCevir === 'function') ? s.split(' · ').map(p => window.basCevir(p)).join(' · ') : (s || '');
    const T = (tr, eng) => en() ? eng : tr;
    const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

    // Türkçe duyarsız, uzunluğu koruyan küçültme (vurgulama konumları bozulmasın)
    const HARF = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u', 'é': 'e' };
    function sade(s) {
        let o = '';
        for (const ch of String(s)) {
            const k = ch.toLocaleLowerCase('tr');
            const t = k.length === 1 ? k : ch.toLowerCase().charAt(0);
            o += HARF[t] || t;
        }
        return o;
    }

    // ---------- arayüz
    const dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'arama-dugmesi';
    dugme.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>Portalda ara</span><kbd>' + (MAC ? '⌘' : 'Ctrl') + ' K</kbd>';
    const marka = document.querySelector('.sidebar .brand');
    if (marka) marka.insertAdjacentElement('afterend', dugme);
    const mobil = document.createElement('button');
    mobil.type = 'button';
    mobil.className = 'arama-mobil';
    mobil.setAttribute('aria-label', 'Portalda ara');
    mobil.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>';
    document.body.appendChild(mobil);

    const perde = document.createElement('div');
    perde.className = 'arama-perde';
    perde.hidden = true;
    perde.innerHTML =
        '<div class="arama-kutu" role="dialog" aria-modal="true" aria-label="Portalda ara">' +
        '<div class="arama-ust"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<input type="search" id="arama-girdi" role="combobox" aria-expanded="true" aria-controls="arama-sonuc" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Sayfa, rakam, hat, baraj, mahalle…">' +
        '<kbd class="arama-esc">Esc</kbd></div>' +
        '<div class="arama-govde"><ul id="arama-sonuc" role="listbox" aria-label="Sonuçlar"></ul></div>' +
        '<div class="arama-alt"><span><kbd>↑</kbd><kbd>↓</kbd> gezin</span><span><kbd>Enter</kbd> aç</span><span><kbd>Esc</kbd> kapat</span><span class="arama-sayi" aria-live="polite"></span></div>' +
        '</div>';
    document.body.appendChild(perde);
    const girdi = perde.querySelector('#arama-girdi');
    const liste = perde.querySelector('#arama-sonuc');
    const sayi = perde.querySelector('.arama-sayi');

    const TUR = {
        sayfa: ['Sayfa', 'Page', 'fa-file-lines'], bolum: ['Bölüm', 'Section', 'fa-bookmark'], kart: ['Kart', 'Card', 'fa-square-poll-vertical'],
        deger: ['Değer', 'Figure', 'fa-hashtag'], tablo: ['Tablo', 'Table', 'fa-table'], olay: ['Olay', 'Event', 'fa-clock-rotate-left']
    };
    const TUR_AGIRLIK = { sayfa: 9, bolum: 6, kart: 4, deger: 4, tablo: 2, olay: 2 };
    const ONERI = ['SEGE', 'Çamlı Barajı', 'Hat 8', 'deprem', 'su tüketimi', 'taşkın', 'Kavacık', '400 m', 'katı atık', 'metro'];

    // ---------- dizin
    let dizin = null, yukleniyor = null;
    function dizinYukle() {
        if (dizin) return Promise.resolve(dizin);
        if (yukleniyor) return yukleniyor;
        yukleniyor = new Promise(function (coz, red) {
            const s = document.createElement('script');
            s.src = 'js/arama-dizin.js';
            s.onload = function () {
                const D = window.ARAMA_DIZIN;
                dizin = D.kayit.map(function (k, i) {
                    const sayfa = D.sayfalar[k[0]] || [k[0], 'fa-file'];
                    const tr = [k[2], k[3], k[4], sayfa[0]].join(' ¦ ');
                    return { i: i, s: k[0], tur: k[1], b: k[2], m: k[3], c: k[4], h: k[5], sayfa: sayfa[0], ikon: sayfa[1], tr: sade(tr), bs: sade(k[2]), en: null };
                });
                coz(dizin);
            };
            s.onerror = red;
            document.head.appendChild(s);
        });
        return yukleniyor;
    }
    function enMetin(k) {
        if (k.en === null) {
            k.enB = cev(k.b); k.enM = cev(k.m); k.enC = cev(k.c); k.enS = cev(k.sayfa);
            k.en = sade([k.enB, k.enM, k.enC, k.enS].join(' ¦ ')); k.enBs = sade(k.enB);
        }
        return k;
    }

    const harfMi = (c) => !!c && /[a-z0-9]/.test(c);
    function tamKelime(metin, w) {
        let i = metin.indexOf(w);
        while (i >= 0) {
            if (!harfMi(metin.charAt(i - 1)) && !harfMi(metin.charAt(i + w.length))) return true;
            i = metin.indexOf(w, i + 1);
        }
        return false;
    }

    function ara(sorgu) {
        const kelime = sade(sorgu).split(/\s+/).filter(Boolean);
        if (!kelime.length) return [];
        const tum = sade(sorgu.trim());
        const sonuc = [];
        dizin.forEach(function (k) {
            if (en()) enMetin(k);
            let puan = 0;
            for (const w of kelime) {
                const a = k.tr.indexOf(w), b = k.en ? k.en.indexOf(w) : -1;
                if (a < 0 && b < 0) return;
                const bas = k.bs.indexOf(w), bas2 = k.enBs ? k.enBs.indexOf(w) : -1;
                if (bas === 0 || bas2 === 0) puan += 16;
                else if (bas > 0 || bas2 > 0) puan += (k.bs.charAt(bas - 1) === ' ' || (k.enBs && k.enBs.charAt(bas2 - 1) === ' ')) ? 12 : 8;
                else puan += 2;
                if (tamKelime(k.bs, w) || (k.enBs && tamKelime(k.enBs, w))) puan += 6;
            }
            if (k.bs.indexOf(tum) >= 0 || (k.enBs && k.enBs.indexOf(tum) >= 0)) puan += 14;
            // Tam kelime eşleşmesi (ör. "hat 8" için Hat 82'nin önüne Hat 8)
            if (tamKelime(k.bs, tum) || (k.enBs && tamKelime(k.enBs, tum))) puan += 10;
            puan += TUR_AGIRLIK[k.tur] || 0;
            puan -= Math.min(6, k.b.length / 40);
            sonuc.push([puan, k]);
        });
        return sonuc.sort(function (a, b) { return b[0] - a[0]; }).slice(0, 40).map(function (x) { return x[1]; });
    }

    function kacis(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function vurgula(s, kelime) {
        if (!s) return '';
        const n = sade(s), isaret = new Array(s.length).fill(false);
        kelime.forEach(function (w) { let i = n.indexOf(w); while (i >= 0 && w) { for (let j = i; j < i + w.length; j++) isaret[j] = true; i = n.indexOf(w, i + w.length); } });
        let o = '', acik = false;
        for (let i = 0; i < s.length; i++) {
            if (isaret[i] && !acik) { o += '<mark>'; acik = true; }
            if (!isaret[i] && acik) { o += '</mark>'; acik = false; }
            o += kacis(s.charAt(i));
        }
        return o + (acik ? '</mark>' : '');
    }

    let sonuclar = [], secili = 0;
    function ciz(sorgu) {
        liste.innerHTML = '';
        const kelime = sade(sorgu).split(/\s+/).filter(Boolean);
        if (!kelime.length) {
            sonuclar = [];
            const li = document.createElement('li');
            li.className = 'arama-oneri';
            li.setAttribute('role', 'presentation');
            li.innerHTML = '<span class="arama-grup">' + T('Öneriler', 'Suggestions') + '</span><div>' +
                ONERI.map(function (o) { return '<button type="button" data-o="' + kacis(o) + '">' + kacis(en() ? cev(o) : o) + '</button>'; }).join('') + '</div>';
            liste.appendChild(li);
            li.querySelectorAll('button').forEach(function (b) { b.onclick = function () { girdi.value = b.textContent; ciz(girdi.value); girdi.focus(); }; });
            sayi.textContent = '';
            girdi.removeAttribute('aria-activedescendant');
            return;
        }
        sonuclar = ara(sorgu);
        sayi.textContent = sonuclar.length ? (sonuclar.length + T(' sonuç', ' results')) : '';
        if (!sonuclar.length) {
            const li = document.createElement('li');
            li.className = 'arama-bos';
            li.setAttribute('role', 'presentation');
            li.innerHTML = '<i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true"></i>' + T('Sonuç bulunamadı. Başka bir kelime deneyin.', 'No results. Try another word.');
            liste.appendChild(li);
            girdi.removeAttribute('aria-activedescendant');
            return;
        }
        // Sayfalara göre grupla (en iyi sonucu olan sayfa önce)
        const gruplar = [];
        sonuclar.forEach(function (k) { let g = gruplar.find(function (x) { return x.s === k.s; }); if (!g) { g = { s: k.s, ad: k.sayfa, ikon: k.ikon, k: [] }; gruplar.push(g); } g.k.push(k); });
        sonuclar = [];
        gruplar.forEach(function (g) {
            const bas = document.createElement('li');
            bas.className = 'arama-grup';
            bas.setAttribute('role', 'presentation');
            bas.innerHTML = '<i class="fa-solid ' + g.ikon + '" aria-hidden="true"></i>' + kacis(en() ? cev(g.ad) : g.ad);
            liste.appendChild(bas);
            g.k.forEach(function (k) {
                const n = sonuclar.length; sonuclar.push(k);
                const b = en() ? enMetin(k).enB : k.b, m = en() ? k.enM : k.m, c = en() ? k.enC : k.c;
                const li = document.createElement('li');
                li.id = 'arama-s' + n;
                li.className = 'arama-kayit';
                li.setAttribute('role', 'option');
                li.innerHTML = '<span class="ak-ikon"><i class="fa-solid ' + TUR[k.tur][2] + '" aria-hidden="true"></i></span>' +
                    '<span class="ak-metin"><span class="ak-baslik">' + vurgula(b, kelime) + (k.tur === 'deger' && m ? ' <b>' + vurgula(m, kelime) + '</b>' : '') + '</span>' +
                    (k.tur !== 'deger' && m ? '<span class="ak-govde">' + vurgula(m, kelime) + '</span>' : '') +
                    (c ? '<span class="ak-baglam">' + kacis(c) + '</span>' : '') + '</span>' +
                    '<span class="ak-tur">' + (en() ? TUR[k.tur][1] : TUR[k.tur][0]) + '</span>';
                li.onmousemove = function () { if (secili !== n) sec(n); };
                li.onclick = function () { git(k); };
                liste.appendChild(li);
            });
        });
        sec(0);
    }
    function sec(n) {
        if (!sonuclar.length) return;
        secili = (n + sonuclar.length) % sonuclar.length;
        liste.querySelectorAll('.arama-kayit').forEach(function (li, i) { li.setAttribute('aria-selected', i === secili); });
        const el = liste.querySelector('#arama-s' + secili);
        girdi.setAttribute('aria-activedescendant', 'arama-s' + secili);
        if (el) el.scrollIntoView({ block: 'nearest' });
    }

    let oncekiOdak = null;
    function ac() {
        oncekiOdak = document.activeElement;
        perde.hidden = false;
        document.body.classList.add('arama-acik');
        girdi.value = '';
        dizinYukle().then(function () { ciz(girdi.value); }).catch(function () { liste.innerHTML = '<li class="arama-bos">' + T('Arama dizini yüklenemedi.', 'The search index could not be loaded.') + '</li>'; });
        ciz('');
        setTimeout(function () { girdi.focus(); }, 0);
    }
    function kapat() {
        perde.hidden = true;
        document.body.classList.remove('arama-acik');
        if (oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
    }
    function git(k) {
        const hedef = k.s + (k.tur === 'sayfa' && k.s.indexOf('3b') === 0 || k.s === 'senaryo.html' ? '' : '#bul=' + encodeURIComponent(k.h));
        kapat();
        const burasi = location.pathname.split('/').pop() || 'index.html';
        if (k.s === burasi && hedef.indexOf('#bul=') > 0) { history.replaceState(null, '', '#bul=' + encodeURIComponent(k.h)); bulVeGoster(); }
        else location.href = hedef;
    }

    dugme.onclick = ac;
    mobil.onclick = ac;
    perde.addEventListener('mousedown', function (e) { if (e.target === perde) kapat(); });
    girdi.addEventListener('input', function () { if (dizin) ciz(girdi.value); });
    girdi.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); sec(secili + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sec(secili - 1); }
        else if (e.key === 'Enter') { e.preventDefault(); if (sonuclar[secili]) git(sonuclar[secili]); }
        else if (e.key === 'Escape') { e.preventDefault(); kapat(); }
    });
    perde.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') { e.preventDefault(); girdi.focus(); }
    });
    document.addEventListener('keydown', function (e) {
        const yaziyor = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName) || (document.activeElement && document.activeElement.isContentEditable);
        if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); perde.hidden ? ac() : kapat(); }
        else if (e.key === '/' && !yaziyor && perde.hidden) { e.preventDefault(); ac(); }
    });
    window.addEventListener('dildegisti', function () { if (dizin) dizin.forEach(function (k) { k.en = null; }); if (!perde.hidden) ciz(girdi.value); });

    // ---------- hedef sayfada: #bul=... ile gelen kartı bul, aç, kaydır, vurgula
    function bulVeGoster() {
        const m = location.hash.match(/^#bul=(.+)$/);
        if (!m) return;
        let aranan; try { aranan = decodeURIComponent(m[1]); } catch (e) { return; }
        const adaylar = [sade(aranan), sade(cev(aranan))];
        const secici = 'main h1, main h2, main h3, main figcaption, .stat-label, .kpi-etiket, .mini-ist .etiket, main td, main th, .zc-metin, .zc-baslik, .cz-olay strong, .bant-listesi strong, .bant-aralik, .accordion-header, .accordion-title';
        let bulunan = null;
        for (const el of document.querySelectorAll(secici)) {
            const t = sade((el.textContent || '').replace(/\s+/g, ' ').trim());
            if (adaylar.indexOf(t) >= 0) { bulunan = el; break; }
        }
        if (!bulunan) for (const el of document.querySelectorAll(secici)) {
            const t = sade((el.textContent || '').replace(/\s+/g, ' ').trim());
            if (t && adaylar.some(function (a) { return a && t.indexOf(a) === 0; })) { bulunan = el; break; }
        }
        history.replaceState(null, '', location.pathname + location.search);
        if (!bulunan) return;
        const kap = bulunan.closest('.stat-card, .kpi, .mini-ist, tr, .zaman-cizelgesi > li, .cz-olay, .bant-listesi > li, .card, .galeri-karti, .simge-karti, .servis-karti, .bolum-baslik, .bolum-ust, .accordion-item, .tab-pane > header') || bulunan;
        // Kapalı akordeon ve <details> açılır
        const ak = kap.closest('.accordion-item');
        if (ak && !ak.classList.contains('active')) { const h = ak.querySelector('.accordion-header'); if (h) h.click(); }
        const dt = kap.closest('details'); if (dt) dt.open = true;
        // Hareket sistemi: öğe ve üstleri hemen görünür olsun
        let u = kap; while (u && u !== document.body) { u.classList && u.classList.add('gorundu'); u = u.parentElement; }
        setTimeout(function () {
            kap.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
            kap.classList.remove('arama-vurgu'); void kap.offsetWidth; kap.classList.add('arama-vurgu');
            setTimeout(function () { kap.classList.remove('arama-vurgu'); }, 2600);
        }, ak ? 350 : 120);
    }
    if (document.readyState === 'complete') bulVeGoster();
    else window.addEventListener('load', function () { setTimeout(bulVeGoster, 60); });
})();
