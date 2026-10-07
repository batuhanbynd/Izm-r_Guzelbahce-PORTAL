document.addEventListener('DOMContentLoaded', function() {
    Chart.register(ChartDataLabels);

    // 0. Su Üretim / Baraj Doluluk Grafiği (su1.jpg.png yerine)
    const ctxSu1 = document.getElementById('su1Chart').getContext('2d');
    
    // Veriler: tahtalı 43, balçova 47, ürkmez 61, gördes 29, alaçatı 48
    window.su1ChartInstance = new Chart(ctxSu1, {
        type: 'bar',
        data: {
            labels: ['Tahtalı Barajı', 'Balçova Barajı', 'Ürkmez Barajı', 'Gördes Barajı', 'Alaçatı Barajı'],
            datasets: [{
                label: 'Aktif Doluluk Oranı (%)',
                data: [43, 47, 61, 29, 48],
                backgroundColor: [
                    'rgba(56, 189, 248, 0.7)',
                    'rgba(52, 211, 153, 0.7)',
                    'rgba(251, 191, 36, 0.7)',
                    'rgba(244, 63, 94, 0.7)',
                    'rgba(167, 139, 250, 0.7)'
                ],
                borderColor: [
                    'rgba(56, 189, 248, 1)',
                    'rgba(52, 211, 153, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(244, 63, 94, 1)',
                    'rgba(167, 139, 250, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Etiketler zaten bar isimlerinde yazıyor
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' Doluluk: %' + context.raw;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 16 },
                    anchor: 'end',
                    align: 'bottom',
                    formatter: (value) => {
                        return '%' + value;
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#94a3b8',
                        callback: function(value) {
                            return '%' + value;
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#e2e8f0', font: { size: 13, weight: '600' } }
                }
            }
        }
    });


    // 1. Balçova Barajı Hacim Analizi (Doughnut)
    const ctxBalcova = document.getElementById('balcovaChart').getContext('2d');
    
    // Veriler (Milyon m3)
    const maxHacim = 7.759;
    const toplamSu = 3.811;
    const kullanilabilir = 3.674;
    const kullanilamayan = (toplamSu - kullanilabilir).toFixed(3);
    const bosHacim = (maxHacim - toplamSu).toFixed(3);

    new Chart(ctxBalcova, {
        type: 'doughnut',
        data: {
            labels: ['Kullanılabilir Su', 'Kullanılamayan (Dip Suyu)', 'Boş Hacim'],
            datasets: [{
                data: [kullanilabilir, kullanilamayan, bosHacim],
                backgroundColor: [
                    'rgba(14, 165, 233, 0.8)', // Mavi (Kullanılabilir)
                    'rgba(99, 102, 241, 0.6)',  // Mor-Mavi (Dip suyu)
                    'rgba(30, 41, 59, 0.5)'     // Koyu gri (Boş)
                ],
                borderColor: [
                    'rgba(14, 165, 233, 1)',
                    'rgba(99, 102, 241, 1)',
                    'rgba(255, 255, 255, 0.1)'
                ],
                borderWidth: 1,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', padding: 20, font: { family: "'Outfit', sans-serif" } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.label + ': ' + context.raw + ' Milyon m³';
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, context) => {
                        if (value < 1) return '';
                        let percentage = ((value / maxHacim) * 100).toFixed(1) + "%";
                        return percentage;
                    }
                }
            }
        }
    });

    // 2. Su Kaynakları Sayısal Dağılımı (Türlere Göre)
    const ctxKaynak = document.getElementById('kaynakChart').getContext('2d');
    
    new Chart(ctxKaynak, {
        type: 'polarArea',
        data: {
            labels: ['Yüzeysel (Barajlar)', 'Yeraltı (Kuyular)'],
            datasets: [{
                data: [3, 5], // 3 baraj, 5 kuyu grubu
                backgroundColor: [
                    'rgba(59, 130, 246, 0.6)',  // Yüzeysel
                    'rgba(16, 185, 129, 0.6)'   // Yeraltı
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    ticks: { display: false },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', padding: 20, font: { family: "'Outfit', sans-serif" } }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 16 },
                    formatter: (value) => {
                        return value + ' Kaynak';
                    }
                }
            }
        }
    });
});
