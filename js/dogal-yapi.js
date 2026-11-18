// =============================================
// Doğal Yapı ve Afet Riskleri: grafik verileri
// İklim: MGM İl ve İlçe İstatistikleri, İzmir istasyonu (1938–2025), araştırma raporundaki tablonun aynısı.
// Rüzgâr: Windy.app, Güzelbahçe noktası (2012–2025), araştırma raporundaki grafiğin etiketli toplamları.
// PGA: TBDY-2018, DD-2 (475 yıl), araştırma raporu.
// "(hesap)" olanlar aylık değerlerden türetildi.
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    // MGM İzmir, 1938–2025
    const ORT = [8.9, 9.6, 11.7, 15.9, 20.8, 25.4, 28.0, 27.7, 23.8, 19.0, 14.4, 10.6];        // ortalama sıcaklık (yıllık 18,0)
    const ORT_YUK = [12.5, 13.7, 16.4, 21.0, 26.2, 30.8, 33.3, 33.0, 29.3, 24.1, 18.7, 14.2];  // ortalama en yüksek (22,8)
    const ORT_DUS = [5.8, 6.2, 7.7, 11.2, 15.5, 19.9, 22.6, 22.5, 18.8, 14.7, 10.8, 7.6];      // ortalama en düşük (13,6)
    const GUNES = [4.3, 5.3, 6.5, 8.0, 9.8, 11.6, 12.4, 12.0, 10.1, 7.6, 5.6, 4.2];            // güneşlenme süresi, saat (8,1)
    const YAGISLI = [12.56, 10.50, 9.20, 7.82, 5.31, 2.28, 0.45, 0.56, 1.94, 5.31, 8.75, 12.72]; // yağışlı gün (77,4)
    const YAGIS = [134.5, 100.9, 74.2, 45.9, 30.9, 12.8, 4.2, 6.4, 15.5, 44.0, 92.3, 145.8];    // aylık toplam yağış, mm (707,4)
    const EN_YUK = [22.5, 27.0, 31.1, 32.5, 37.6, 41.8, 43.2, 43.0, 40.1, 36.0, 30.3, 26.1];   // ölçülen en yüksek (43,2)
    const EN_DUS = [-8.2, -5.2, -3.8, 0.6, 4.3, 9.5, 15.4, 11.5, 10.0, 3.6, -2.9, -4.7];       // ölçülen en düşük (−8,2)

    // Kurak aylar (hesap): yağış < 2 × ortalama sıcaklık
    const KURAK = YAGIS.map((p, i) => p < 2 * ORT[i]);

    // Kurak ayları grafiğin arka planında gölgeler
    const kurakGolge = {
        id: 'kurakGolge',
        beforeDatasetsDraw(chart) {
            const x = chart.scales.x, a = chart.chartArea, c = chart.ctx;
            const w = x.getPixelForValue(1) - x.getPixelForValue(0);
            c.save();
            c.fillStyle = 'rgba(245, 158, 11, 0.12)';
            KURAK.forEach((k, i) => { if (k) c.fillRect(x.getPixelForValue(i) - w / 2, a.top, w, a.bottom - a.top); });
            const ilk = KURAK.indexOf(true), son = KURAK.lastIndexOf(true);
            if (ilk >= 0) {
                c.fillStyle = aktifTema() === 'acik' ? '#b45309' : '#f59e0b';
                c.font = '600 12px Outfit, sans-serif';
                c.textAlign = 'center';
                c.fillText(cevir('Kurak dönem'), (x.getPixelForValue(ilk) + x.getPixelForValue(son)) / 2, a.top + 14);
            }
            c.restore();
        }
    };

    // 1. İklim grafiği: yağış (çubuk) + sıcaklık (çizgi)
    const ctxIklim = getCtx('iklimChart');
    if (ctxIklim) new Chart(ctxIklim, {
        type: 'bar',
        data: {
            labels: AYLAR,
            datasets: [
                { type: 'line', label: 'Ortalama en yüksek sıcaklık', data: ORT_YUK, birim: 'derece', yAxisID: 'y', borderColor: '#f87171', backgroundColor: '#f87171', borderDash: [5, 4], pointRadius: 2.5, order: 0 },
                { type: 'line', label: 'Ortalama sıcaklık', data: ORT, birim: 'derece', yAxisID: 'y', borderColor: '#fb923c', backgroundColor: '#fb923c', pointRadius: 3.5, order: 0 },
                { type: 'line', label: 'Ortalama en düşük sıcaklık', data: ORT_DUS, birim: 'derece', yAxisID: 'y', borderColor: '#60a5fa', backgroundColor: '#60a5fa', borderDash: [5, 4], pointRadius: 2.5, order: 0 },
                { label: 'Aylık toplam yağış', data: YAGIS, birim: 'mm', yAxisID: 'y1', backgroundColor: 'rgba(56, 189, 248, 0.55)', borderColor: '#38bdf8', borderWidth: 1, barPercentage: 0.7, order: 1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { datalabels: { display: false } },
            scales: {
                x: kategoriEkseni,
                y: degerEkseni('Sıcaklık (°C)', { min: 0, max: 40, position: 'left', ticks: { callback: (v) => formatSayi(v) } }),
                y1: degerEkseni('Yağış (mm)', { min: 0, max: 160, position: 'right', grid: { display: false }, ticks: { callback: (v) => formatSayi(v) } })
            }
        },
        plugins: [kurakGolge]
    });

    // 2. Ölçülen en düşük ve en yüksek sıcaklık: aralık çubukları
    const ctxUc = getCtx('ucSicaklikChart');
    if (ctxUc) new Chart(ctxUc, {
        type: 'bar',
        data: {
            labels: AYLAR,
            datasets: [{ label: 'Ölçülen en düşük – en yüksek', data: AYLAR.map((a, i) => [EN_DUS[i], EN_YUK[i]]), birim: 'derece', backgroundColor: 'rgba(251, 146, 60, 0.6)', borderColor: '#fb923c', borderWidth: 1, borderSkipped: false, barPercentage: 0.6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.raw[0]) + ' °C … ' + formatSayi(c.raw[1]) + ' °C' } }
            },
            scales: { x: kategoriEkseni, y: degerEkseni('°C', { beginAtZero: false, min: -10, max: 45, ticks: { callback: (v) => formatSayi(v) } }) }
        }
    });

    // 3. Mevsimlere göre yağış (hesap): kış Ara–Şub, ilkbahar Mar–May, yaz Haz–Ağu, sonbahar Eyl–Kas
    const topla = (ayl) => Math.round(ayl.reduce((t, i) => t + YAGIS[i], 0) * 10) / 10;
    const mevsim = [topla([11, 0, 1]), topla([2, 3, 4]), topla([5, 6, 7]), topla([8, 9, 10])];
    const yillik = mevsim.reduce((a, b) => a + b, 0);
    const ctxMevsim = getCtx('mevsimChart');
    if (ctxMevsim) new Chart(ctxMevsim, {
        type: 'bar',
        data: {
            labels: ['Kış', 'İlkbahar', 'Yaz', 'Sonbahar'],
            datasets: [{ label: 'Yağış (hesap)', data: mevsim, birim: 'mm', backgroundColor: ['#38bdf8', '#34d399', '#f59e0b', '#a78bfa'], barPercentage: 0.6 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.parsed.x, 1) + ' mm (' + formatYuzde(c.parsed.x / yillik * 100, 0) + ')' } },
                datalabels: { formatter: (v) => formatSayi(v, 1) + ' mm · ' + formatYuzde(v / yillik * 100, 0) }
            },
            scales: { x: degerEkseni('mm', { grace: '40%' }), y: kategoriEkseni }
        }
    });

    // 4. Güneşlenme süresi (çubuk) ve yağışlı gün sayısı (çizgi)
    const ctxGunes = getCtx('gunesChart');
    if (ctxGunes) new Chart(ctxGunes, {
        type: 'bar',
        data: {
            labels: AYLAR,
            datasets: [
                { type: 'line', label: 'Yağışlı gün sayısı', data: YAGISLI, birim: 'gun', yAxisID: 'y1', borderColor: '#60a5fa', backgroundColor: '#60a5fa', order: 0 },
                { label: 'Günlük güneşlenme süresi', data: GUNES, birim: 'saat', yAxisID: 'y', backgroundColor: 'rgba(250, 204, 21, 0.7)', barPercentage: 0.7, order: 1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { datalabels: { display: false } },
            scales: {
                x: kategoriEkseni,
                y: degerEkseni('Saat', { min: 0, max: 14, position: 'left' }),
                y1: degerEkseni('Gün', { min: 0, max: 14, position: 'right', grid: { display: false } })
            }
        }
    });

    // 5. Rüzgâr: 8 knot ve üzeri esintinin zaman payı (%)
    const RUZGAR = [48, 49, 50, 46, 38, 46, 63, 57, 49, 39, 42, 43];
    const ctxRuzgar = getCtx('ruzgarChart');
    if (ctxRuzgar) new Chart(ctxRuzgar, {
        type: 'bar',
        data: {
            labels: AYLAR,
            datasets: [{ label: '8 knot ve üzeri', data: RUZGAR, birim: 'yuzde', backgroundColor: RUZGAR.map((v, i) => (i === 6 || i === 7) ? '#34d399' : 'rgba(52, 211, 153, 0.45)'), barPercentage: 0.7 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, formatter: (v) => formatSayi(v), font: { size: 11, weight: '600' } } },
            scales: { x: kategoriEkseni, y: yuzdeEkseni('Zaman payı', { min: 0, max: 80 }) }
        }
    });

    // 6. Tasarım yer ivmesi (PGA): zemine göre aralık
    const ctxPga = getCtx('pgaChart');
    if (ctxPga) new Chart(ctxPga, {
        type: 'bar',
        data: {
            labels: ['Sağlam kaya (Bornova Karmaşığı)', 'Suya doygun kıyı alüvyonu'],
            datasets: [{ label: 'PGA aralığı', data: [[0.35, 0.45], [0.50, 0.65]], birim: 'g', backgroundColor: ['rgba(251, 146, 60, 0.7)', 'rgba(248, 113, 113, 0.8)'], borderSkipped: false, barPercentage: 0.55 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.raw[0], 2) + '–' + formatSayi(c.raw[1], 2) + ' g' } },
                datalabels: { display: true, anchor: 'end', align: 'end', formatter: (v) => formatSayi(v[0], 2) + '–' + formatSayi(v[1], 2) + ' g' }
            },
            scales: { x: degerEkseni('g', { min: 0, max: 0.8, ticks: { callback: (v) => formatSayi(v, 1) } }), y: kategoriEkseni }
        }
    });
});

