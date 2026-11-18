// =============================================
// Arayüz yardımcıları (tüm sayfalarda)
// 1) "İçeriğe atla" bağlantısı
// 2) Küçük ekranlarda yan menüyü açıp kapatan "Menü" düğmesi
// 3) Açık / koyu tema düğmesi
// 4) Tıklanabilir kutuların (harita, akordeon) klavyeyle de açılabilmesi
// 5) Ortak görsel görüntüleyici (yakınlaştırma, kaydırma, klavye ile kullanım)
// =============================================

(function () {
    const anaIcerik = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');

    // ---- 1. İçeriğe atla ----
    if (anaIcerik) {
        anaIcerik.id = anaIcerik.id || 'icerik';
        if (!anaIcerik.hasAttribute('tabindex')) anaIcerik.setAttribute('tabindex', '-1');
    }

    // ---- 2. Mobil menü ----
    if (sidebar) {
        sidebar.id = sidebar.id || 'yan-menu';
        sidebar.setAttribute('aria-label', 'Ana menü');

        const dugme = document.createElement('button');
        dugme.type = 'button';
        dugme.className = 'menu-toggle';
        dugme.setAttribute('aria-controls', sidebar.id);
        dugme.setAttribute('aria-expanded', 'false');
        dugme.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i><span>Menü</span>';
        document.body.prepend(dugme);

        const perde = document.createElement('div');
        perde.className = 'nav-backdrop';
        document.body.appendChild(perde);

        function menuyuAyarla(acik) {
            document.body.classList.toggle('nav-open', acik);
            dugme.setAttribute('aria-expanded', String(acik));
            dugme.querySelector('span').textContent = acik ? 'Kapat' : 'Menü';
            dugme.querySelector('i').className = acik ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        }

        dugme.addEventListener('click', function () {
            menuyuAyarla(!document.body.classList.contains('nav-open'));
        });
        perde.addEventListener('click', function () { menuyuAyarla(false); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
                menuyuAyarla(false);
                dugme.focus();
            }
        });

        // ---- 3. Tema düğmesi ----
        const temaDugmesi = document.createElement('button');
        temaDugmesi.type = 'button';
        temaDugmesi.className = 'tema-dugmesi';

        function temaDugmesiniYaz() {
            const acik = document.documentElement.getAttribute('data-tema') === 'acik';
            temaDugmesi.setAttribute('aria-pressed', String(acik));
            temaDugmesi.innerHTML = acik
                ? '<i class="fa-solid fa-moon" aria-hidden="true"></i><span>Koyu temaya geç</span>'
                : '<i class="fa-solid fa-sun" aria-hidden="true"></i><span>Açık temaya geç</span>';
        }

        temaDugmesi.addEventListener('click', function () {
            const yeni = document.documentElement.getAttribute('data-tema') === 'acik' ? 'koyu' : 'acik';
            if (yeni === 'acik') document.documentElement.setAttribute('data-tema', 'acik');
            else document.documentElement.removeAttribute('data-tema');
            try { localStorage.setItem('bas-tema', yeni); } catch (e) { /* depolama kapalı */ }
            temaDugmesiniYaz();
            window.dispatchEvent(new CustomEvent('temadegisti', { detail: yeni }));
        });

        temaDugmesiniYaz();
        sidebar.appendChild(temaDugmesi);
    }

    if (anaIcerik) {
        const atla = document.createElement('a');
        atla.className = 'icerige-atla';
        atla.href = '#' + anaIcerik.id;
        atla.textContent = 'İçeriğe atla';
        atla.addEventListener('click', function (e) {
            e.preventDefault();
            anaIcerik.focus();
            anaIcerik.scrollIntoView();
        });
        document.body.prepend(atla);
    }

    // ---- 4. Klavye erişimi ----
    // onclick ile çalışan div/span öğeleri Tab ile seçilebilir, Enter/Boşluk ile açılabilir olur
    document.querySelectorAll('[onclick]').forEach(function (el) {
        const etiket = el.tagName;
        if (etiket === 'BUTTON' || etiket === 'A' || etiket === 'INPUT') return;
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (el.classList.contains('accordion-header')) el.setAttribute('aria-expanded', 'false');
        if (el.classList.contains('interactive-image-container') && !el.hasAttribute('aria-label')) {
            const gorsel = el.querySelector('img');
            el.setAttribute('aria-label', ((gorsel && gorsel.alt) || 'Görsel') + ' – büyüterek aç');
            el.setAttribute('aria-haspopup', 'dialog');
        }
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });

    // ---- 5. Görsel görüntüleyici ----
    let sonTetik = null;
    document.addEventListener('click', function (e) {
        const t = e.target.closest && e.target.closest('[onclick]');
        if (t) sonTetik = t;
    }, true);

    let gorucu = null, sahne, resim, oranYazi, baslik;
    let olcek = 1, x = 0, y = 0, donukOgeler = [];
    const ENAZ = 1, ENCOK = 8;
    const isaretciler = new Map();
    let surukle = null, kistirma = null, hareketVar = false, ilkHedef = null;

    function uygula() {
        resim.style.transform = 'translate(-50%, -50%) translate(' + x + 'px, ' + y + 'px) scale(' + olcek + ')';
        oranYazi.textContent = '%' + Math.round(olcek * 100);
    }

    // Belirtilen noktayı (sahne merkezine göre) sabit tutarak ölçeği değiştirir
    function olcekle(yeni, px, py) {
        yeni = Math.min(ENCOK, Math.max(ENAZ, yeni));
        px = px || 0; py = py || 0;
        x = px - (px - x) * (yeni / olcek);
        y = py - (py - y) * (yeni / olcek);
        olcek = yeni;
        if (olcek === 1) { x = 0; y = 0; }
        uygula();
    }

    function merkezeGore(e) {
        const r = sahne.getBoundingClientRect();
        return [e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)];
    }

    function gorucuyuKur() {
        gorucu = document.createElement('div');
        gorucu.className = 'gorsel-gorucu';
        gorucu.hidden = true;
        gorucu.setAttribute('role', 'dialog');
        gorucu.setAttribute('aria-modal', 'true');
        gorucu.setAttribute('aria-labelledby', 'gg-baslik');
        gorucu.innerHTML =
            '<div class="gg-ust">' +
                '<h2 class="gg-baslik" id="gg-baslik">Görsel</h2>' +
                '<div class="gg-araclar">' +
                    '<button type="button" data-islem="kucult" aria-label="Uzaklaştır"><i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true"></i></button>' +
                    '<span class="gg-oran" aria-hidden="true">%100</span>' +
                    '<button type="button" data-islem="buyut" aria-label="Yakınlaştır"><i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i></button>' +
                    '<button type="button" data-islem="sifirla" aria-label="Ekrana sığdır"><i class="fa-solid fa-compress" aria-hidden="true"></i></button>' +
                    '<button type="button" class="gg-kapat" data-islem="kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i>&nbsp;Kapat</button>' +
                '</div>' +
            '</div>' +
            '<div class="gg-sahne"><img alt="" draggable="false"></div>' +
            '<p class="gg-ipucu">Fare tekerleği veya + / − tuşlarıyla yakınlaştırın; sürükleyerek ya da ok tuşlarıyla kaydırın; Esc ile kapatın.</p>';
        document.body.appendChild(gorucu);

        sahne = gorucu.querySelector('.gg-sahne');
        resim = sahne.querySelector('img');
        oranYazi = gorucu.querySelector('.gg-oran');
        baslik = gorucu.querySelector('.gg-baslik');

        gorucu.querySelector('.gg-araclar').addEventListener('click', function (e) {
            const b = e.target.closest('button');
            if (!b) return;
            const islem = b.getAttribute('data-islem');
            if (islem === 'buyut') olcekle(olcek * 1.4);
            else if (islem === 'kucult') olcekle(olcek / 1.4);
            else if (islem === 'sifirla') olcekle(1);
            else if (islem === 'kapat') kapat();
        });

        sahne.addEventListener('wheel', function (e) {
            e.preventDefault();
            const [px, py] = merkezeGore(e);
            olcekle(olcek * (e.deltaY < 0 ? 1.2 : 1 / 1.2), px, py);
        }, { passive: false });

        sahne.addEventListener('dblclick', function (e) {
            const [px, py] = merkezeGore(e);
            olcekle(olcek > 1 ? 1 : 2.5, px, py);
        });

        sahne.addEventListener('pointerdown', function (e) {
            sahne.setPointerCapture(e.pointerId);
            isaretciler.set(e.pointerId, [e.clientX, e.clientY]);
            hareketVar = false;
            ilkHedef = e.target;
            if (isaretciler.size === 1) {
                surukle = { sx: e.clientX - x, sy: e.clientY - y };
                sahne.classList.add('suruklen');
            } else if (isaretciler.size === 2) {
                const [a, b] = Array.from(isaretciler.values());
                kistirma = { mesafe: Math.hypot(a[0] - b[0], a[1] - b[1]), olcek: olcek };
                surukle = null;
            }
        });

        sahne.addEventListener('pointermove', function (e) {
            if (!isaretciler.has(e.pointerId)) return;
            isaretciler.set(e.pointerId, [e.clientX, e.clientY]);
            if (kistirma && isaretciler.size === 2) {
                const [a, b] = Array.from(isaretciler.values());
                const r = sahne.getBoundingClientRect();
                const ox = (a[0] + b[0]) / 2 - (r.left + r.width / 2);
                const oy = (a[1] + b[1]) / 2 - (r.top + r.height / 2);
                olcekle(kistirma.olcek * Math.hypot(a[0] - b[0], a[1] - b[1]) / kistirma.mesafe, ox, oy);
                hareketVar = true;
            } else if (surukle) {
                const nx = e.clientX - surukle.sx, ny = e.clientY - surukle.sy;
                if (Math.abs(nx - x) + Math.abs(ny - y) > 2) hareketVar = true;
                x = nx; y = ny;
                uygula();
            }
        });

        function birak(e) {
            isaretciler.delete(e.pointerId);
            if (isaretciler.size < 2) kistirma = null;
            if (isaretciler.size === 0) {
                surukle = null;
                sahne.classList.remove('suruklen');
                // Görselin dışındaki boş alana tıklamak pencereyi kapatır
                if (!hareketVar && e.type === 'pointerup' && ilkHedef === sahne) kapat();
            }
        }
        sahne.addEventListener('pointerup', birak);
        sahne.addEventListener('pointercancel', birak);

        gorucu.addEventListener('keydown', function (e) {
            const adim = 60;
            switch (e.key) {
                case 'Escape': e.preventDefault(); kapat(); return;
                case '+': case '=': e.preventDefault(); olcekle(olcek * 1.4); return;
                case '-': case '_': e.preventDefault(); olcekle(olcek / 1.4); return;
                case '0': e.preventDefault(); olcekle(1); return;
                case 'ArrowLeft': x += adim; break;
                case 'ArrowRight': x -= adim; break;
                case 'ArrowUp': y += adim; break;
                case 'ArrowDown': y -= adim; break;
                case 'Tab': {
                    // Odak pencerenin içinde kalır
                    const dugmeler = Array.from(gorucu.querySelectorAll('button'));
                    const ilk = dugmeler[0], son = dugmeler[dugmeler.length - 1];
                    if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
                    else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
                    return;
                }
                default: return;
            }
            e.preventDefault();
            uygula();
        });
    }

    function ac(kaynak) {
        if (!gorucu) gorucuyuKur();
        const tetik = sonTetik;
        const tetikResim = tetik && tetik.querySelector('img');
        const figur = tetik && tetik.closest('figure');
        const altyazi = figur && figur.querySelector('figcaption');
        const ad = (tetikResim && tetikResim.alt) || (altyazi && altyazi.textContent.trim()) || 'Görsel';

        baslik.textContent = ad;
        resim.alt = ad;
        resim.src = kaynak;
        olcek = 1; x = 0; y = 0;
        uygula();

        donukOgeler = Array.from(document.body.children).filter(function (el) {
            return el !== gorucu && !el.hasAttribute('inert');
        });
        donukOgeler.forEach(function (el) { el.setAttribute('inert', ''); });

        gorucu._donus = tetik || document.activeElement;
        gorucu.hidden = false;
        document.body.classList.add('gorucu-acik');
        gorucu.querySelector('.gg-kapat').focus();
    }

    function kapat() {
        if (!gorucu || gorucu.hidden) return;
        gorucu.hidden = true;
        document.body.classList.remove('gorucu-acik');
        donukOgeler.forEach(function (el) { el.removeAttribute('inert'); });
        donukOgeler = [];
        resim.removeAttribute('src');
        if (gorucu._donus && gorucu._donus.focus) gorucu._donus.focus();
    }

    // Sayfalardaki onclick="openImageModal('...')" çağrıları bu pencereyi açar
    window.openImageModal = ac;
    window.openLightbox = ac;
    window.closeImageModal = kapat;
    window.closeLightbox = kapat;
})();

