// =============================================
// Adnan Menderes Havalimanı Grafikleri
// =============================================

(function() {
    const aylikData = [
        {ay: "Ocak", top25: 840063, top26: 978647, ic26: 689814, dis26: 288833},
        {ay: "Şubat", top25: 750786, top26: 779202, ic26: 565414, dis26: 213788},
        {ay: "Mart", top25: 768336, top26: 885919, ic26: 634535, dis26: 251384},
        {ay: "Nisan", top25: 951928, top26: 979325, ic26: 646627, dis26: 332698},
        {ay: "Mayıs", top25: 1047527, top26: 1188664, ic26: 741090, dis26: 447574},
        {ay: "Haziran", top25: 1151663, top26: 1182827, ic26: 695406, dis26: 487421},
        {ay: "Temmuz", top25: 1332922, top26: 1412062, ic26: 770946, dis26: 641116},
        {ay: "Ağustos", top25: 1462588, top26: 1518759, ic26: 816849, dis26: 701910}
    ];

    const kümülatifData = [
        {ay: "Ocak", top25: 840063, top26: 978647},
        {ay: "Şubat", top25: 1590849, top26: 1757849},
        {ay: "Mart", top25: 2359185, top26: 2643768},
        {ay: "Nisan", top25: 3311113, top26: 3623093},
        {ay: "Mayıs", top25: 4358640, top26: 4811757},
        {ay: "Haziran", top25: 5510303, top26: 5994584},
        {ay: "Temmuz", top25: 6843225, top26: 7406646},
        {ay: "Ağustos", top25: 8305813, top26: 8925405}
    ];

    // 1. Aylık Toplam Chart
    const ctxMonthly = getCtx('monthlyChart');
    if (ctxMonthly) new Chart(ctxMonthly, {
        type: 'bar',
        data: {
            labels: aylikData.map(d => d.ay),
            datasets: [
                {
                    label: '2025',
                    data: aylikData.map(d => d.top25),
                    backgroundColor: 'rgba(56, 189, 248, 0.8)',
                    borderRadius: 6,
                    barPercentage: 0.6
                },
                {
                    label: '2026',
                    data: aylikData.map(d => d.top26),
                    backgroundColor: 'rgba(129, 140, 248, 0.9)',
                    borderRadius: 6,
                    barPercentage: 0.6
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, tooltip: tooltipConfig },
            scales: { y: yAxisConfig, x: { grid: { display: false } } },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // 2. Kümülatif Büyüme (Line Chart)
    const ctxCum = getCtx('cumulativeChart');
    if (ctxCum) new Chart(ctxCum, {
        type: 'line',
        data: {
            labels: kümülatifData.map(d => d.ay),
            datasets: [
                {
                    label: '2025 Kümülatif',
                    data: kümülatifData.map(d => d.top25),
                    borderColor: 'rgba(56, 189, 248, 0.8)',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '2026 Kümülatif',
                    data: kümülatifData.map(d => d.top26),
                    borderColor: 'rgba(244, 114, 182, 0.9)',
                    backgroundColor: 'rgba(244, 114, 182, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, tooltip: tooltipConfig },
            scales: { y: yAxisConfig, x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } } },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // 3. İç/Dış Hat Split (Stacked Bar for 2026)
    const ctxSplit = getCtx('splitChart');
    if (ctxSplit) new Chart(ctxSplit, {
        type: 'bar',
        data: {
            labels: aylikData.map(d => d.ay),
            datasets: [
                {
                    label: 'İç Hat',
                    data: aylikData.map(d => d.ic26),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: {topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6}
                },
                {
                    label: 'Dış Hat',
                    data: aylikData.map(d => d.dis26),
                    backgroundColor: 'rgba(251, 191, 36, 0.8)',
                    borderRadius: {topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0}
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, tooltip: tooltipConfig },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { ...yAxisConfig, stacked: true }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
})();
