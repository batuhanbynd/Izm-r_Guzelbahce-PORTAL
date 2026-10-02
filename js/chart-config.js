// =============================================
// Chart.js Ortak Konfigürasyon
// =============================================

// Accordion Toggle Function
function toggleAccordion(header) {
    const item = header.parentElement;
    const content = item.querySelector('.accordion-content');
    
    if (item.classList.contains('active')) {
        item.classList.remove('active');
        content.style.maxHeight = null;
    } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

// Chart.js Defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Outfit', sans-serif";

// Global DataLabels Plugin Registration
Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
    color: '#f8fafc',
    font: { weight: 'bold', size: 12 },
    anchor: 'end',
    align: 'top',
    offset: 4,
    formatter: function(value) {
        if (value === null || value === undefined) return '';
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(0) + 'B';
        if (typeof value === 'number' && value < 100 && value > -100 && value % 1 !== 0) return value.toFixed(1) + '%';
        return new Intl.NumberFormat('tr-TR').format(value);
    }
});

const tooltipConfig = {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    titleColor: '#f8fafc',
    bodyColor: '#e2e8f0',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 12,
    boxPadding: 6,
    cornerRadius: 8,
    callbacks: {
        label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('tr-TR').format(context.parsed.y);
            }
            return label;
        }
    }
};

const yAxisConfig = {
    beginAtZero: true,
    grid: { color: 'rgba(255, 255, 255, 0.05)' },
    ticks: {
        callback: function(value) {
            return value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(0) + 'B';
        }
    }
};

// Helper: Güvenli canvas context alma
function getCtx(id) {
    const el = document.getElementById(id);
    return el ? el.getContext('2d') : null;
}
