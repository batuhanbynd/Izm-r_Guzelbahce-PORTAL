// =============================================
// Tramvay Grafikleri
// =============================================

(function() {
    const tramvayYillar = ['2020', '2021', '2022', '2023', '2024'];
    const tramvayToplam = [14500000, 22800000, 33100000, 31900000, 33530114];

    // Yıllık Toplam Chart
    const ctxTY = getCtx('tramvayYillikChart');
    if (ctxTY) new Chart(ctxTY, {
        type: 'line',
        data: {
            labels: tramvayYillar,
            datasets: [{
                label: 'Toplam yolcu',
                data: tramvayToplam,
                birim: 'yolcu',
                borderColor: MOD_RENK.tramvayKonak,
                backgroundColor: MOD_RENK.tramvayKonak,
                pointRadius: 4.5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { top: 24 } },
            plugins: {
                legend: { display: false },
                // Beş nokta olduğu için her yılın değeri doğrudan yazılır
                datalabels: {
                    display: true,
                    align: 'top',
                    offset: 6,
                    formatter: function(value) { return formatKisa(value); }
                }
            },
            scales: {
                y: degerEkseni('Yıllık yolcu'),
                x: kategoriEkseni
            }
        }
    });

    // 2024 Hat Dağılımı Chart (Horizontal Bar)
    const ctxTH = getCtx('tramvayHatChart');
    if (ctxTH) new Chart(ctxTH, {
        type: 'bar',
        data: {
            labels: ['Konak Tramvayı', 'Karşıyaka/Çiğli Tramvayı'],
            datasets: [{
                label: '2024 yolcu sayısı',
                data: [22465062, 11065052],
                birim: 'yolcu',
                backgroundColor: [MOD_RENK.tramvayKonak, MOD_RENK.tramvayKarsiyaka],
                barPercentage: 0.6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { formatter: function(value) { return formatSayi(value); } }
            },
            scales: {
                x: degerEkseni('2024 yolcu', { grace: '25%' }),
                y: { grid: { display: false } }
            }
        }
    });
})();
