// =============================================
// ESHOT Otobüs Grafikleri
// =============================================

(function() {
    const eshotAylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const eshotGunluk = [660446, 719559, 463682, 100704, 103168, 316936, 384188, 374791, 409971, 417266, 342619, 236473];
    const eshotOtobus = [636, 699, 494, 154, 196, 332, 406, 398, 426, 423, 352, 265];

    // Günlük Ortalama Biniş Chart
    const ctxEG = getCtx('eshotGunlukChart');
    const egGradient = ctxEG?.createLinearGradient(0, 0, 0, 400);
    egGradient?.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    egGradient?.addColorStop(1, 'rgba(56, 189, 248, 0.2)');

    if (ctxEG) new Chart(ctxEG, {
        type: 'bar',
        data: {
            labels: eshotAylar,
            datasets: [{
                label: 'Günlük Ort. Biniş',
                data: eshotGunluk,
                backgroundColor: egGradient,
                borderRadius: 8,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: tooltipConfig,
                datalabels: {
                    formatter: function(value) {
                        return new Intl.NumberFormat('tr-TR').format(value);
                    },
                    font: { size: 11, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    ...yAxisConfig,
                    ticks: {
                        callback: function(value) {
                            return (value / 1000).toFixed(0) + 'B';
                        }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // Otobüs Başına Günlük Ort. Biniş Chart
    const ctxEO = getCtx('eshotOtobusChart');
    const eoGradient = ctxEO?.createLinearGradient(0, 0, 0, 400);
    eoGradient?.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
    eoGradient?.addColorStop(1, 'rgba(251, 191, 36, 0.2)');

    if (ctxEO) new Chart(ctxEO, {
        type: 'bar',
        data: {
            labels: eshotAylar,
            datasets: [{
                label: 'Otobüs Başına Ort. Biniş',
                data: eshotOtobus,
                backgroundColor: eoGradient,
                borderRadius: 8,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: tooltipConfig,
                datalabels: {
                    formatter: function(value) {
                        return value;
                    },
                    font: { size: 13, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    ...yAxisConfig,
                    ticks: {
                        callback: function(value) { return value; }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
})();
