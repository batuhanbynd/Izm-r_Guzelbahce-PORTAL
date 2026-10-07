const fs = require('fs');

const htmlFiles = [
    'index.html', 'eshot.html', 'izban.html', 'kavramsal.html', 
    'kgm.html', 'karsilastirma.html', 'isbirlikleri.html', 
    'metro.html', 'tramvay.html', 'vapur.html', 'Havalimanlari_Yolcu_Trafigi.html'
];

htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        const linkToInject = `            <li class="nav-item">
                <a href="izsu.html" class="nav-link" data-target="izsu">
                    <i class="fa-solid fa-droplet"></i>
                    İZSU Su Kaynakları
                </a>
            </li>\n`;
        
        if (!content.includes('izsu.html')) {
            // Find the isbirlikleri list item
            const regex = /(<li class="nav-item">\s*<a href="isbirlikleri\.html")/i;
            content = content.replace(regex, linkToInject + '$1');
            fs.writeFileSync(file, content, 'utf8');
        }
    }
});
console.log("Nav links FIXED.");
