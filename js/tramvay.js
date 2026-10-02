// =============================================
// Tramvay Grafikleri
// =============================================

(function() {
    const tramvayYillar = ['2020', '2021', '2022', '2023', '2024'];
    const tramvayToplam = [14500000, 22800000, 33100000, 31900000, 33530114];
    
    // Yıllık Toplam Chart
    const ctxTY = getCtx('tramvayYillikChart');
    const tyGradient = ctxTY?.createLinearGradient(0, 0, 0, 400);
    tyGradient?.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
    tyGradient?.addColorStop(1, 'rgba(16, 185, 129, 0.2)');

    if (ctxTY) new Chart(ctxTY, {
        type: 'line',
        data: {
            labels: tramvayYillar,
            datasets: [{
                label: 'Toplam Yolcu',
                data: tramvayToplam,
                backgroundColor: tyGradient,
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#0f172a',
                pointBorderWidth: 2,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: tooltipConfig,
                datalabels: {
                    align: 'top',
                    offset: 8,
                    formatter: function(value) { return (value/1000000).toFixed(1) + 'M'; },
                    font: { size: 12, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    ...yAxisConfig,
                    ticks: { callback: function(value) { return (value/1000000).toFixed(0) + 'M'; } },
                    max: 40000000
                },
                x: { grid: { display: false } }
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
                label: '2024 Yolcu Sayısı',
                data: [22465062, 11065052],
                backgroundColor: [
                    'rgba(56, 189, 248, 0.85)',
                    'rgba(168, 85, 247, 0.85)'
                ],
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: tooltipConfig,
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: function(value) { return new Intl.NumberFormat('tr-TR').format(value); },
                    font: { size: 12, weight: 'bold' },
                    color: '#f8fafc'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { callback: function(value) { return (value/1000000).toFixed(0) + 'M'; } },
                    max: 27000000
                },
                y: { grid: { display: false } }
            }
        }
    });
})();
