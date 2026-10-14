// Elektrik altyapısı grafikleri (Word belgesindeki şebeke raporu): trafo kapasitesi ve hat uzunluğu
document.addEventListener('DOMContentLoaded', function() {
    const ENERJI = '#fb923c';

    const ctxKapasite = getCtx('trafoKapasiteChart');
    if (ctxKapasite) new Chart(ctxKapasite, {
        type: 'bar',
        data: {
            labels: ['154/34,5 kV ana indirici', 'Binalı trafo / DM'],
            datasets: [{ label: 'Trafo kapasitesi', data: [100, 3.25], backgroundColor: [ENERJI, renkSaydam(ENERJI, 0.45)], borderRadius: 10, barPercentage: 0.55 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (value) => formatSayi(value) + ' MVA' }, tooltip: { callbacks: { label: (c) => formatSayi(c.raw) + ' MVA' } } },
            scales: { y: degerEkseni('MVA', { grace: '15%' }), x: kategoriEkseni }
        }
    });

    const ctxHat = getCtx('hatUzunlukChart');
    if (ctxHat) new Chart(ctxHat, {
        type: 'bar',
        data: {
            labels: ['Yeraltı', 'Havai / yeraltı'],
            datasets: [{ label: 'Hat uzunluğu (yaklaşık)', data: [2.5, 3.2], backgroundColor: [ENERJI, renkSaydam(ENERJI, 0.45)], borderRadius: 10, barPercentage: 0.55 }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (value) => '~' + formatSayi(value) + ' km' }, tooltip: { callbacks: { label: (c) => '~' + formatSayi(c.raw) + ' km' } } },
            scales: { x: degerEkseni('km', { grace: '15%' }), y: kategoriEkseni }
        }
    });
});