// =============================================
// 6) Hareket: kaydırınca belirme, sayaçlar, görünür olunca çizilen grafikler
//    Her öğe bir kez ve kendini tamamlayarak oynar; sayılar sonunda kaynaktaki metnin aynısına döner.
// =============================================
(function () {
    const kok = document.documentElement;
    window.basHareketHazir = true;
    if (!kok.classList.contains('hareket')) return;
    if (!('IntersectionObserver' in window)) { kok.classList.remove('hareket'); return; }

    const SECICI = '.tab-pane > header, .stats-row > *, .sayfa-ici-menu, .bolum-baslik, .bolum-ust, .card, .info-card, .galeri-karti, .tablo-kutu, ' +
        '.kpi, .servis-karti, .simge-karti, .zaman-cizelgesi > li, .bant-listesi > li, .akis-adim, .mini-istatistik > .mini-ist, ' +
        '.vitrin-3b, .giris-ust > *, .kaynak-notu, .sira-yatay > li, .ro-satir > *, .cz-olay, .cz-yil, .harita-figur, .collab-card';
    const EK = '.cift-zaman';
    const SAYAC = '.stat-value, .kpi-deger, .mini-ist .deger, .ss-deger, .sb-deger, .vk-sayi';
    const acilis = performance.now();

    const hedefler = Array.from(document.querySelectorAll(SECICI));
    hedefler.forEach(function (el) {
        const kardesler = el.parentElement ? Array.from(el.parentElement.children).filter(function (c) { return c.matches(SECICI); }) : [el];
        const sira = Math.max(0, kardesler.indexOf(el));
        el.style.setProperty('--gecikme', (Math.min(sira, 8) * 70) + 'ms');
    });

    // Metindeki tek sayıyı bulur (TR: 1.234,5 · EN: 1,234.5). İki sayı varsa (aralık, oran) sayılmaz.
    function sayiCoz(metin) {
        const en = kok.lang === 'en';
        const desen = en ? /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g : /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
        const bulunan = metin.match(desen);
        if (!bulunan || bulunan.length !== 1) return null;
        const parca = bulunan[0], yer = metin.indexOf(parca);
        const bin = en ? ',' : '.', ond = en ? '.' : ',';
        const ondalik = parca.indexOf(ond) >= 0 ? parca.split(ond)[1].length : 0;
        const deger = parseFloat(parca.split(bin).join('').replace(ond, '.'));
        if (!isFinite(deger) || deger === 0) return null;
        return { on: metin.slice(0, yer), son: metin.slice(yer + parca.length), deger: deger, ondalik: ondalik, grup: parca.indexOf(bin) >= 0, en: en };
    }

    function say(el) {
        if (el.dataset.sayildi || el.children.length) return;
        el.dataset.sayildi = '1';
        const metin = el.textContent.trim();
        const p = sayiCoz(metin);
        if (!p) return;
        const bicim = new Intl.NumberFormat(p.en ? 'en-US' : 'tr-TR', { minimumFractionDigits: p.ondalik, maximumFractionDigits: p.ondalik, useGrouping: p.grup });
        el.style.setProperty('--sayac-renk', getComputedStyle(el).color);
        el.setAttribute('data-sayac', p.on + bicim.format(0) + p.son);
        el.classList.add('sayiyor');
        const sure = 1400, t0 = performance.now();
        (function adim(t) {
            const o = Math.min(1, Math.max(0, (t - t0) / sure)), e = 1 - Math.pow(1 - o, 4);
            el.setAttribute('data-sayac', p.on + bicim.format(p.deger * e) + p.son);
            if (o < 1 && el.textContent.trim() === metin) requestAnimationFrame(adim);
            else { el.classList.remove('sayiyor'); el.removeAttribute('data-sayac'); }
        })(t0);
    }

    const bekleyen = new Set(hedefler);
    function goster(el) {
        bekleyen.delete(el);
        el.classList.add('gorundu');
        const gecikme = parseFloat(el.style.getPropertyValue('--gecikme')) || 0;
        setTimeout(function () { el.style.removeProperty('--gecikme'); }, gecikme + 800);
        // Sayaçlar: yalnızca bu öğeye ait olanlar (iç içe hedeflerde her biri kendi zamanında)
        const sayaclar = (el.matches(SAYAC) ? [el] : []).concat(Array.from(el.querySelectorAll(SAYAC)))
            .filter(function (s) { return s.closest(SECICI) === el; });
        if (sayaclar.length) setTimeout(function () { sayaclar.forEach(say); }, gecikme + 150);
        // Grafikler: sayfa açılışında görünmeyenler, görünür olunca baştan çizilir
        if (window.Chart && Chart.getChart && performance.now() - acilis > 900) {
            el.querySelectorAll('canvas').forEach(function (cv) {
                const g = Chart.getChart(cv);
                if (!g || g.$oynatildi) return;
                g.$oynatildi = true;
                setTimeout(function () { g.reset(); g.update(); }, gecikme + 120);
            });
        }
    }

    const gozcu = new IntersectionObserver(function (girisler) {
        girisler.forEach(function (g) {
            if (!g.isIntersecting) return;
            gozcu.unobserve(g.target);
            goster(g.target);
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    hedefler.forEach(function (el) { gozcu.observe(el); });
    document.querySelectorAll(EK).forEach(function (el) { gozcu.observe(el); });

    // Yedek: hızlı kaydırma ya da bölüm bağlantısıyla (#) atlanıp ekranın üstünde kalan öğeler hemen gösterilir
    let bekle = null;
    function atlananlariGoster() {
        bekle = null;
        bekleyen.forEach(function (el) {
            if (el.getBoundingClientRect().bottom < 0) { gozcu.unobserve(el); goster(el); }
        });
    }
    window.addEventListener('scroll', function () { if (!bekle) bekle = setTimeout(atlananlariGoster, 180); }, { passive: true });
    window.addEventListener('load', atlananlariGoster);
    window.addEventListener('hashchange', function () { setTimeout(atlananlariGoster, 60); });
})();
