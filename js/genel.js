// =============================================
// Genel Bakış: ilçe profili grafikleri
// Kaynak: TÜİK ADNKS (Word raporu, Tablo 3 ve 2. bölüm)
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    // 1. Nüfus, 2017-2025
    const ctxNufus = getCtx('nufusChart');
    if (ctxNufus) new Chart(ctxNufus, {
        type: 'line',
        data: {
            labels: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
            datasets: [{
                label: 'Nüfus',
                data: [31429, 32592, 33725, 36727, 37572, 37753, 38044, 38500, 39474],
                birim: 'kisi',
                borderColor: '#34d399',
                backgroundColor: renkSaydam('#34d399', 0.15),
                fill: true,
                pointBackgroundColor: '#34d399'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: degerEkseni('Nüfus', { beginAtZero: false, min: 28000, ticks: { callback: (v) => formatSayi(v) } }), x: kategoriEkseni }
        }
    });

    // 2. 2025 nüfusu: kadın ve erkek
    const ctxCins = getCtx('cinsiyetChart');
    if (ctxCins) new Chart(ctxCins, {
        type: 'doughnut',
        data: {
            labels: ['Kadın', 'Erkek'],
            datasets: [{ data: [20580, 18894], birim: 'kisi', backgroundColor: ['#f472b6', '#60a5fa'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipPayConfig,
                datalabels: { color: '#f8fafc', anchor: 'center', align: 'center', font: { weight: '700', size: 13 }, formatter: (v) => formatSayi(v) }
            }
        }
    });
});
