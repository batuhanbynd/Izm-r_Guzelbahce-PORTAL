const fs = require('fs');
const files = fs.readdirSync(__dirname + '/..').filter(f => f.endsWith('.html') && f !== 'Guzelbahce_Rapor.html');
const faviconHtml = '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏢</text></svg>">';

files.forEach(file => {
    let content = fs.readFileSync(__dirname + '/../' + file, 'utf8');
    let changed = false;

    // Fix Planlanan Projeler Title
    if (file === 'planlanan-projeler.html' && content.includes('<title>BAS PORTAL - 75. Yıl Cumhuriyet Bulvarı</title>')) {
        content = content.replace('<title>BAS PORTAL - 75. Yıl Cumhuriyet Bulvarı</title>', '<title>BAS PORTAL - Planlanan Projeler</title>');
        changed = true;
    }

    // Add favicon if missing
    if (!content.includes('rel="icon"')) {
        content = content.replace('</head>', '    ' + faviconHtml + '\n</head>');
        changed = true;
    }

    // Clean up empty style attributes
    if (content.includes('style=""')) {
        content = content.replace(/ style=""/g, '');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(__dirname + '/../' + file, content, 'utf8');
        console.log('Polished ' + file);
    }
});
