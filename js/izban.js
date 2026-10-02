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

    const ctxIzban = getCtx('izbanChart');
    
    // Gradient for Bar Chart
    const izbanGradient = ctxIzban?.createLinearGradient(0, 0, 0, 400);
    izbanGradient?.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    izbanGradient?.addColorStop(1, 'rgba(56, 189, 248, 0.2)');

    if (ctxIzban) new Chart(ctxIzban, {
        type: 'bar',
        data: {
            labels: izbanData.map(d => d.yil),
            datasets: [
                {
                    label: 'Yıllık Büyüme Oranı (%)',
                    data: izbanData.map(d => d.buyume),
                    type: 'line',
                    yAxisID: 'y1',
                    borderColor: 'rgba(244, 114, 182, 1)',
                    backgroundColor: 'rgba(244, 114, 182, 0.2)',
                    borderWidth: 4,
                    pointRadius: 6,
                    pointBackgroundColor: '#0f172a',
                    pointBorderWidth: 3,
                    pointHoverRadius: 8,
                    tension: 0.3
                },
                {
                    label: 'Toplam Yolcu',
                    data: izbanData.map(d => d.toplam),
                    yAxisID: 'y',
                    backgroundColor: izbanGradient,
                    borderRadius: 8,
                    borderWidth: 0,
                    barPercentage: 0.7,
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
                            if (label) {
                                label += ': ';
                            }
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
                    position: 'left',
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
