// =============================================
// İZBAN Grafikleri
// =============================================

(function() {
    const izbanData = [
        {yil: "2010", toplam: 39941658, buyume: null},
        {yil: "2011", toplam: 47864857, buyume: 19.8},
        {yil: "2012", toplam: 53262095, buyume: 11.3},
        {yil: "2013", toplam: 65100439, buyume: 22.2},
        {yil: "2014", toplam: 86493421, buyume: 32.9},
        {yil: "2015", toplam: 101086308, buyume: 16.9}
    ];

    // Çubuk: yıllık yolcu (sol eksen) · Çizgi: yıllık büyüme (sağ eksen)
    const ctxIzban = getCtx('izbanChart');
    if (ctxIzban) new Chart(ctxIzban, {
        type: 'bar',
        data: {
            labels: izbanData.map(d => d.yil),
            datasets: [
                {
                    label: 'Yıllık büyüme (sağ eksen)',
                    data: izbanData.map(d => d.buyume),
                    birim: 'yuzde',
                    type: 'line',
                    yAxisID: 'y1',
                    order: 0,
                    borderColor: '#e2e8f0',
                    backgroundColor: '#e2e8f0',
                    pointBackgroundColor: '#0f172a'
                },
                {
                    label: 'Toplam yolcu (sol eksen)',
                    data: izbanData.map(d => d.toplam),
                    birim: 'yolcu',
                    yAxisID: 'y',
                    order: 1,
                    backgroundColor: MOD_RENK.izban,
                    barPercentage: 0.7
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: degerEkseni('Yıllık yolcu', { position: 'left' }),
                y1: yuzdeEkseni('Yıllık büyüme', { position: 'right', grid: { drawOnChartArea: false } }),
                x: kategoriEkseni
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
})();
