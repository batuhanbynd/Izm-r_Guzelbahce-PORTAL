// =============================================
// Ulaşım Karşılaştırması Grafikleri
// =============================================

(function() {
    // Pie Chart
    const ctxKPie = getCtx('karsilastirmaPie');
    if (ctxKPie) new Chart(ctxKPie, {
        type: 'doughnut',
        data: {
            labels: ['ESHOT', 'İzmir Metro', 'İZBAN', 'Vapur (İzdeniz)', 'Konak Tramvayı', 'Karşıyaka/Çiğli Tramvayı'],
            datasets: [{
                data: [137842250, 127400000, 101086308, 46397340, 22465062, 11065052],
                backgroundColor: [
                    'rgba(244, 114, 182, 0.85)',
                    'rgba(129, 140, 248, 0.85)',
                    'rgba(251, 191, 36, 0.85)',
                    'rgba(56, 189, 248, 0.85)',
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(52, 211, 153, 0.85)'
                ],
                borderColor: 'rgba(30, 41, 59, 1)',
                borderWidth: 4,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, color: '#f8fafc' } },
                tooltip: {
                    ...tooltipConfig,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + new Intl.NumberFormat('tr-TR').format(context.parsed) + ' (%' + pct + ')';
                        }
                    }
                }
            }
        }
    });

    // Bar Chart
    const ctxKBar = getCtx('karsilastirmaBar');
    if (ctxKBar) new Chart(ctxKBar, {
        type: 'bar',
        data: {
            labels: ['ESHOT', 'İzmir Metro', 'İZBAN', 'Vapur', 'Konak Tram.', 'Karşıyaka Tram.'],
            datasets: [{
                label: 'Yıllık Toplam Biniş',
                data: [137842250, 127400000, 101086308, 46397340, 22465062, 11065052],
                backgroundColor: [
                    'rgba(244, 114, 182, 0.85)',
                    'rgba(129, 140, 248, 0.85)',
                    'rgba(251, 191, 36, 0.85)',
                    'rgba(56, 189, 248, 0.85)',
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(52, 211, 153, 0.85)'
                ],
                borderRadius: 8,
                borderWidth: 0,
                barPercentage: 0.6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: tooltipConfig
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        callback: function(value) {
                            return (value / 1000000).toFixed(0) + 'M';
                        }
                    }
                },
                y: { grid: { display: false } }
            }
        }
    });
})();
