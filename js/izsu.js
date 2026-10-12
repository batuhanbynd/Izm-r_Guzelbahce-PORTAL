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
