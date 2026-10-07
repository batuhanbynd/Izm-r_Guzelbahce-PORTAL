const fs = require('fs');
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix duplicate data-target
    if (content.includes('data-target="75yil" data-target="planlanan"')) {
        content = content.replace(/data-target="75yil" data-target="planlanan"/g, 'data-target="planlanan"');
        changed = true;
    }

    // Fix main container ID for Planlanan Projeler
    if (file === 'planlanan-projeler.html' && content.includes('<div id="75yil" class="tab-pane active">')) {
        content = content.replace('<div id="75yil" class="tab-pane active">', '<div id="planlanan" class="tab-pane active">');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
    }
});
