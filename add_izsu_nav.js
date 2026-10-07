const fs = require('fs');

const htmlFiles = [
    'index.html', 'eshot.html', 'izban.html', 'kavramsal.html', 
    'kgm.html', 'karsilastirma.html', 'isbirlikleri.html', 
    'metro.html', 'tramvay.html', 'vapur.html', 'Havalimanlari_Yolcu_Trafigi.html'
];

htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Add İZSU to the sidebar
        const linkToInject = `\n            <a href="izsu.html" class="nav-item">
                <i class="fa-solid fa-droplet"></i>
                <span>Su Kaynakları (İZSU)</span>
            </a>`;
        
        // Only inject if it doesn't already exist
        if (!content.includes('izsu.html')) {
            // Find the last nav-item or isbirlikleri and insert before it or after
            content = content.replace(/(<a href="isbirlikleri\.html" class="nav-item".*?<\/a>)/s, `$1${linkToInject}`);
            fs.writeFileSync(file, content, 'utf8');
        }
    }
});
console.log("Nav links updated.");
