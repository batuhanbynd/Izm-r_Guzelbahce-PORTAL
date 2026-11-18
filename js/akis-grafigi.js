// =============================================
// Akış grafiği (Sankey): iki sütunlu, kütüphanesiz SVG
// Şerit kalınlığı değerle orantılıdır. Düğüme ya da şeride gelince ilgili akışlar vurgulanır.
// Görünür olunca şeritler soldan sağa akar (hareket azaltma tercihinde animasyonsuz).
// Dil (dildegisti) ve genişlik değişince yeniden çizilir. Metinler cevir() ve formatSayi() ile.
//
// akisGrafigi(kap, {
//   sol: [{ ad, renk, grup }], sag: [{ ad, renk }], gruplar: { anahtar: 'Grup adı' },
//   akislar: [[solAd, sagAd, deger]], birim: 'ha', ondalik: 1,
//   solBaslik: 'Önceki kullanım', sagBaslik: 'Yeni kullanım'
// })
// =============================================
function akisGrafigi(kap, ayar) {
    const NS = 'http://www.w3.org/2000/svg';
    const toplam = ayar.akislar.reduce((t, a) => t + a[2], 0);
    const ondalik = ayar.ondalik === undefined ? 1 : ayar.ondalik;
    const AZ_HAREKET = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animasyonBitti = AZ_HAREKET, sonGenislik = 0, kimlik = 'ak' + Math.random().toString(36).slice(2, 7);

    const ipucu = document.createElement('div');
    ipucu.className = 'akis-ipucu';
    ipucu.setAttribute('aria-hidden', 'true');
    kap.appendChild(ipucu);

    const deger = (v) => formatSayi(v, ondalik) + ' ' + ayar.birim;
    const pay = (v) => formatYuzde(v / toplam * 100, 1);

    function el(ad, oz, ebeveyn) {
        const e = document.createElementNS(NS, ad);
        Object.keys(oz || {}).forEach(k => e.setAttribute(k, oz[k]));
        if (ebeveyn) ebeveyn.appendChild(e);
        return e;
    }

    function ciz() {
        const W = Math.round(kap.clientWidth);
        if (!W) return;
        sonGenislik = W;
        const dar = W < 620;
        const H = dar ? 480 : 470;
        const solEtiket = dar ? 100 : 190, sagEtiket = dar ? 92 : 170, nodeW = dar ? 10 : 12;
        const ust = 46, alt = 12, ic = dar ? 16 : 14, grupAra = 48;
        const x0 = solEtiket, x1 = W - sagEtiket - nodeW;

        // Düğüm toplamları
        const solT = {}, sagT = {};
        ayar.akislar.forEach(([a, b, v]) => { solT[a] = (solT[a] || 0) + v; sagT[b] = (sagT[b] || 0) + v; });

        // Sol sütun: gruplar arasında daha geniş boşluk
        const gruplar = [];
        ayar.sol.forEach(d => { const g = gruplar.find(x => x.ad === d.grup); g ? g.dugum.push(d) : gruplar.push({ ad: d.grup, dugum: [d] }); });
        const solBosluk = ayar.sol.length - gruplar.length;
        const kullanilir = H - ust - alt;
        const k = (kullanilir - solBosluk * ic - (gruplar.length - 1) * grupAra) / toplam;

        const sol = {}, sag = {};
        let y = ust;
        gruplar.forEach((g, gi) => {
            if (gi > 0) y += grupAra;
            g.ust = y;
            g.dugum.forEach((d, di) => {
                if (di > 0) y += ic;
                const h = solT[d.ad] * k;
                sol[d.ad] = { d, y, h, cikis: y };
                y += h;
            });
            g.alt = y;
        });
        // Sağ sütun: dikeyde ortalanır
        const sagBoslukH = (ayar.sag.length - 1) * 22;
        const sagYuk = toplam * k + sagBoslukH;
        let ys = ust + Math.max(0, (y - ust - sagYuk) / 2);
        ayar.sag.forEach((d, i) => {
            if (i > 0) ys += 22;
            const h = sagT[d.ad] * k;
            sag[d.ad] = { d, y: ys, h, giris: ys };
            ys += h;
        });

        // Akışların sırası: kaynakta hedef sırasına, hedefte kaynak sırasına göre (kesişme az)
        const sagSira = ayar.sag.map(d => d.ad), solSira = ayar.sol.map(d => d.ad);
        const akislar = ayar.akislar.map(([a, b, v]) => ({ a, b, v, t: v * k }));
        akislar.slice().sort((p, q) => solSira.indexOf(p.a) - solSira.indexOf(q.a) || sagSira.indexOf(p.b) - sagSira.indexOf(q.b))
            .forEach(f => { f.sy = sol[f.a].cikis; sol[f.a].cikis += f.t; });
        akislar.slice().sort((p, q) => sagSira.indexOf(p.b) - sagSira.indexOf(q.b) || solSira.indexOf(p.a) - solSira.indexOf(q.a))
            .forEach(f => { f.ty = sag[f.b].giris; sag[f.b].giris += f.t; });

        // SVG
        kap.querySelectorAll('svg').forEach(s => s.remove());
        const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true', class: 'akis-svg' });
        kap.insertBefore(svg, ipucu);
        const defs = el('defs', {}, svg);
        const kirp = el('clipPath', { id: kimlik + '-kirp' }, defs);
        const kirpRect = el('rect', { x: 0, y: 0, width: animasyonBitti ? W : x0 + nodeW, height: H }, kirp);

        // Sütun başlıkları
        el('text', { x: x0 + nodeW, y: 16, 'text-anchor': 'end', class: 'akis-sutun' }, svg).textContent = cevir(ayar.solBaslik);
        el('text', { x: x1, y: 16, 'text-anchor': 'start', class: 'akis-sutun' }, svg).textContent = cevir(ayar.sagBaslik);

        // Şeritler
        const seritler = el('g', { 'clip-path': `url(#${kimlik}-kirp)` }, svg);
        const mx = (x0 + nodeW + x1) / 2;
        akislar.forEach((f, i) => {
            const gid = `${kimlik}-g${i}`;
            const lg = el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: x0 + nodeW, x2: x1, y1: 0, y2: 0 }, defs);
            el('stop', { offset: '0%', 'stop-color': sol[f.a].d.renk }, lg);
            el('stop', { offset: '100%', 'stop-color': sag[f.b].d.renk }, lg);
            const t = Math.max(f.t, 0.8);
            const a0 = f.sy, a1 = f.sy + t, b0 = f.ty, b1 = f.ty + t, xa = x0 + nodeW, xb = x1;
            const p = el('path', {
                d: `M${xa},${a0} C${mx},${a0} ${mx},${b0} ${xb},${b0} L${xb},${b1} C${mx},${b1} ${mx},${a1} ${xa},${a1} Z`,
                fill: `url(#${gid})`, class: 'akis-serit'
            }, seritler);
            p.dataset.a = f.a; p.dataset.b = f.b;
            p.addEventListener('pointerenter', (e) => vurgula(e, [f], `<strong>${cevir(f.a)} → ${cevir(f.b)}</strong>${deger(f.v)} · ${pay(f.v)}`));
            p.addEventListener('pointermove', konumla);
            p.addEventListener('pointerleave', birak);
        });

        // Düğümler ve etiketler
        function dugumCiz(n, taraf) {
            const x = taraf === 'sol' ? x0 : x1;
            const r = el('rect', { x, y: n.y, width: nodeW, height: Math.max(n.h, 3), rx: 2, fill: n.d.renk, class: 'akis-dugum' }, svg);
            const ilgili = akislar.filter(f => (taraf === 'sol' ? f.a : f.b) === n.d.ad);
            const v = ilgili.reduce((t, f) => t + f.v, 0);
            const metin = `<strong>${cevir(n.d.ad)}</strong>${deger(v)} · ${pay(v)}`;
            [r].forEach(h => {
                h.addEventListener('pointerenter', (e) => vurgula(e, ilgili, metin));
                h.addEventListener('pointermove', konumla);
                h.addEventListener('pointerleave', birak);
            });
            return { n, taraf, v, hedefY: n.y + Math.max(n.h, 3) / 2, x };
        }
        const etiketler = [];
        Object.values(sol).forEach(n => etiketler.push(dugumCiz(n, 'sol')));
        Object.values(sag).forEach(n => etiketler.push(dugumCiz(n, 'sag')));

        // Etiket çakışmasını önle: sol sütunda her grubun kendi başlığı ile bir sonraki grubun başlığı arasında,
        // sağ sütunda grafik sınırları içinde; önce aşağı, taşarsa yukarı itilir
        const aralik = dar ? 28 : 19;
        function yerlestir(liste, ustSinir, altSinir) {
            liste.sort((p, q) => p.hedefY - q.hedefY);
            liste.forEach((e, i) => { e.y = Math.max(e.hedefY, ustSinir, i ? liste[i - 1].y + aralik : -Infinity); });
            for (let i = liste.length - 1; i >= 0; i--) {
                const sinir = i === liste.length - 1 ? altSinir : liste[i + 1].y - aralik;
                if (liste[i].y > sinir) liste[i].y = sinir;
            }
        }
        gruplar.forEach((g, gi) => {
            const sonraki = gruplar[gi + 1];
            yerlestir(etiketler.filter(e => e.taraf === 'sol' && e.n.d.grup === g.ad),
                g.ust + (dar ? 4 : 2), sonraki ? sonraki.ust - 12 - (dar ? 22 : 14) : H - (dar ? 16 : 6));
        });
        yerlestir(etiketler.filter(e => e.taraf === 'sag'), ust + 4, H - (dar ? 16 : 6));
        etiketler.forEach(e => {
            const sol = e.taraf === 'sol';
            const tx = sol ? x0 - 10 : x1 + nodeW + 10;
            if (Math.abs(e.y - e.hedefY) > 2) {
                el('path', { d: `M${sol ? x0 - 3 : x1 + nodeW + 3},${e.hedefY} L${sol ? x0 - 7 : x1 + nodeW + 7},${e.y}`, class: 'akis-kilavuz' }, svg);
            }
            const t = el('text', { x: tx, y: dar ? e.y - 3 : e.y + 4, 'text-anchor': sol ? 'end' : 'start', class: 'akis-etiket' }, svg);
            t.textContent = cevir(e.n.d.ad);
            if (dar) {
                const t2 = el('text', { x: tx, y: e.y + 11, 'text-anchor': sol ? 'end' : 'start', class: 'akis-deger' }, svg);
                t2.textContent = deger(e.v);
            } else {
                const ts = el('tspan', { class: 'akis-deger', dx: 8 }, t);
                ts.textContent = deger(e.v);
            }
        });

        // Grup başlıkları (sol sütun, her grubun üstünde)
        if (gruplar.length > 1) gruplar.forEach(g => {
            const ad = ayar.gruplar && ayar.gruplar[g.ad] ? ayar.gruplar[g.ad] : g.ad;
            el('text', { x: x0 - 10, y: g.ust - 12, 'text-anchor': 'end', class: 'akis-grup' }, svg).textContent = cevir(ad);
        });

        // Animasyon: kırpma dikdörtgeni soldan sağa açılır
        if (!animasyonBitti) {
            const baslat = () => {
                const t0 = performance.now(), sure = 1300, bas = x0 + nodeW;
                (function adim(t) {
                    const o = Math.min(1, (t - t0) / sure), e = 1 - Math.pow(1 - o, 3);
                    kirpRect.setAttribute('width', bas + (W - bas) * e);
                    if (o < 1) requestAnimationFrame(adim); else animasyonBitti = true;
                })(t0);
            };
            if ('IntersectionObserver' in window) {
                const io = new IntersectionObserver((g) => { if (g.some(x => x.isIntersecting)) { io.disconnect(); baslat(); } }, { threshold: 0.35 });
                io.observe(kap);
            } else baslat();
        }
    }

    function vurgula(e, ilgili, html) {
        kap.classList.add('vurgu');
        kap.querySelectorAll('.akis-serit').forEach(p => {
            p.classList.toggle('etkin', ilgili.some(f => f.a === p.dataset.a && f.b === p.dataset.b));
        });
        ipucu.innerHTML = html;
        ipucu.classList.add('gorunur');
        konumla(e);
    }
    function konumla(e) {
        const r = kap.getBoundingClientRect();
        let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
        const w = ipucu.offsetWidth, h = ipucu.offsetHeight;
        if (x + w > r.width) x = e.clientX - r.left - w - 14;
        if (y + h > r.height) y = e.clientY - r.top - h - 14;
        ipucu.style.transform = `translate(${Math.max(0, x)}px, ${Math.max(0, y)}px)`;
    }
    function birak() {
        kap.classList.remove('vurgu');
        kap.querySelectorAll('.akis-serit.etkin').forEach(p => p.classList.remove('etkin'));
        ipucu.classList.remove('gorunur');
    }

    ciz();
    let zaman;
    window.addEventListener('resize', () => {
        clearTimeout(zaman);
        zaman = setTimeout(() => { if (Math.round(kap.clientWidth) !== sonGenislik) ciz(); }, 150);
    });
    window.addEventListener('dildegisti', () => ciz());
}
