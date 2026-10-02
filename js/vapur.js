// =============================================
// İzdeniz Vapur Grafikleri
// =============================================

(function() {
    const vapurHatlar = [
        {kod:'V01', hat:'Karşıyaka-Konak', g2020:29131, g2025:30026, g2030:36444},
        {kod:'V02', hat:'Bostanlı-Konak', g2020:12401, g2025:13090, g2030:17387},
        {kod:'V03', hat:'Karşıyaka-Alsancak-Pasaport', g2020:9117, g2025:11855, g2030:12124},
        {kod:'V04', hat:'Bostanlı-Alsancak-Pasaport', g2020:2540, g2025:4305, g2030:5738},
        {kod:'V05', hat:'Üçkuyular-Göztepe-Konak', g2020:12441, g2025:10739, g2030:11768},
        {kod:'V06', hat:'Karşıyaka-Göztepe', g2020:1187, g2025:1432, g2030:2754},
        {kod:'V07', hat:'Karşıyaka-Üçkuyular-Göztepe', g2020:2271, g2025:2620, g2030:3316},
        {kod:'V08', hat:'Bayraklı-Pasaport-Konak', g2020:8745, g2025:8294, g2030:9980},
        {kod:'V09', hat:'Bostanlı-Üçkuyular (Arabalı)', g2020:412, g2025:554, g2030:696},
        {kod:'V11', hat:'Mavişehir-Mavişehir', g2020:1725, g2025:1496, g2030:3158},
        {kod:'V12', hat:'Güzelbahçe-Bostanlı', g2020:5271, g2025:8452, g2030:13715},
        {kod:'V13', hat:'Güzelbahçe-Konak', g2020:9861, g2025:18804, g2030:11491},
        {kod:'V14', hat:'Güzelbahçe-Salhane', g2020:1543, g2025:2833, g2030:3878},
        {kod:'V15', hat:'Salhane-Bostanlı', g2020:2161, g2025:1884, g2030:2604},
        {kod:'V16', hat:'Salhane-Karşıyaka', g2020:8318, g2025:4020, g2030:3807},
        {kod:'V17', hat:'Salhane-Mavişehir', g2020:1614, g2025:1464, g2030:2192},
        {kod:'V19', hat:'Balıkhova-Konak', g2020:1599, g2025:3371, g2030:6980}
    ];

    // Top 10 by 2025
    const vapurTop10 = [...vapurHatlar].sort((a,b) => b.g2025 - a.g2025).slice(0, 10);

    const ctxVT = getCtx('vapurTop10Chart');
    if (ctxVT) new Chart(ctxVT, {
        type: 'bar',
        data: {
            labels: vapurTop10.map(d => d.kod + ' ' + d.hat),
            datasets: [
                {
                    label: '2020',
                    data: vapurTop10.map(d => d.g2020),
                    backgroundColor: 'rgba(56, 189, 248, 0.7)',
                    borderRadius: 4,
                    barPercentage: 0.75
                },
                {
                    label: '2025',
                    data: vapurTop10.map(d => d.g2025),
                    backgroundColor: 'rgba(129, 140, 248, 0.85)',
                    borderRadius: 4,
                    barPercentage: 0.75
                },
                {
                    label: '2030',
                    data: vapurTop10.map(d => d.g2030),
                    backgroundColor: 'rgba(244, 114, 182, 0.8)',
                    borderRadius: 4,
                    barPercentage: 0.75
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 } },
                tooltip: tooltipConfig,
                datalabels: { display: false }
            },
            scales: {
                y: {
                    ...yAxisConfig,
                    ticks: { callback: function(v) { return (v/1000).toFixed(0)+'B'; } }
                },
                x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 30, font: { size: 10 } } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // Pie: 2025 Dağılım (Top 8 + Diğer)
    const vapurSorted25 = [...vapurHatlar].sort((a,b) => b.g2025 - a.g2025);
    const vapurPieTop = vapurSorted25.slice(0, 8);
    const vapurPieOther = vapurSorted25.slice(8).reduce((s,d) => s + d.g2025, 0);
    const vapurPieLabels = vapurPieTop.map(d => d.kod + ' ' + d.hat);
    vapurPieLabels.push('Diğer Hatlar');
    const vapurPieData = vapurPieTop.map(d => d.g2025);
    vapurPieData.push(vapurPieOther);
    const vapurPieColors = [
        'rgba(129, 140, 248, 0.85)',
        'rgba(56, 189, 248, 0.85)',
        'rgba(244, 114, 182, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(100, 116, 139, 0.6)'
    ];

    const ctxVP = getCtx('vapurPieChart');
    if (ctxVP) new Chart(ctxVP, {
        type: 'doughnut',
        data: {
            labels: vapurPieLabels,
            datasets: [{
                data: vapurPieData,
                backgroundColor: vapurPieColors,
                borderColor: 'rgba(30, 41, 59, 1)',
                borderWidth: 3,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 10 }, color: '#f8fafc' } },
                tooltip: {
                    ...tooltipConfig,
                    callbacks: {
                        label: function(ctx) {
                            const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
                            const pct = ((ctx.parsed / total)*100).toFixed(1);
                            return ctx.label + ': ' + new Intl.NumberFormat('tr-TR').format(ctx.parsed) + ' (%' + pct + ')';
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });

    // Growth Chart: 2020 -> 2030 en çok büyüyen 5 hat
    const vapurGrowth = vapurHatlar.map(d => ({
        ...d,
        buyume: ((d.g2030 - d.g2020) / d.g2020 * 100).toFixed(1)
    })).sort((a,b) => b.buyume - a.buyume).slice(0, 5);

    const ctxVG = getCtx('vapurGrowthChart');
    if (ctxVG) new Chart(ctxVG, {
        type: 'bar',
        data: {
            labels: vapurGrowth.map(d => d.kod + ' ' + d.hat),
            datasets: [{
                label: 'Büyüme (%)',
                data: vapurGrowth.map(d => parseFloat(d.buyume)),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(56, 189, 248, 0.85)',
                    'rgba(129, 140, 248, 0.85)',
                    'rgba(244, 114, 182, 0.8)',
                    'rgba(251, 191, 36, 0.8)'
                ],
                borderRadius: 6
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
                    formatter: function(v) { return v + '%'; },
                    font: { weight: 'bold', size: 13 },
                    color: '#f8fafc'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { callback: function(v) { return v + '%'; } }
                },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
})();
