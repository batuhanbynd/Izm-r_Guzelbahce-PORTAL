// =============================================
// Mekânsal Yapı ve Makroform: grafikler ve yerleşim zaman kaydırıcısı
// Kaynak: araştırma grubunun "Spatial Structure (Macroform 2026)" raporundaki tablolar ve
// grafik değerleri (aynen). Arazi kategori payları 8.560,76 ha toplamından hesaplanır (hesap).
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const KENT = '#a78bfa', KIR = '#34d399';

    // 1. Yarımada stratejisinde arazi kategorileri (İZKA, 2014)
    const araziToplam = 8560.76;
    const araziler = [
        { ad: '5403 sayılı Kanun kapsamı', ha: 4494.71, renk: '#fbbf24' },
        { ad: 'Orman', ha: 3097.27, renk: '#34d399' },
        { ad: 'Yerleşim', ha: 842.64, renk: '#a78bfa' },
        { ad: 'Orman ve yerleşim', ha: 108.40, renk: '#2dd4bf' },
        { ad: 'Köy yerleşimi', ha: 17.74, renk: '#f472b6' }
    ];
    const pay = (ha) => Math.round(ha / araziToplam * 10000) / 100;
    const ctxArazi = getCtx('araziKategoriChart');
    if (ctxArazi) new Chart(ctxArazi, {
        type: 'doughnut',
        data: {
            labels: araziler.map((a) => a.ad),
            datasets: [{ data: araziler.map((a) => a.ha), birim: 'ha', backgroundColor: araziler.map((a) => a.renk), hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatSayi(c.parsed) + ' ha (' + formatYuzde(pay(c.parsed), 2) + ')' } },
                datalabels: { display: (c) => c.dataIndex < 3, color: '#0b1220', font: { weight: '800', size: 12 }, formatter: (v) => formatYuzde(pay(v), 1) }
            }
        }
    });

    // 2. Kentsel doku alanı ve leke sayısı, 1963–2005 (Coşkun Hepcan ve diğ., 2015)
    const ctxDoku = getCtx('kentselDokuChart');
    if (ctxDoku) new Chart(ctxDoku, {
        type: 'bar',
        data: {
            labels: ['1963', '1995', '2005'],
            datasets: [
                { type: 'bar', label: 'Kentsel doku alanı', data: [142.59, 610.58, 730.00], birim: 'ha', backgroundColor: '#fbbf24', borderRadius: 4, yAxisID: 'y', order: 2 },
                { type: 'line', label: 'Kentsel leke sayısı', data: [18, 195, 197], birim: 'adet', borderColor: '#f472b6', backgroundColor: '#f472b6', borderWidth: 2.5, pointRadius: 5, tension: 0.2, yAxisID: 'y1', order: 1,
                  datalabels: { align: 'top', color: '#f472b6' } }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { display: true, font: { weight: '700', size: 11 }, formatter: (v) => formatSayi(v) } },
            scales: {
                x: kategoriEkseni,
                y: degerEkseni('Alan (ha)', { suggestedMax: 900 }),
                y1: degerEkseni('Leke sayısı', { position: 'right', suggestedMax: 260, grid: { display: false } })
            }
        }
    });

    // 3. Tarım ve zeytinlik payları (%)
    const ctxPeyzaj = getCtx('peyzajPayChart');
    if (ctxPeyzaj) new Chart(ctxPeyzaj, {
        type: 'bar',
        data: {
            labels: ['1963', '1995', '2005'],
            datasets: [
                { label: 'Tarım arazisi', data: [9.46, 17.28, 15.76], birim: 'yuzde', backgroundColor: '#fbbf24', borderRadius: 4 },
                { label: 'Zeytinlik', data: [6.41, 12.77, 12.18], birim: 'yuzde', backgroundColor: '#84cc16', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatYuzde(v, 2) } },
            scales: { x: kategoriEkseni, y: yuzdeEkseni('İlçe alanındaki pay', { suggestedMax: 20 }) }
        }
    });

    // 4. Mahallelere göre nüfus, 2023 (SAGEP) — İZKA sınıfına göre renk
    const mahalleler = [
        ['Yelki', 6323, 'k'], ['Yalı', 6121, 'k'], ['Kahramandere', 5898, 'k'], ['Maltepe', 4149, 'k'],
        ['Mustafa Kemal Paşa', 3892, 'k'], ['Siteler', 2984, 'k'], ['Atatürk', 2894, 'k'], ['Çelebi', 2623, 'k'],
        ['Çamlı', 1972, 'r'], ['Yaka', 564, 'r'], ['Payamlı', 350, 'r'], ['Küçükkaya', 274, 'r']
    ];
    const ctxMah = getCtx('mahalleNufusChart');
    if (ctxMah) new Chart(ctxMah, {
        type: 'bar',
        data: {
            labels: mahalleler.map((m) => m[0]),
            datasets: [{ label: 'Nüfus, 2023', data: mahalleler.map((m) => m[1]), birim: 'kisi', backgroundColor: mahalleler.map((m) => (m[2] === 'k' ? KENT : KIR)), borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        generateLabels: (chart) => {
                            const renk = chart.options.plugins.legend.labels.color;
                            return [
                                { text: cevir('Seyrek kentsel'), fillStyle: KENT, strokeStyle: KENT, fontColor: renk, lineWidth: 0, hidden: false, datasetIndex: 0 },
                                { text: cevir('Yakın kırsal'), fillStyle: KIR, strokeStyle: KIR, fontColor: renk, lineWidth: 0, hidden: false, datasetIndex: 0 }
                            ];
                        }
                    },
                    onClick: () => {}
                },
                datalabels: { display: true, align: 'right', anchor: 'end', font: { weight: '600', size: 11 }, formatter: (v) => formatSayi(v) }
            },
            layout: { padding: { right: 42 } },
            scales: { x: degerEkseni('Nüfus (kişi)', { suggestedMax: 7000 }), y: kategoriEkseni }
        }
    });

    // 5. Plan notlarında en küçük parsel büyüklüğü (m²)
    const ctxParsel = getCtx('parselChart');
    if (ctxParsel) new Chart(ctxParsel, {
        type: 'bar',
        data: {
            labels: ['Ana yerleşim · mevcut', 'Kıyı yerleşimi · mevcut', 'Ana yerleşim · gelişme', 'Kıyı yerleşimi · gelişme', 'Yelki · gelişme', 'Kahramandere · konut'],
            datasets: [{ label: 'En küçük parsel', data: [150, 200, 300, 350, 500, 750], birim: 'm2', backgroundColor: ['#38bdf8', '#38bdf8', '#a78bfa', '#a78bfa', '#fbbf24', '#f472b6'], borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, align: 'right', anchor: 'end', formatter: (v) => formatSayi(v) + ' m²' } },
            layout: { padding: { right: 56 } },
            scales: { x: degerEkseni('m²', { max: 900, ticks: { stepSize: 150, callback: (v) => formatSayi(v) } }), y: kategoriEkseni }
        }
    });

    // 6. Kırsal plan alanlarında TAKS / KAKS
    const ctxTaks = getCtx('taksKaksChart');
    if (ctxTaks) new Chart(ctxTaks, {
        type: 'bar',
        data: {
            labels: ['Çamlı 101–104 adalar', ['Çamlı 185–186 ve', 'Küçükkaya 508 parseller']],
            datasets: [
                { label: 'TAKS', data: [0.15, 0.05], backgroundColor: '#2dd4bf', borderRadius: 4 },
                { label: 'KAKS', data: [0.30, 0.10], backgroundColor: '#a78bfa', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatSayi(v, 2) } },
            scales: { x: kategoriEkseni, y: degerEkseni('Oran', { suggestedMax: 0.36, ticks: { callback: (v) => formatSayi(v, 2) } }) }
        }
    });

    // 7. Okul türleri: resmî ve özel (İlçe MEM 2024–2028 Stratejik Planı)
    const ctxOkul = getCtx('okulTurChart');
    if (ctxOkul) new Chart(ctxOkul, {
        type: 'bar',
        data: {
            labels: ['Anaokulu', 'İlkokul', 'Ortaokul', 'Lise'],
            datasets: [
                { label: 'Resmî', data: [1, 6, 6, 5], birim: 'adet', backgroundColor: '#38bdf8', borderRadius: 4 },
                { label: 'Özel', data: [11, 14, 14, 15], birim: 'adet', backgroundColor: '#fb923c', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { x: kategoriEkseni, y: degerEkseni('Okul sayısı', { suggestedMax: 18, ticks: { stepSize: 3 } }) }
        }
    });

    // 8. Listelenen kurumlarda öğretmen sayısı
    const ogretmen = [536, 988], ogretmenPay = [35.2, 64.8];
    const ctxOgr = getCtx('ogretmenChart');
    if (ctxOgr) new Chart(ctxOgr, {
        type: 'doughnut',
        data: {
            labels: ['Resmî kurumlar (19)', 'Özel kurumlar (29)'],
            datasets: [{ data: ogretmen, birim: 'kisi', backgroundColor: ['#38bdf8', '#fb923c'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatSayi(c.parsed) + ' (' + formatYuzde(ogretmenPay[c.dataIndex], 1) + ')' } },
                datalabels: { display: true, color: '#0b1220', font: { weight: '800', size: 13 }, formatter: (v, c) => [formatSayi(v), formatYuzde(ogretmenPay[c.dataIndex], 1)] }
            }
        }
    });

    // 9. Kamu sağlık personeli (SAGEP)
    const ctxSaglik = getCtx('saglikPersonelChart');
    if (ctxSaglik) new Chart(ctxSaglik, {
        type: 'bar',
        data: {
            labels: ['İlçe Sağlık Müdürlüğü', 'Aile sağlığı merkezleri', '112 acil istasyonu', 'Sağlık evi'],
            datasets: [{ label: 'Personel', data: [28, 24, 12, 1], birim: 'kisi', backgroundColor: ['#f87171', '#fb923c', '#fbbf24', '#f472b6'], borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, align: 'right', anchor: 'end', formatter: (v) => formatSayi(v) } },
            layout: { padding: { right: 30 } },
            scales: { x: degerEkseni('Personel (kişi)', { suggestedMax: 32 }), y: kategoriEkseni }
        }
    });

    // ---- Yerleşim zaman kaydırıcısı (2002–2026) ----
    const kayd = document.getElementById('yerlesimKaydirici');
    if (kayd) {
        const resimler = Array.from(kayd.querySelectorAll('.zk-sahne img'));
        const yilEt = kayd.querySelector('.zk-yil');
        const aralik = kayd.querySelector('input[type="range"]');
        const yillar = Array.from(kayd.querySelectorAll('.zk-yillar span'));
        const oynat = kayd.querySelector('.zk-oynat');
        let zamanlayici = null, sira = 0;
        function goster(i) {
            sira = (i + resimler.length) % resimler.length;
            resimler.forEach((r, j) => r.classList.toggle('etkin', j === sira));
            yillar.forEach((y, j) => y.classList.toggle('etkin', j === sira));
            const yil = resimler[sira].dataset.yil;
            yilEt.textContent = yil;
            aralik.value = String(sira);
            aralik.setAttribute('aria-valuetext', yil);
            // Sonraki görüntüyü önceden yükle
            const sonraki = resimler[(sira + 1) % resimler.length];
            if (sonraki.loading === 'lazy') sonraki.loading = 'eager';
        }
        function durdur() {
            if (!zamanlayici) return;
            clearInterval(zamanlayici); zamanlayici = null;
            oynat.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
            oynat.setAttribute('aria-label', cevir('Oynat'));
        }
        function baslat() {
            resimler.forEach((r) => { r.loading = 'eager'; });
            if (sira === resimler.length - 1) goster(0);
            zamanlayici = setInterval(function () {
                if (sira === resimler.length - 1) { durdur(); return; }
                goster(sira + 1);
            }, 1600);
            oynat.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>';
            oynat.setAttribute('aria-label', cevir('Duraklat'));
        }
        aralik.addEventListener('input', function () { durdur(); goster(Number(aralik.value)); });
        oynat.addEventListener('click', function () { zamanlayici ? durdur() : baslat(); });
        const sahne = kayd.querySelector('.zk-sahne');
        function buyut() { if (window.openImageModal) window.openImageModal(resimler[sira].getAttribute('src')); }
        sahne.addEventListener('click', buyut);
        sahne.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buyut(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); durdur(); goster(sira + 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); durdur(); goster(sira - 1); }
        });
        goster(0);
    }
});