// Tarihsel depremler: x = tarih (yıl), y = şiddet (VIII–X), daire = büyüklük (verilmeyenler içi boş)
// Kaynak: İBB İzmir Deprem Senaryosu ve Deprem Master Planı (araştırma raporundaki tablo)
document.addEventListener('DOMContentLoaded', function () {
    const ctx = getCtx('depremChart');
    if (!ctx) return;
    const ROMA = { 8: 'VIII', 9: 'IX', 10: 'X' };
    // x: yılın içindeki konum (ay/gün) yalnızca yerleşim içindir
    const olaylar = [
        { x: 1778.51, y: 9, b: 6.4, tarih: '3–5 Temmuz 1778', yer: 'İzmir, Urla' },
        { x: 1850.78, y: 8, b: null, tarih: '13 Ekim 1850', yer: 'İzmir, Manisa, Kemalpaşa' },
        { x: 1862.84, y: 10, b: 6.9, tarih: '3 Kasım 1862', yer: 'Turgutlu' },
        { x: 1873.08, y: 9, b: null, tarih: '1 Şubat 1873', yer: 'Sisam Adası, İzmir, Aydın' },
        { x: 1880.57, y: 9, b: 6.7, tarih: '29 Temmuz 1880', yer: 'Menemen, Bornova, Karşıyaka' },
        { x: 1883.79, y: 9, b: 6.8, tarih: '15 Ekim 1883', yer: 'Çeşme Yarımadası' },
        { x: 1883.83, y: 8, b: null, tarih: '1 Kasım 1883', yer: 'İzmir Körfezi, Çeşme Yarımadası' }
    ];
    const yaricap = (b) => b === null ? 7 : (b - 5.5) * 11;
    const veri = (bilinen) => olaylar.filter(o => (o.b !== null) === bilinen).map(o => Object.assign({ r: yaricap(o.b) }, o));
    const grafik = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [
                { label: 'Büyüklüğü verilen', data: veri(true), backgroundColor: 'rgba(248, 113, 113, 0.55)', borderColor: '#f87171', borderWidth: 1.5 },
                { label: 'Büyüklüğü verilmeyen', data: veri(false), backgroundColor: 'rgba(251, 146, 60, 0.08)', borderColor: '#fb923c', borderWidth: 2 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { top: 18, right: 12 } },
            plugins: {
                erisilebilirGrafik: { tablo: false },
                legend: { position: 'bottom' },
                datalabels: {
                    display: true, anchor: 'end', offset: 4,
                    // 1880 ve Ekim 1883 birbirine çok yakın: etiketleri yanlara alınır
                    align: (c) => { const x = c.dataset.data[c.dataIndex].x; return x > 1880 && x < 1881 ? 'left' : (x > 1883.7 && x < 1883.8 ? 'right' : 'top'); },
                    color: (c) => temaRengi('etiket'), font: { size: 11, weight: '700' },
                    formatter: (v) => String(Math.floor(v.x))
                },
                tooltip: {
                    callbacks: {
                        title: (l) => cevir(l[0].raw.tarih),
                        label: (c) => [
                            cevir(c.raw.yer),
                            cevir('Şiddet') + ': ' + ROMA[c.raw.y],
                            cevir('Büyüklük') + ': ' + (c.raw.b === null ? cevir('verilmemiş') : formatSayi(c.raw.b, 1))
                        ]
                    }
                }
            },
            scales: {
                x: { type: 'linear', min: 1770, max: 1890, grid: { color: GRAFIK_TEMA.koyu.izgara }, border: { display: false },
                     ticks: { stepSize: 10, callback: (v) => String(v) },
                     title: { display: true, text: 'Yıl', color: GRAFIK_TEMA.koyu.metin } },
                y: { min: 7.4, max: 10.7, grid: { color: GRAFIK_TEMA.koyu.izgara }, border: { display: false },
                     ticks: { stepSize: 1, callback: (v) => ROMA[v] || '' },
                     title: { display: true, text: 'Şiddet', color: GRAFIK_TEMA.koyu.metin } }
            }
        }
    });
    ctx.canvas.setAttribute('role', 'img');
    ctx.canvas.setAttribute('aria-label', cevir('Tarihsel depremlerin şiddet ve büyüklük grafiği. Değerler aşağıdaki tablodadır.'));
});
