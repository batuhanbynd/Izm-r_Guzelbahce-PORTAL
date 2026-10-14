// =============================================
// Ulaşım Karşılaştırması Grafikleri
// =============================================

(function() {
    const modRenkleri = [
        MOD_RENK.eshot,
        MOD_RENK.metro,
        MOD_RENK.izban,
        MOD_RENK.vapur,
        MOD_RENK.tramvayKonak,
        MOD_RENK.tramvayKarsiyaka
    ];

    // Halka grafik: toplam içindeki paylar
    const ctxKPie = getCtx('karsilastirmaPie');
    if (ctxKPie) new Chart(ctxKPie, {
        type: 'doughnut',
        data: {
            labels: ['ESHOT', 'İzmir Metro', 'İZBAN', 'Vapur (İzdeniz)', 'Konak Tramvayı', 'Karşıyaka/Çiğli Tramvayı'],
            datasets: [{
                data: [137842250, 127400000, 101086308, 46397340, 22465062, 11065052],
                birim: 'yolcu',
                backgroundColor: modRenkleri,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipPayConfig
            }
        }
    });

    // Yatay çubuk: büyükten küçüğe yıllık biniş
    const ctxKBar = getCtx('karsilastirmaBar');
    if (ctxKBar) new Chart(ctxKBar, {
        type: 'bar',
        data: {
            labels: ['ESHOT', 'İzmir Metro', 'İZBAN', 'Vapur', 'Konak Tram.', 'Karşıyaka Tram.'],
            datasets: [{
                label: 'Yıllık toplam biniş',
                data: [137842250, 127400000, 101086308, 46397340, 22465062, 11065052],
                birim: 'yolcu',
                backgroundColor: modRenkleri,
                barPercentage: 0.65
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: degerEkseni('Yıllık biniş', { grace: '25%' }),
                y: { grid: { display: false } }
            }
        }
    });
})();
