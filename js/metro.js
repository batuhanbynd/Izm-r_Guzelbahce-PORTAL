// =============================================
// İzmir Metro Grafikleri
// =============================================

(function() {
    const metroData = [
        {yil: "2020", toplam: 74500000, buyume: null},
        {yil: "2021", toplam: 81400000, buyume: 9.3},
        {yil: "2022", toplam: 125500000, buyume: 54.2},
        {yil: "2023", toplam: 125500000, buyume: 0},
        {yil: "2024", toplam: 127400000, buyume: 1.5}
    ];

    // Çubuk: yıllık biniş (sol eksen) · Çizgi: yıllık büyüme (sağ eksen)
    const ctxMetro = getCtx('metroChart');
    if (ctxMetro) new Chart(ctxMetro, {
        type: 'bar',
        data: {
            labels: metroData.map(d => d.yil),
            datasets: [
                {
                    label: 'Yıllık büyüme (sağ eksen)',
                    data: metroData.map(d => d.buyume),
                    birim: 'yuzde',
                    type: 'line',
                    yAxisID: 'y1',
                    order: 0,
                    borderColor: '#e2e8f0',
                    backgroundColor: '#e2e8f0',
                    pointBackgroundColor: '#0f172a'
                },
                {
                    label: 'Toplam biniş (sol eksen)',
                    data: metroData.map(d => d.toplam),
                    birim: 'yolcu',
                    yAxisID: 'y',
                    order: 1,
                    backgroundColor: MOD_RENK.metro,
                    barPercentage: 0.65
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: degerEkseni('Yıllık biniş', { position: 'left' }),
                y1: yuzdeEkseni('Yıllık büyüme', { position: 'right', grid: { drawOnChartArea: false } }),
                x: kategoriEkseni
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
})();
