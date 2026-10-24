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
                    birim: 'yolcu',
                    backgroundColor: NOTR_RENK.onceki,
                    barPercentage: 0.8
                },
                {
                    label: '2025',
                    data: vapurTop10.map(d => d.g2025),
                    birim: 'yolcu',
                    backgroundColor: MOD_RENK.vapur,
                    barPercentage: 0.8
                },
                {
                    // Projeksiyon: açık dolgu + kenarlık, ölçülmüş verilerden ayrışsın
                    label: '2030 (projeksiyon)',
                    data: vapurTop10.map(d => d.g2030),
                    birim: 'yolcu',
                    backgroundColor: renkSaydam(MOD_RENK.vapur, 0.2),
                    borderColor: MOD_RENK.vapur,
                    borderWidth: 1.5,
                    barPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: degerEkseni('Günlük yolcu'),
                x: { ...kategoriEkseni, ticks: { maxRotation: 45, minRotation: 30, font: { size: 12 } } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // Halka: 2025 dağılımı (en yoğun 8 hat + diğer)
    const vapurSorted25 = [...vapurHatlar].sort((a,b) => b.g2025 - a.g2025);
    const vapurPieTop = vapurSorted25.slice(0, 8);
    const vapurPieOther = vapurSorted25.slice(8).reduce((s,d) => s + d.g2025, 0);
    const vapurPieLabels = vapurPieTop.map(d => d.kod + ' ' + d.hat);
    vapurPieLabels.push('Diğer hatlar');
    const vapurPieData = vapurPieTop.map(d => d.g2025);
    vapurPieData.push(vapurPieOther);
    // Tek renk ailesi: en yoğun hat en koyu, "diğer" gri
    const vapurPieColors = vapurPieTop.map((d, i) => renkSaydam(MOD_RENK.vapur, 1 - i * 0.1));
    vapurPieColors.push(NOTR_RENK.onceki);

    const ctxVP = getCtx('vapurPieChart');
    if (ctxVP) new Chart(ctxVP, {
        type: 'doughnut',
        data: {
            labels: vapurPieLabels,
            datasets: [{
                data: vapurPieData,
                birim: 'yolcu',
                backgroundColor: vapurPieColors,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 10, font: { size: 12 } } },
                tooltip: tooltipPayConfig
            }
        }
    });

    // Büyüme: 2020 -> 2030 en çok büyüyen 5 hat
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
                label: '2020–2030 büyüme',
                data: vapurGrowth.map(d => parseFloat(d.buyume)),
                birim: 'yuzde',
                backgroundColor: MOD_RENK.vapur,
                barPercentage: 0.65
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: yuzdeEkseni('Büyüme (2020–2030)', { grace: '15%' }),
                y: { grid: { display: false }, ticks: { font: { size: 12 } } }
            }
        }
    });
})();
