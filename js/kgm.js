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

    // Hafif / ağır taşıt (yığılmış çubuk): ağır taşıt vurgulu
    const ctxKgmBar = getCtx('kgmBarChart');
    if (ctxKgmBar) new Chart(ctxKgmBar, {
        type: 'bar',
        data: {
            labels: kgmGuzergahlar,
            datasets: [
                {
                    label: 'Hafif taşıt',
                    data: kgmHafif,
                    birim: 'tasit',
                    backgroundColor: NOTR_RENK.ikincil,
                    borderRadius: 0
                },
                {
                    label: 'Ağır taşıt',
                    data: kgmAgir,
                    birim: 'tasit',
                    backgroundColor: MOD_RENK.karayolu
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { ...kategoriEkseni, stacked: true },
                y: degerEkseni('Taşıt/gün (YOGT)', { stacked: true })
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // Güzergahlara göre toplam YOGT: kesimler ayrı ölçümler olduğu için
    // pay (pasta) yerine büyükten küçüğe sıralı çubukla gösterilir
    const sira = kgmToplam.map((v, i) => i).sort((a, b) => kgmToplam[b] - kgmToplam[a]);
    const ctxKgmPie = getCtx('kgmPieChart');
    if (ctxKgmPie) new Chart(ctxKgmPie, {
        type: 'bar',
        data: {
            labels: sira.map(i => kgmGuzergahlar[i]),
            datasets: [{
                label: 'Toplam (YOGT)',
                data: sira.map(i => kgmToplam[i]),
                birim: 'tasit',
                backgroundColor: MOD_RENK.karayolu,
                barPercentage: 0.7
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { formatter: function(value) { return formatSayi(value); } }
            },
            scales: {
                x: degerEkseni('Taşıt/gün', { grace: '25%' }),
                y: { grid: { display: false } }
            }
        }
    });

    // ==========================================
    // Güzelbahçe Özel Grafikler
    // ==========================================
    const gbLabels = ["İzmir-Çeşme Otoyolu (O-32)", "75. Yıl Cumhuriyet Bulvarı", "Mithatpaşa Cd. (Sahil Yolu)", "Otoyol Bağlantı Yolu"];
    const RUTIN = '#fdba74';
    const PIK = '#ea580c';
    const ASIM = '#ef4444';

    // Grafik 1: Kapasite Karşılaştırması (Bar)
    const ctxGbCapacity = getCtx('kgmCapacityChart');
    if (ctxGbCapacity) new Chart(ctxGbCapacity, {
        type: 'bar',
        data: {
            labels: gbLabels,
            datasets: [
                {
                    label: 'Rutin hacim',
                    data: [45000, 15000, 18000, 15064],
                    birim: 'tasit',
                    backgroundColor: RUTIN
                },
                {
                    label: 'Yaz/pik hacim',
                    data: [115000, 38000, 26000, 25000],
                    birim: 'tasit',
                    backgroundColor: PIK
                },
                {
                    // Kapasite bir sınır değeri olduğu için içi boş çubukla gösterilir
                    label: 'Teorik kapasite',
                    data: [130000, 45000, 25000, 30000],
                    birim: 'tasit',
                    backgroundColor: 'transparent',
                    borderColor: '#cbd5e1',
                    borderWidth: 1.5,
                    borderDash: [4, 3]
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: kategoriEkseni,
                y: degerEkseni('Taşıt/gün')
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // %100 kapasite çizgisi (V/C grafiği için küçük eklenti)
    const kapasiteCizgisi = {
        id: 'kapasiteCizgisi',
        afterDatasetsDraw(chart) {
            const y = chart.scales.y.getPixelForValue(100);
            const { left, right } = chart.chartArea;
            const c = chart.ctx;
            c.save();
            c.strokeStyle = temaRengi('cizgi');
            c.lineWidth = 1;
            c.setLineDash([6, 4]);
            c.beginPath(); c.moveTo(left, y); c.lineTo(right, y); c.stroke();
            c.setLineDash([]);
            c.fillStyle = temaRengi('etiket');
            c.font = "600 12px 'Outfit', sans-serif";
            c.textAlign = 'right';
            c.fillText('Kapasite (%100)', right, y - 6);
            c.restore();
        }
    };

    // Grafik 2: Doluluk Oranı (V/C %)
    const ctxGbDensity = getCtx('kgmDensityChart');
    if (ctxGbDensity) new Chart(ctxGbDensity, {
        type: 'bar',
        data: {
            labels: gbLabels,
            datasets: [
                {
                    label: 'Rutin doluluk',
                    data: [35, 33, 72, 50],
                    birim: 'yuzde',
                    backgroundColor: RUTIN
                },
                {
                    label: 'Yaz/pik doluluk',
                    data: [88, 84, 104, 83],
                    birim: 'yuzde',
                    backgroundColor: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        return value > 100 ? ASIM : PIK;
                    }
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            let label = (ctx.dataset.label || '') + ': ' + formatYuzde(ctx.parsed.y);
                            if (ctx.parsed.y > 100) label += ' (kapasitenin üzerinde)';
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: kategoriEkseni,
                y: yuzdeEkseni('Hacim / kapasite (V/C)', { max: 120 }) // %104 değerine yer açmak için
            },
            interaction: { mode: 'index', intersect: false }
        },
        plugins: [kapasiteCizgisi]
    });

})();
