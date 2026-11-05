document.addEventListener('DOMContentLoaded', function() {

    // 0. Barajların aktif doluluk oranı: 2026 (07.10.2026) ve bir önceki yıl (Word Tablo 23, İZSU)
    // Bir önceki yıl Gördes için "veri yok" -> null
    const barajlar = ['Tahtalı Barajı', 'Balçova Barajı', 'Ürkmez Barajı', 'Gördes Barajı', 'Alaçatı Kutlu Aktaş Barajı'];
    const ctxSu1 = getCtx('su1Chart');
    if (ctxSu1) window.su1ChartInstance = new Chart(ctxSu1, {
        type: 'bar',
        data: {
            labels: barajlar,
            datasets: [{
                label: '2026 (07.10.2026)',
                data: [43.38, 47.45, 60.49, 29.73, 49.44],
                birim: 'yuzde',
                backgroundColor: MOD_RENK.su,
                barPercentage: 0.75
            }, {
                label: 'Bir önceki yıl',
                data: [3.20, 3.70, 2.70, null, 0.03],
                birim: 'yuzde',
                backgroundColor: NOTR_RENK.onceki,
                barPercentage: 0.75
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { datalabels: { display: 'auto', formatter: (v) => v === null ? '' : formatYuzdeSabit(v, 2) } },
            scales: {
                y: yuzdeEkseni('Aktif doluluk', { max: 100 }),
                x: { ...kategoriEkseni, ticks: { color: '#e2e8f0' } }
            }
        }
    });


    // 1. Balçova Barajı Hacim Analizi (Doughnut)
    // Veriler (Milyon m3)
    const maxHacim = 7.759;
    const toplamSu = 3.811;
    const kullanilabilir = 3.674;
    const kullanilamayan = (toplamSu - kullanilabilir).toFixed(3);
    const bosHacim = (maxHacim - toplamSu).toFixed(3);

    const ctxBalcova = getCtx('balcovaChart');
    if (ctxBalcova) new Chart(ctxBalcova, {
        type: 'doughnut',
        data: {
            labels: ['Kullanılabilir su', 'Kullanılamayan (dip suyu)', 'Boş hacim'],
            datasets: [{
                data: [kullanilabilir, kullanilamayan, bosHacim],
                birim: 'm3',
                backgroundColor: [MOD_RENK.su, '#1e40af', 'rgba(148, 163, 184, 0.2)'],
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatBirimli(Number(context.raw), 'm3');
                        }
                    }
                },
                // Maksimum hacme göre pay; çok küçük dilimler yazılmaz
                datalabels: {
                    display: function(ctx) { return Number(ctx.dataset.data[ctx.dataIndex]) >= 1; },
                    color: '#f8fafc',
                    anchor: 'center',
                    align: 'center',
                    font: { weight: '600', size: 13 },
                    formatter: (value) => formatYuzde((Number(value) / maxHacim) * 100)
                }
            }
        }
    });

    // 2. Su kaynaklarının türlerine göre sayısı
    // Kaynak ADEDİ gösterildiği için (üretim hacmi değil) basit çubuk kullanılır
    const ctxKaynak = getCtx('kaynakChart');
    if (ctxKaynak) new Chart(ctxKaynak, {
        type: 'bar',
        data: {
            labels: ['Yüzeysel (Barajlar)', 'Yeraltı (Kuyular)'],
            datasets: [{
                label: 'Kaynak sayısı',
                data: [3, 5], // 3 baraj, 5 kuyu grubu
                birim: 'adet',
                backgroundColor: [MOD_RENK.su, '#14b8a6'],
                barPercentage: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { formatter: (value) => value + ' ' + cevir('kaynak') }
            },
            scales: {
                y: degerEkseni('Kaynak sayısı', { ticks: { stepSize: 1, precision: 0 }, grace: '15%' }),
                x: kategoriEkseni
            }
        }
    });
});

// 3. Su altyapısı metrajı (Word belgesindeki tablo): içme suyu 173, atıksu 134, yağmursuyu 13
document.addEventListener('DOMContentLoaded', function() {
    const turler = ['İçme suyu', 'Atıksu', 'Yağmursuyu'];
    const metraj = [173, 134, 13];
    const renkler = ['#0ea5e9', '#0f766e', '#7dd3fc'];
    const toplam = metraj.reduce((a, b) => a + b, 0);

    const ctxMetraj = getCtx('metrajChart');
    if (ctxMetraj) new Chart(ctxMetraj, {
        type: 'bar',
        data: { labels: turler, datasets: [{ label: 'Metraj', data: metraj, backgroundColor: renkler, borderRadius: 10, barPercentage: 0.6 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (value) => formatSayi(value) } },
            scales: { y: degerEkseni('Metraj', { grace: '15%' }), x: kategoriEkseni }
        }
    });

    const ctxPay = getCtx('metrajPayChart');
    if (ctxPay) new Chart(ctxPay, {
        type: 'doughnut',
        data: { labels: turler, datasets: [{ data: metraj, backgroundColor: renkler, hoverOffset: 6 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '58%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatSayi(c.raw) + ' (' + formatYuzde(c.raw / toplam * 100, 1) + ')' } },
                datalabels: { display: (ctx) => ctx.dataset.data[ctx.dataIndex] / toplam >= 0.08, color: '#f8fafc', anchor: 'center', align: 'center', font: { weight: '600', size: 13 }, formatter: (value) => formatYuzde(value / toplam * 100, 1) }
            }
        }
    });
});

// 4. Word raporundan eklenen içme suyu grafikleri
document.addEventListener('DOMContentLoaded', function() {
    const BARAJ_RENK = MOD_RENK.su, KUYU_RENK = '#14b8a6', GOLET_RENK = '#a78bfa';

    // 4a. Bağlı olunan sistemin günlük üretimi (İZSU, 03.11.2026), m³/gün
    const kaynaklar = [
        ['Tahtalı Barajı', 205700, 'baraj'], ['Gördes Barajı', 187854, 'baraj'], ['Göksu Kuyuları', 107300, 'kuyu'],
        ['Halkapınar Kuyuları', 70567, 'kuyu'], ['Balçova Barajı', 33650, 'baraj'], ['Menemen-Çavuşköy Kuyuları', 30900, 'kuyu'],
        ['Buca ve Sarnıç Kuyuları', 2838, 'kuyu'], ['Karaçam Göleti', 606, 'golet']
    ];
    const toplamUretim = 639415;
    const turRenk = { baraj: BARAJ_RENK, kuyu: KUYU_RENK, golet: GOLET_RENK };
    const ctxUretim = getCtx('uretimChart');
    if (ctxUretim) new Chart(ctxUretim, {
        type: 'bar',
        data: {
            labels: kaynaklar.map(k => k[0]),
            datasets: [{ label: 'Üretim', data: kaynaklar.map(k => k[1]), birim: 'm3gun', backgroundColor: kaynaklar.map(k => turRenk[k[2]]), barPercentage: 0.7 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: true, formatter: (v) => formatSayi(v) + ' · ' + formatYuzde(v / toplamUretim * 100, 1) }
            },
            scales: { x: degerEkseni('m³/gün', { grace: '30%' }), y: kategoriEkseni }
        }
    });

    // 4b. Kaynak türlerinin payı (hesap: türlere göre toplam)
    const turToplam = { baraj: 0, kuyu: 0, golet: 0 };
    kaynaklar.forEach(k => { turToplam[k[2]] += k[1]; });
    const ctxTur = getCtx('uretimTurChart');
    if (ctxTur) new Chart(ctxTur, {
        type: 'doughnut',
        data: {
            labels: ['Barajlar', 'Kuyular', 'Gölet'],
            datasets: [{ data: [turToplam.baraj, turToplam.kuyu, turToplam.golet], birim: 'm3gun', backgroundColor: [BARAJ_RENK, KUYU_RENK, GOLET_RENK], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipPayConfig,
                datalabels: { display: (c) => c.dataset.data[c.dataIndex] / toplamUretim >= 0.05, color: '#f8fafc', anchor: 'center', align: 'center', font: { weight: '700', size: 13 }, formatter: (v) => formatYuzde(v / toplamUretim * 100, 1) }
            }
        }
    });

    // 4c. Toplam su hacmi ve maksimum göl hacmi (milyon m³), 07.10.2026
    const barajAd = ['Tahtalı', 'Balçova', 'Ürkmez', 'Gördes', 'Alaçatı Kutlu Aktaş'];
    const etiketHer = { display: true, anchor: 'end', align: 'end', font: { weight: '600', size: 11 }, formatter: (v) => v === null ? '' : formatSayi(v) };
    const ctxHacim = getCtx('hacimChart');
    if (ctxHacim) new Chart(ctxHacim, {
        type: 'bar',
        data: {
            labels: barajAd,
            datasets: [
                { label: 'Toplam su hacmi (2026)', data: [144.123, 3.754, 4.995, 145.66, 8.41], birim: 'mnm3', backgroundColor: BARAJ_RENK, barPercentage: 0.8 },
                { label: 'Maksimum göl hacmi', data: [306.65, 7.759, 8.012, 453.38, 16.5], birim: 'mnm3', backgroundColor: renkSaydam(BARAJ_RENK, 0.3), barPercentage: 0.8 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: etiketHer },
            scales: { y: degerEkseni('milyon m³', { grace: '10%' }), x: kategoriEkseni }
        }
    });

    // 4d. Kullanılabilir su hacmi: 2026 ve bir önceki yıl (milyon m³)
    const ctxKul = getCtx('kullanilabilirChart');
    if (ctxKul) new Chart(ctxKul, {
        type: 'bar',
        data: {
            labels: barajAd,
            datasets: [
                { label: '2026', data: [124.523, 3.617, 4.62, 130.16, 7.91], birim: 'mnm3', backgroundColor: BARAJ_RENK },
                { label: 'Bir önceki yıl', data: [9.175, 0.282, 0.223, 0, 0.004], birim: 'mnm3', backgroundColor: NOTR_RENK.onceki }
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: etiketHer },
            scales: { x: degerEkseni('milyon m³', { grace: '20%' }), y: kategoriEkseni }
        }
    });

    // 4e. Göl su yükseltisi (m): minimum, son durum, maksimum
    const ctxKot = getCtx('kotChart');
    if (ctxKot) new Chart(ctxKot, {
        type: 'bar',
        data: {
            labels: barajAd,
            datasets: [
                { label: 'Minimum', data: [31.00, 101.00, 37.25, 204.00, 11.20], birim: 'kotm', backgroundColor: NOTR_RENK.ikincil },
                { label: 'Son durum (2026)', data: [52.61, 132.43, 40.20, 234.00, 16.35], birim: 'kotm', backgroundColor: BARAJ_RENK },
                { label: 'Maksimum', data: [60.50, 146.00, 45.70, 268.20, 19.80], birim: 'kotm', backgroundColor: '#1e40af' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: degerEkseni('m', { ticks: { callback: (v) => formatSayi(v) } }), x: kategoriEkseni }
        }
    });

    // 4f. Su kayıp-kaçak oranı (%)
    const ctxKayip = getCtx('kayipChart');
    if (ctxKayip) new Chart(ctxKayip, {
        type: 'bar',
        data: {
            labels: [['2021', 'merkez ilçeler'], ['2023', 'merkez ilçeler'], ['Önceki değer', 'kent merkezi'], ['Ocak 2026', 'kent merkezi']],
            datasets: [{ label: 'Kayıp-kaçak oranı', data: [28.44, 27.36, 27.17, 24.80], birim: 'yuzde', backgroundColor: ['#f59e0b', '#f59e0b', '#fb923c', '#34d399'], barPercentage: 0.6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatYuzdeSabit(v, 2) } },
            scales: { y: yuzdeEkseni('Kayıp-kaçak', { max: 35 }), x: kategoriEkseni }
        }
    });

    // 4g. Çamlı Barajı yıllık su verimi (milyon m³/yıl)
    const ctxCamli = getCtx('camliChart');
    if (ctxCamli) new Chart(ctxCamli, {
        type: 'bar',
        data: {
            labels: ['İZSU', ['TMMOB ÇMO', '(İZSU 2009 ve 2019 aktarımı)']],
            datasets: [{ label: 'Yıllık su verimi', data: [15, 21.5], birim: 'mnm3yil', backgroundColor: ['#34d399', '#14b8a6'], barPercentage: 0.55 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) + ' ' + birimAdi('mnm3yil') } },
            scales: { x: degerEkseni('milyon m³/yıl', { grace: '40%' }), y: kategoriEkseni }
        }
    });
});
