// =============================================
// TR / EN dil seçimi (tüm sayfalarda)
// - Sayfalar Türkçe yazılır; İngilizce karşılıklar js/dil-en.js sözlüğündedir.
// - Seçim localStorage "bas-dil" anahtarında saklanır.
// - Metinler, öznitelikler (alt, title, aria-label), sayfa başlığı ve grafik etiketleri çevrilir.
// - Sayılar İngilizce yazıma çevrilir: 1.234,5 -> 1,234.5 · %7,5 -> 7.5%
// Bu dosya <head> içinde, Chart.js'ten SONRA ve sayfa betiklerinden ÖNCE yüklenir.
// =============================================
(function () {
    var ANAHTAR = 'bas-dil';
    var kok = document.documentElement;
    var dil = 'tr';
    try { if (localStorage.getItem(ANAHTAR) === 'en') dil = 'en'; } catch (e) { /* depolama kapalı */ }
    kok.setAttribute('lang', dil);
    if (dil === 'en') {
        // Türkçe metin bir an görünmesin; çeviri bitince (veya en geç 2,5 sn sonra) açılır
        kok.setAttribute('data-dil-bekle', '');
        setTimeout(function () { kok.removeAttribute('data-dil-bekle'); }, 2500);
    }

    var SOZLUK = window.BAS_SOZLUK_EN || {};
    var KALIPLAR = (window.BAS_KALIPLAR_EN || []).map(function (k) { return [new RegExp(k[0]), k[1], k[2]]; });
    var OZNITELIKLER = ['alt', 'title', 'aria-label', 'placeholder'];
    var HARF = /[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]/;
    // Sayıyla birlikte çevrilmeden kalabilecek birim ve kısaltmalar
    var SERBEST = { m: 1, km: 1, 'm³': 1, 'm²': 1, mm: 1, 'mm²': 1, kv: 1, mva: 1, kva: 1, kwh: 1, tl: 1, kg: 1, l: 1, v: 1, x: 1, cfu: 1, ml: 1, mw: 1, gwh: 1, 'p+r': 1, 'k+r': 1 };

    function bosluklariTopla(s) { return s.replace(/\s+/g, ' ').trim(); }

    // Türkçe sayı yazımını İngilizceye çevirir
    function trSayiEn(n) { return n.replace(/\./g, '\u0000').replace(/,/g, '.').replace(/\u0000/g, ','); }
    function sayilariCevir(s) {
        s = s.replace(/%\s?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)/g, function (_, n) { return trSayiEn(n) + '%'; });
        return s.replace(/(?<![\d.,])(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+)(?![.,]?\d)/g, function (n) { return trSayiEn(n); });
    }
    function yalnizcaSayiVeBirim(s) {
        var kelimeler = s.split(/[^A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû³²+]+/).filter(Boolean);
        return kelimeler.every(function (k) { return SERBEST[k.toLowerCase()]; });
    }

    // Tek bir metnin İngilizcesi (bulunamazsa null)
    function karsilik(metin) {
        var n = bosluklariTopla(metin);
        if (!n) return null;
        if (Object.prototype.hasOwnProperty.call(SOZLUK, n)) return SOZLUK[n];
        // Kalıplar: "8 Numaralı Hat Görseli" gibi tekrar eden yapılar
        for (var i = 0; i < KALIPLAR.length; i++) {
            var es = n.match(KALIPLAR[i][0]);
            if (!es) continue;
            var kalipli;
            if (KALIPLAR[i][2]) {
                // İç metin ($1) de sözlükten çevrilir: "Harita – büyüterek aç" -> "Map – open enlarged"
                var ic = karsilik(es[1]);
                kalipli = KALIPLAR[i][1].replace('$1', ic === null ? es[1] : ic);
            } else {
                kalipli = n.replace(KALIPLAR[i][0], KALIPLAR[i][1]);
            }
            return sayilariCevir(kalipli);
        }
        var donusmus = sayilariCevir(n);
        if (!HARF.test(n) || yalnizcaSayiVeBirim(donusmus)) return donusmus;
        if (window.BAS_DIL_DENETIM) (window.basEksikler = window.basEksikler || new Set()).add(n);
        return null;
    }

    // Dış kullanım: grafik biçimleyicileri vb. için
    window.basCevir = function (metin) {
        if (dil !== 'en' || typeof metin !== 'string') return metin;
        var k = karsilik(metin);
        if (k === null) return metin;
        var bas = metin.match(/^\s*/)[0], son = metin.match(/\s*$/)[0];
        return bas + k + son;
    };

    // ---- DOM metinleri ----
    var asilMetin = new WeakMap();   // metin düğümü -> Türkçe asıl
    var yazilan = new WeakMap();     // metin düğümü -> en son bizim yazdığımız
    var asilOznitelik = new WeakMap();

    function cevrilmezMi(el) {
        return !el || el.closest('script, style, noscript, .dil-yok, [translate="no"]');
    }

    function metinDugumu(dugum) {
        var ust = dugum.parentElement;
        if (cevrilmezMi(ust)) return;
        var simdiki = dugum.nodeValue;
        // İlk kez görülüyor ya da sayfa betiği metni değiştirmiş: yeni asıl budur
        if (!asilMetin.has(dugum) || yazilan.get(dugum) !== simdiki) asilMetin.set(dugum, simdiki);
        var asil = asilMetin.get(dugum);
        var hedef = dil === 'en' ? window.basCevir(asil) : asil;
        if (simdiki !== hedef) dugum.nodeValue = hedef;
        yazilan.set(dugum, hedef);
    }

    function oznitelikler(el) {
        if (cevrilmezMi(el)) return;
        var kayit = asilOznitelik.get(el);
        OZNITELIKLER.forEach(function (ad) {
            if (!el.hasAttribute(ad)) return;
            var deger = el.getAttribute(ad);
            if (!kayit) { kayit = {}; asilOznitelik.set(el, kayit); }
            if (!(ad in kayit) || (kayit['_' + ad] !== deger)) kayit[ad] = deger;
            var hedef = dil === 'en' ? window.basCevir(kayit[ad]) : kayit[ad];
            if (deger !== hedef) el.setAttribute(ad, hedef);
            kayit['_' + ad] = hedef;
        });
    }

    function agaciCevir(kokDugum) {
        if (!kokDugum) return;
        if (kokDugum.nodeType === 3) { metinDugumu(kokDugum); return; }
        if (kokDugum.nodeType !== 1) return;
        oznitelikler(kokDugum);
        var yuruyucu = document.createTreeWalker(kokDugum, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        var d;
        while ((d = yuruyucu.nextNode())) {
            if (d.nodeType === 3) metinDugumu(d); else oznitelikler(d);
        }
    }

    var asilBaslik = null;
    function basligiCevir() {
        if (asilBaslik === null) asilBaslik = document.title;
        if (dil !== 'en') { document.title = asilBaslik; return; }
        var parcalar = asilBaslik.split(' | ');
        parcalar[0] = window.basCevir(parcalar[0]);
        document.title = parcalar.join(' | ');
    }

    // ---- Grafikler (Chart.js) ----
    function derinCevir(deger) {
        if (Array.isArray(deger)) return deger.map(derinCevir);
        return typeof deger === 'string' ? window.basCevir(deger) : deger;
    }
    function derinKopya(deger) { return Array.isArray(deger) ? deger.map(derinKopya) : deger; }

    function grafigiCevir(chart) {
        var kayit = chart.$dilKaydi;
        if (!kayit) {
            kayit = chart.$dilKaydi = [];
            var veri = chart.config.data || {};
            if (veri.labels) kayit.push([veri, 'labels', derinKopya(veri.labels)]);
            (veri.datasets || []).forEach(function (ds) { if (typeof ds.label === 'string') kayit.push([ds, 'label', ds.label]); });
            var sec = chart.config.options || {};
            Object.keys(sec.scales || {}).forEach(function (k) {
                var t = sec.scales[k] && sec.scales[k].title;
                if (t && t.text) kayit.push([t, 'text', derinKopya(t.text)]);
            });
            var bt = sec.plugins && sec.plugins.title;
            if (bt && bt.text) kayit.push([bt, 'text', derinKopya(bt.text)]);
        }
        kayit.forEach(function (k) { k[0][k[1]] = dil === 'en' ? derinCevir(k[2]) : derinKopya(k[2]); });
    }

    if (window.Chart && typeof Chart.register === 'function') {
        Chart.register({ id: 'basDil', beforeInit: function (chart) { grafigiCevir(chart); } });
    }

    // ---- Dil seçici ----
    var secici = null;
    function seciciyiYaz() {
        if (!secici) return;
        secici.querySelectorAll('button').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-dil') === dil));
        });
    }

    function seciciyiKur() {
        secici = document.createElement('div');
        secici.className = 'dil-secici dil-yok';
        secici.setAttribute('role', 'group');
        secici.setAttribute('aria-label', 'Dil / Language');
        secici.innerHTML = '<span class="dil-ikon" aria-hidden="true"><i class="fa-solid fa-globe"></i></span>' +
            '<button type="button" data-dil="tr" lang="tr" title="Türkçe">TR</button>' +
            '<button type="button" data-dil="en" lang="en" title="English">EN</button>';
        secici.addEventListener('click', function (e) {
            var b = e.target.closest('button[data-dil]');
            if (b) dilDegistir(b.getAttribute('data-dil'));
        });
        document.body.appendChild(secici);
        seciciyiYaz();
    }

    function hepsiniUygula() {
        agaciCevir(document.body);
        basligiCevir();
        if (window.Chart && Chart.instances) {
            Object.values(Chart.instances).forEach(function (c) { grafigiCevir(c); c.update(); });
        }
    }

    function dilDegistir(yeni) {
        if (yeni === dil) return;
        dil = yeni;
        kok.setAttribute('lang', dil);
        try { localStorage.setItem(ANAHTAR, dil); } catch (e) { /* depolama kapalı */ }
        hepsiniUygula();
        seciciyiYaz();
        window.dispatchEvent(new CustomEvent('dildegisti', { detail: dil }));
    }
    window.basDilDegistir = dilDegistir;
    window.basDil = function () { return dil; };

    // Sonradan eklenen / değişen içerik (menü düğmesi, görüntüleyici, grafik tabloları...)
    var gozlemci = new MutationObserver(function (kayitlar) {
        if (dil !== 'en') return;
        kayitlar.forEach(function (k) {
            if (k.type === 'childList') k.addedNodes.forEach(agaciCevir);
            else if (k.type === 'characterData') metinDugumu(k.target);
            else if (k.type === 'attributes') oznitelikler(k.target);
        });
    });

    document.addEventListener('DOMContentLoaded', function () {
        seciciyiKur();
        if (dil === 'en') { agaciCevir(document.body); basligiCevir(); }
        gozlemci.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: OZNITELIKLER });
        kok.removeAttribute('data-dil-bekle');
    });
})();
