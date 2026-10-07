const fs = require('fs');

// Ana kaynak dosyayı oku
let sourceHtml = fs.readFileSync('Havalimanlari_Yolcu_Trafigi.html', 'utf8');

const tabs = ['havalimani', 'eshot', 'tramvay', 'izban', 'vapur', 'metro', 'karsilastirma', 'kgm'];

// Her tab'ın hangi JS dosyasını kullanacağı
const tabScripts = {
    havalimani: ['js/havalimani.js'],
    eshot: ['js/eshot.js'],
    tramvay: ['js/tramvay.js'],
    izban: ['js/izban.js'],
    vapur: ['js/vapur.js'],
    metro: ['js/metro.js'],
    karsilastirma: ['js/karsilastirma.js'],
    kgm: ['js/kgm.js']
};

// HTML tab içeriklerini çıkart
const mainStart = sourceHtml.indexOf('<main class="main-content">') + '<main class="main-content">'.length;
const mainEnd = sourceHtml.indexOf('</main>');

const tabHtmls = {};
for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i];
    const start = sourceHtml.indexOf('<div id="' + t + '"');
    let end = mainEnd;
    if (i < tabs.length - 1) {
        const nextTab = tabs[i+1];
        let nextStart = sourceHtml.indexOf('<div id="' + nextTab + '"');
        let commentStart = sourceHtml.lastIndexOf('<!--', nextStart);
        if (commentStart > start && commentStart < nextStart) {
            end = commentStart;
        } else {
            end = nextStart;
        }
    }
    tabHtmls[t] = sourceHtml.substring(start, end).trim();
}

// Sidebar HTML oluştur (her sayfa için link'li)
function buildSidebar(activeTab) {
    const items = [
        { id: 'havalimani', icon: 'fa-plane-departure', label: 'Adnan Menderes', file: 'index.html' },
        { id: 'eshot', icon: 'fa-bus', label: 'ESHOT', file: 'eshot.html' },
        { id: 'tramvay', icon: 'fa-train-tram', label: 'Tramvay', file: 'tramvay.html' },
        { id: 'izban', icon: 'fa-train', label: 'İZBAN', file: 'izban.html' },
        { id: 'vapur', icon: 'fa-ship', label: 'Vapur (İzdeniz)', file: 'vapur.html' },
        { id: 'metro', icon: 'fa-subway', label: 'İzmir Metro', file: 'metro.html' },
        { id: 'karsilastirma', icon: 'fa-chart-pie', label: 'Ulaşım Karşılaştırması', file: 'karsilastirma.html' },
        { id: 'kgm', icon: 'fa-road', label: 'KGM Karayolları', file: 'kgm.html' }
    ];

    let html = '';
    items.forEach(item => {
        const active = item.id === activeTab ? ' active' : '';
        html += `            <li class="nav-item">
                <a href="${item.file}" class="nav-link${active}" data-target="${item.id}">
                    <i class="fa-solid ${item.icon}"></i>
                    ${item.label}
                </a>
            </li>\n`;
    });
    return html;
}

// Her tab için sayfa üret
tabs.forEach(t => {
    const filename = t === 'havalimani' ? 'index.html' : t + '.html';
    
    // Tab HTML'ini active yap
    let tabContent = tabHtmls[t];
    tabContent = tabContent.replace(
        '<div id="' + t + '" class="tab-pane">',
        '<div id="' + t + '" class="tab-pane active">'
    );
    // Zaten active ise dokunma
    if (!tabContent.includes('tab-pane active')) {
        tabContent = tabContent.replace('class="tab-pane"', 'class="tab-pane active"');
    }

    // Script tag'leri
    const scripts = tabScripts[t].map(s => `    <script src="${s}"></script>`).join('\n');

    const pageHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BAS PORTAL</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="brand">BAS PORTAL</div>
        <ul class="nav-menu">
${buildSidebar(t)}        </ul>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        ${tabContent}
    </main>

    <script src="js/chart-config.js"></script>
${scripts}
</body>
</html>
`;

    fs.writeFileSync(filename, pageHtml);
    console.log('✅ Created ' + filename + ' (' + (pageHtml.length / 1024).toFixed(1) + ' KB)');
});

console.log('\n🎉 Tüm sayfalar başarıyla oluşturuldu!');
