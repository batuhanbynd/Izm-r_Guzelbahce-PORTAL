// =============================================
// Havza ve Koruma Alanları: grafik verileri
// Kaynak: araştırma grubunun "Conservation Areas and Watershed Protection Areas" ve
// "Physical Structure, Natural and Environmental Resources" raporlarındaki tablolar (değerler aynen).
// "(hesap)" olanlar kaynaktaki sayılardan türetildi.
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const IYI = '#34d399', ORTA = '#facc15', ZAYIF = '#fb923c', KOTU = '#f87171', KURU = '#a1a1aa', YOK = 'rgba(148, 163, 184, 0.35)';

    // 1. Havza alanının illere dağılımı (km²)
    const iller = [
        { ad: 'İzmir', alan: 6640.898, pay: 95.3 },
        { ad: 'Aydın', alan: 267.49, pay: 3.8 },
        { ad: 'Manisa', alan: 58.298, pay: 0.8 }
    ];
    const ctxIl = getCtx('havzaIlChart');
    if (ctxIl) new Chart(ctxIl, {
        type: 'doughnut',
        data: {
            labels: iller.map(i => i.ad),
            datasets: [{ data: iller.map(i => i.alan), birim: 'km2', backgroundColor: ['#38bdf8', '#a78bfa', '#fbbf24'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatSayi(c.parsed) + ' km² (' + formatYuzde(iller[c.dataIndex].pay, 1) + ')' } },
                datalabels: { display: (c) => c.dataIndex === 0, color: '#0b1220', font: { weight: '800', size: 13 }, formatter: (v, c) => formatYuzde(iller[c.dataIndex].pay, 1) }
            }
        }
    });

    // 2. Yüzey su kütlelerinin durumu (55 kütle; SYGM, 2018)
    const ctxYuzey = getCtx('yuzeySuChart');
    if (ctxYuzey) new Chart(ctxYuzey, {
        type: 'bar',
        data: {
            labels: ['Kimyasal durum', 'Ekolojik durum', 'Nihai durum'],
            datasets: [
                { label: 'İyi / geçti', data: [6, 4, null], birim: 'kutle', backgroundColor: IYI },
                { label: 'Orta', data: [null, 14, 18], birim: 'kutle', backgroundColor: ORTA },
                { label: 'Zayıf', data: [null, 5, 5], birim: 'kutle', backgroundColor: ZAYIF },
                { label: 'Kötü / kaldı', data: [38, 21, 21], birim: 'kutle', backgroundColor: KOTU },
                { label: 'Kuru', data: [9, 9, 9], birim: 'kutle', backgroundColor: KURU },
                { label: 'İzleme yok', data: [2, 2, 2], birim: 'kutle', backgroundColor: YOK }
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                datalabels: { display: (c) => (c.dataset.data[c.dataIndex] || 0) >= 4, color: '#0b1220', anchor: 'center', align: 'center', font: { weight: '700', size: 11 }, formatter: (v) => formatSayi(v) }
            },
            scales: {
                x: degerEkseni('Su kütlesi sayısı', { stacked: true, max: 55, ticks: { stepSize: 5 } }),
                y: Object.assign({}, kategoriEkseni, { stacked: true })
            }
        }
    });

    // 3. Yeraltı suyu kütlelerinde risk (42 kütle)
    const ctxYeralti = getCtx('yeraltiChart');
    if (ctxYeralti) new Chart(ctxYeralti, {
        type: 'bar',
        data: {
            labels: ['Risk yok', 'Potansiyel risk', 'Riskte'],
            datasets: [
                { label: 'Miktar bakımından', data: [24, 3, 15], birim: 'kutle', backgroundColor: '#38bdf8' },
                { label: 'Kalite bakımından', data: [3, 6, 33], birim: 'kutle', backgroundColor: '#f87171' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { y: degerEkseni('Su kütlesi sayısı', { grace: '12%' }), x: kategoriEkseni }
        }
    });

    // 4. Birinci sınıf tarım arazisi, 1957 ve 2005 (ha)
    const ctxBirinci = getCtx('birinciSinifChart');
    if (ctxBirinci) new Chart(ctxBirinci, {
        type: 'bar',
        data: {
            labels: ['1957', '2005'],
            datasets: [{ label: '1. sınıf tarım arazisi', data: [1753.1, 989.6], birim: 'ha', backgroundColor: ['#f59e0b', '#f87171'], barPercentage: 0.5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v, 1) + ' ha' } },
            scales: { y: degerEkseni('ha', { grace: '15%' }), x: kategoriEkseni }
        }
    });

    // 5. Diğer arazi kullanımlarının alanı, 1957–2005 (ha); "-" olan yıllar boş bırakıldı
    const ctxDegisim = getCtx('kullanimDegisimChart');
    if (ctxDegisim) new Chart(ctxDegisim, {
        type: 'line',
        data: {
            labels: ['1957', '1976', '1995', '2005'],
            datasets: [
                { label: 'Yerleşim', data: [104.7, 535.2, 1304.6, 1694.5], birim: 'ha', borderColor: '#f87171', backgroundColor: '#f87171' },
                { label: 'Otoyol', data: [null, null, 118.0, 145.8], birim: 'ha', borderColor: '#fb923c', backgroundColor: '#fb923c' },
                { label: 'Rekreasyon alanı', data: [7.7, 8.0, 43.9, 74.8], birim: 'ha', borderColor: '#a78bfa', backgroundColor: '#a78bfa' },
                { label: 'Bataklık', data: [53.3, 60.7, 8.6, 6.4], birim: 'ha', borderColor: '#34d399', backgroundColor: '#34d399' },
                { label: 'Baraj', data: [null, 17.9, 25.0, 25.0], birim: 'ha', borderColor: '#38bdf8', backgroundColor: '#38bdf8' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' } },
            scales: { y: degerEkseni('ha'), x: kategoriEkseni }
        }
    });

    // 6. 1957–2005 arazi dönüşümü: yerleşim, otoyol ve barajın yerini aldığı arazi (ha), akış grafiği
    //    Kaynak tablo: "Losses in land use types ... from 1957 to 2005" (rekreasyon ve bataklık için dönüşüm yok)
    const kapAkis = document.getElementById('donusumAkisi');
    if (kapAkis && typeof akisGrafigi === 'function') akisGrafigi(kapAkis, {
        sol: [
            { ad: 'Kuru tarım', renk: '#f59e0b', grup: 'tarim' },
            { ad: 'Bahçe tarımı', renk: '#facc15', grup: 'tarim' },
            { ad: 'Sulu tarım', renk: '#38bdf8', grup: 'tarim' },
            { ad: 'Zeytinlik', renk: '#a3e635', grup: 'tarim' },
            { ad: 'Fundalık', renk: '#86efac', grup: 'dogal' },
            { ad: 'Orman', renk: '#22c55e', grup: 'dogal' }
        ],
        sag: [
            { ad: 'Yerleşim', renk: '#f87171' },
            { ad: 'Otoyol', renk: '#fb923c' },
            { ad: 'Baraj', renk: '#60a5fa' }
        ],
        gruplar: { tarim: 'Tarım alanları', dogal: 'Doğal alanlar' },
        akislar: [
            ['Kuru tarım', 'Yerleşim', 739.0], ['Kuru tarım', 'Otoyol', 49.0],
            ['Bahçe tarımı', 'Yerleşim', 198.3], ['Bahçe tarımı', 'Otoyol', 53.5],
            ['Sulu tarım', 'Yerleşim', 11.6],
            ['Zeytinlik', 'Yerleşim', 7.7],
            ['Fundalık', 'Yerleşim', 606.2], ['Fundalık', 'Otoyol', 32.3], ['Fundalık', 'Baraj', 20.1],
            ['Orman', 'Yerleşim', 9.4], ['Orman', 'Baraj', 4.9]
        ],
        birim: 'ha', ondalik: 1,
        solBaslik: 'Önceki kullanım', sagBaslik: 'Yeni kullanım'
    });

    // 7. Arazi kullanımında doğal nitelikli alanlar (ha, ilçe genel arazi kullanımındaki pay)
    const dogal = [
        { ad: 'Tarımsal niteliği korunacak alan', ha: 2383.1, pay: 34.8, renk: '#fbbf24' },
        { ad: 'Orman alanı', ha: 2117.5, pay: 30.9, renk: '#15803d' },
        { ad: 'Ağaçlık niteliği korunacak alan', ha: 500.3, pay: 7.3, renk: '#22c55e' },
        { ad: 'Mera', ha: 192.4, pay: 2.8, renk: '#a3e635' },
        { ad: 'Ağaçlandırılacak alan', ha: 162, pay: 2.4, renk: '#86efac' },
        { ad: 'Fundalık, çalılık ve makilik', ha: 149.5, pay: 2.2, renk: '#a1a1aa' }
    ];
    const ctxDogal = getCtx('dogalAlanChart');
    if (ctxDogal) new Chart(ctxDogal, {
        type: 'bar',
        data: {
            labels: dogal.map(d => d.ad),
            datasets: [{ label: 'Alan', data: dogal.map(d => d.ha), birim: 'ha', backgroundColor: dogal.map(d => d.renk), barPercentage: 0.65 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.parsed.x) + ' ha (' + formatYuzde(dogal[c.dataIndex].pay, 1) + ')' } },
                datalabels: { formatter: (v, c) => formatYuzde(dogal[c.dataIndex].pay, 1) }
            },
            scales: { x: degerEkseni('ha', { grace: '12%' }), y: kategoriEkseni }
        }
    });

    // 8. Tescilli kültür varlıkları: türlere göre (14 kayıt, hesap)
    const ctxKultur = getCtx('kulturChart');
    if (ctxKultur) new Chart(ctxKultur, {
        type: 'bar',
        data: {
            labels: ['Arkeolojik sit', 'Cami', 'Sivil mimarlık örneği', 'Anıt', 'Tümülüs', 'Dini yapı (kilise kalıntısı)', 'Mezarlık'],
            datasets: [{ label: 'Kayıt sayısı (hesap)', data: [3, 3, 3, 2, 1, 1, 1], birim: 'adet', backgroundColor: '#a78bfa', barPercentage: 0.65 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { x: degerEkseni('', { grace: '15%', ticks: { stepSize: 1 } }), y: kategoriEkseni }
        }
    });

    // 9. Havzadaki omurgalı türler (balıklar hariç): tür ve familya sayısı
    const omurgali = [
        { ad: 'Kuşlar', tur: 155, familya: 45 },
        { ad: 'Memeliler', tur: 28, familya: 17 },
        { ad: 'Sürüngenler', tur: 24, familya: 14 },
        { ad: 'Amfibiler', tur: 6, familya: 5 }
    ];
    const ctxOmurgali = getCtx('omurgaliChart');
    if (ctxOmurgali) new Chart(ctxOmurgali, {
        type: 'bar',
        data: {
            labels: omurgali.map(o => o.ad),
            datasets: [
                { label: 'Tür', data: omurgali.map(o => o.tur), birim: 'adet', backgroundColor: '#f472b6' },
                { label: 'Familya', data: omurgali.map(o => o.familya), birim: 'adet', backgroundColor: 'rgba(244, 114, 182, 0.4)' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { y: degerEkseni('', { grace: '12%' }), x: kategoriEkseni }
        }
    });

    // 10. Bitki türlerinin fitocoğrafik dağılımı (264 tür)
    const ctxFlora = getCtx('floraChart');
    if (ctxFlora) new Chart(ctxFlora, {
        type: 'doughnut',
        data: {
            labels: ['Geniş yayılışlı', 'Akdeniz elementi', 'Avrupa-Sibirya elementi', 'İran-Turan elementi', 'Öksin elementi'],
            datasets: [{ data: [170, 78, 10, 5, 1], birim: 'adet', backgroundColor: ['#a1a1aa', '#34d399', '#60a5fa', '#fbbf24', '#f472b6'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'right' },
                tooltip: tooltipPayConfig,
                datalabels: { display: (c) => c.dataset.data[c.dataIndex] >= 50, color: '#0b1220', font: { weight: '800', size: 12 }, formatter: (v) => formatSayi(v) }
            }
        }
    });
});

// Parsel hesaplayıcı: doğal sit alanındaki tarım parselinde izin verilen en büyük yapı
// Kurallar (araştırma raporu, plan notları): taban alanı parselin en fazla %5'i, toplam inşaat alanı en fazla 250 m²,
// yola ve parsel sınırına en az 5,00 m, saçak yüksekliği en fazla 6,80 m. Çizim ölçekli; kesit ayrı ölçekte.
document.addEventListener('DOMContentLoaded', function () {
    const girdi = document.getElementById('parselAlan');
    const svg = document.getElementById('parselCizim');
    if (!girdi || !svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const PAY = 0.05, UST = 250, CEKME = 5, SACAK = 6.8;
    const el = (ad, oz, metin) => { const e = document.createElementNS(NS, ad); Object.keys(oz).forEach(k => e.setAttribute(k, oz[k])); if (metin) e.textContent = metin; svg.appendChild(e); return e; };

    // Sabit öğeler
    const PX = 24, PY = 34, KENAR = 210;               // plan çizimi
    el('text', { x: PX, y: 18, class: 'pa-yazi koyu' }, cevir('Plan (ölçekli)'));
    const parsel = el('rect', { x: PX, y: PY, width: KENAR, height: KENAR, class: 'pa-parsel', rx: 2 });
    const cekme = el('rect', { x: PX, y: PY, width: KENAR, height: KENAR, class: 'pa-cekme' });
    const bina = el('rect', { x: PX, y: PY, width: 0, height: 0, class: 'pa-bina', rx: 1.5 });
    const cekmeYazi = el('text', { x: PX + 6, y: PY + 14, class: 'pa-yazi' }, cevir('5 m çekme'));
    const kenarYazi = el('text', { x: PX + KENAR / 2, y: PY + KENAR + 18, 'text-anchor': 'middle', class: 'pa-yazi' }, '');

    const KX = 278, ZEMIN = 230, OLCEK = 9;           // kesit: 1 m = 9 px
    el('text', { x: KX, y: 18, class: 'pa-yazi koyu' }, cevir('Kesit'));
    el('line', { x1: KX - 6, y1: ZEMIN, x2: 432, y2: ZEMIN, class: 'pa-zemin' });
    const kesitBina = el('rect', { x: KX + 10, y: ZEMIN - SACAK * OLCEK, width: 0, height: SACAK * OLCEK, class: 'pa-bina' });
    const cati = el('path', { d: '', fill: 'none', stroke: '#b45309', 'stroke-width': 1, 'stroke-dasharray': '3 3' });
    const olcu = el('path', { d: `M${KX + 2} ${ZEMIN} V${ZEMIN - SACAK * OLCEK} M${KX - 2} ${ZEMIN} H${KX + 6} M${KX - 2} ${ZEMIN - SACAK * OLCEK} H${KX + 6}`, class: 'pa-olcu' });
    const yukYazi = el('text', { x: KX - 2, y: ZEMIN - SACAK * OLCEK - 8, class: 'pa-yazi' }, '');
    const genYazi = el('text', { x: KX + 10, y: ZEMIN + 18, class: 'pa-yazi' }, '');

    function m2(v) { return formatSayi(v) + ' m²'; }
    function guncelle() {
        const A = Number(girdi.value);
        const taban = Math.min(A * PAY, UST);
        const kenarM = Math.sqrt(A), olcek = KENAR / kenarM;
        const ic = CEKME * olcek;
        cekme.setAttribute('x', PX + ic); cekme.setAttribute('y', PY + ic);
        cekme.setAttribute('width', KENAR - 2 * ic); cekme.setAttribute('height', KENAR - 2 * ic);
        const b = Math.sqrt(taban) * olcek;
        bina.setAttribute('x', PX + (KENAR - b) / 2); bina.setAttribute('y', PY + (KENAR - b) / 2);
        bina.setAttribute('width', b); bina.setAttribute('height', b);
        cekmeYazi.setAttribute('x', PX + ic + 5); cekmeYazi.setAttribute('y', PY + ic + 14);
        kenarYazi.textContent = cevir('Parsel kenarı') + ' ≈ ' + formatSayi(kenarM, 0) + ' m';
        // Kesit: bina genişliği = taban alanının kenarı (kare kabul), saçak 6,80 m
        const g = Math.sqrt(taban) * OLCEK;
        kesitBina.setAttribute('width', g);
        cati.setAttribute('d', `M${KX + 10} ${ZEMIN - SACAK * OLCEK} L${KX + 10 + g / 2} ${ZEMIN - SACAK * OLCEK - 22} L${KX + 10 + g} ${ZEMIN - SACAK * OLCEK}`);
        yukYazi.textContent = cevir('saçak') + ' ' + formatSayi(SACAK, 2) + ' m';
        genYazi.textContent = '≈ ' + formatSayi(Math.sqrt(taban), 1) + ' m';
        document.getElementById('parselAlanYazi').textContent = formatSayi(A);
        document.getElementById('paTaban').textContent = m2(Math.round(taban));
        document.getElementById('paToplam').textContent = m2(UST);
        document.getElementById('paDurum').textContent = A * PAY < UST
            ? cevir('Taban alanını %5 sınırı belirliyor.')
            : cevir('Parselin %5\'i 250 m²\'yi aştığı için toplam inşaat alanı sınırı belirleyici.');
        girdi.setAttribute('aria-valuetext', formatSayi(A) + ' m²');
    }
    girdi.addEventListener('input', guncelle);
    window.addEventListener('dildegisti', guncelle);
    guncelle();
});
