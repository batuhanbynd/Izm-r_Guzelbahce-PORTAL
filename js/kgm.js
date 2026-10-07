// =============================================
// KGM Karayolları Grafikleri
// =============================================

(function() {
    const kgmGuzergahlar = [
        "Narlıdere - Güzelbahçe", 
        "Güzelbahçe - Urla", 
        "Çeşme - Urla Yönü", 
        "Güzelbahçe - Menderes", 
        "Çeşme Tarafı",
        "Otoyol Ayr. (300-01)"
    ];
    const kgmHafif = [60448, 34159, 15955, 70657, 6644, 14670];
    const kgmAgir = [6471, 4846, 2557, 6122, 1401, 394];
    const kgmToplam = [66919, 39005, 18512, 76779, 8045, 15064];

    // KGM Bar Chart (Stacked)
    const ctxKgmBar = getCtx('kgmBarChart');
    if (ctxKgmBar) new Chart(ctxKgmBar, {
        type: 'bar',
        data: {
            labels: kgmGuzergahlar,
            datasets: [
                {
                    label: 'Hafif Taşıt',
                    data: kgmHafif,
                    backgroundColor: 'rgba(56, 189, 248, 0.85)',
                    borderRadius: {topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4}
                },
                {
                    label: 'Ağır Taşıt',
                    data: kgmAgir,
                    backgroundColor: 'rgba(244, 114, 182, 0.85)',
                    borderRadius: {topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0}
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, color: '#f8fafc' } },
                tooltip: tooltipConfig,
                datalabels: {
                    formatter: function(value) { return new Intl.NumberFormat('tr-TR').format(value); },
                    font: { size: 11, weight: 'bold' },
                    color: '#0f172a'
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { 
                    stacked: true, 
                    ...yAxisConfig, 
                    ticks: { callback: function(value) { return (value/1000).toFixed(0) + 'B'; } }
                }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // KGM Pie Chart
    const ctxKgmPie = getCtx('kgmPieChart');
    if (ctxKgmPie) new Chart(ctxKgmPie, {
        type: 'doughnut',
        data: {
            labels: kgmGuzergahlar,
            datasets: [{
                data: kgmToplam,
                backgroundColor: [
                    'rgba(129, 140, 248, 0.85)',
                    'rgba(56, 189, 248, 0.85)',
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(244, 114, 182, 0.85)',
                    'rgba(251, 191, 36, 0.85)',
                    'rgba(167, 139, 250, 0.85)'
                ],
                borderColor: 'rgba(30, 41, 59, 1)',
                borderWidth: 3,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, color: '#f8fafc' } },
                tooltip: {
                    ...tooltipConfig,
                    callbacks: {
                        label: function(ctx) {
                            const pct = ((ctx.parsed / 224324) * 100).toFixed(1);
                            return ctx.label + ': ' + new Intl.NumberFormat('tr-TR').format(ctx.parsed) + ' (%' + pct + ')';
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });

    // ==========================================
    // Güzelbahçe Özel Grafikler
    // ==========================================
    const gbLabels = ["İzmir-Çeşme Otoyolu (O-32)", "75. Yıl Cumhuriyet Bulvarı", "Mithatpaşa Cd. (Sahil Yolu)", "Otoyol Bağlantı Yolu"];
    
    // Grafik 1: Kapasite Karşılaştırması (Bar)
    const ctxGbCapacity = getCtx('kgmCapacityChart');
    if (ctxGbCapacity) new Chart(ctxGbCapacity, {
        type: 'bar',
        data: {
            labels: gbLabels,
            datasets: [
                {
                    label: 'Rutin Hacim',
                    data: [45000, 15000, 18000, 15064],
                    backgroundColor: 'rgba(52, 211, 153, 0.85)', // Success color
                    borderRadius: 4
                },
                {
                    label: 'Yaz/Pik Hacim',
                    data: [115000, 38000, 26000, 25000],
                    backgroundColor: 'rgba(248, 113, 113, 0.85)', // Danger color
                    borderRadius: 4
                },
                {
                    label: 'Teorik Kapasite',
                    data: [130000, 45000, 25000, 30000],
                    backgroundColor: 'rgba(148, 163, 184, 0.5)', // Muted gray
                    borderColor: 'rgba(148, 163, 184, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, color: '#f8fafc' } },
                tooltip: tooltipConfig,
                datalabels: {
                    formatter: function(value) { return new Intl.NumberFormat('tr-TR').format(value); },
                    font: { size: 10, weight: 'bold' },
                    color: '#fff',
                    rotation: -90,
                    align: 'start',
                    anchor: 'end'
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { 
                    ...yAxisConfig,
                    ticks: { callback: function(value) { return (value/1000).toFixed(0) + 'B'; } }
                }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // Grafik 2: Doluluk Oranı (V/C %)
    const ctxGbDensity = getCtx('kgmDensityChart');
    if (ctxGbDensity) new Chart(ctxGbDensity, {
        type: 'bar',
        data: {
            labels: gbLabels,
            datasets: [
                {
                    label: 'Rutin Doluluk (%)',
                    data: [35, 33, 72, 50],
                    backgroundColor: 'rgba(56, 189, 248, 0.85)', // Accent-1
                    borderRadius: 4
                },
                {
                    label: 'Yaz/Pik Doluluk (%)',
                    data: [88, 84, 104, 83],
                    backgroundColor: function(context) {
                        const index = context.dataIndex;
                        const value = context.dataset.data[index];
                        return value > 100 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(251, 191, 36, 0.85)'; // Red if over 100%, yellow otherwise
                    },
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, color: '#f8fafc' } },
                tooltip: {
                    ...tooltipConfig,
                    callbacks: {
                        label: function(ctx) {
                            let label = ctx.dataset.label || '';
                            if (label) { label += ': '; }
                            label += '%' + ctx.parsed.y;
                            if (ctx.parsed.y > 100) label += ' (Kapasite Aşımı!)';
                            return label;
                        }
                    }
                },
                datalabels: {
                    formatter: function(value) { return '%' + value; },
                    font: { size: 12, weight: 'bold' },
                    color: '#fff'
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { 
                    ...yAxisConfig,
                    max: 120, // To give room for 104%
                    ticks: { callback: function(value) { return '%' + value; } }
                }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

})();
