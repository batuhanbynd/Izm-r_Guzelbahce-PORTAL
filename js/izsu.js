document.addEventListener('DOMContentLoaded', function() {

    // 0. Barajların aktif doluluk oranı (su1.jpg.png yerine)
    // Veriler: tahtalı 43, balçova 47, ürkmez 61, gördes 29, alaçatı 48
    // Güzelbahçe ile doğrudan ilişkili Balçova Barajı vurgulanır, diğerleri açık tonda
    const barajlar = ['Tahtalı Barajı', 'Balçova Barajı', 'Ürkmez Barajı', 'Gördes Barajı', 'Alaçatı Barajı'];
    const ctxSu1 = getCtx('su1Chart');
    if (ctxSu1) window.su1ChartInstance = new Chart(ctxSu1, {
        type: 'bar',
        data: {
            labels: barajlar,
            datasets: [{
                label: 'Aktif doluluk oranı',
                data: [43, 47, 61, 29, 48],
                birim: 'yuzde',
                backgroundColor: barajlar.map(b => b === 'Balçova Barajı' ? MOD_RENK.su : renkSaydam(MOD_RENK.su, 0.4)),
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
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
                datalabels: { formatter: (value) => value + ' kaynak' }
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
