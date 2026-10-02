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

    const ctxMetro = getCtx('metroChart');

    const metroGradient = ctxMetro?.createLinearGradient(0, 0, 0, 400);
    metroGradient?.addColorStop(0, 'rgba(129, 140, 248, 0.9)');
    metroGradient?.addColorStop(1, 'rgba(129, 140, 248, 0.15)');

    if (ctxMetro) new Chart(ctxMetro, {
        type: 'bar',
        data: {
            labels: metroData.map(d => d.yil),
            datasets: [
                {
                    label: 'Yıllık Büyüme (%)',
                    data: metroData.map(d => d.buyume),
                    type: 'line',
                    yAxisID: 'y1',
                    borderColor: 'rgba(251, 191, 36, 1)',
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                    borderWidth: 4,
                    pointRadius: 6,
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: 'rgba(251, 191, 36, 1)',
                    pointBorderWidth: 3,
                    pointHoverRadius: 8,
                    tension: 0.3
                },
                {
                    label: 'Toplam Biniş',
                    data: metroData.map(d => d.toplam),
                    yAxisID: 'y',
                    backgroundColor: metroGradient,
                    borderRadius: 8,
                    borderWidth: 0,
                    barPercentage: 0.65,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 } },
                tooltip: {
                    ...tooltipConfig,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 0) {
                                    label += context.parsed.y + '%';
                                } else {
                                    label += new Intl.NumberFormat('tr-TR').format(context.parsed.y);
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ...yAxisConfig,
                    type: 'linear',
                    display: true,
                    position: 'left'
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: function(value) { return value + '%'; },
                        color: '#94a3b8'
                    }
                },
                x: { grid: { display: false } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
})();
