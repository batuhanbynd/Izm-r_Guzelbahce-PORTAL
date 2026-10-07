const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'index.html', 'eshot.html', 'izban.html', 'kavramsal.html', 
    'kgm.html', 'karsilastirma.html', 'isbirlikleri.html', 
    'metro.html', 'tramvay.html', 'vapur.html', 'izsu.html'
];

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        const linkToInject = `\n            <li class="nav-item">
                <a href="75-yil-bulvari.html" class="nav-link" data-target="75yil">
                    <i class="fa-solid fa-route"></i>
                    75. Yıl Bulvarı
                </a>
            </li>`;
        
        // Only inject if it doesn't already exist
        if (!content.includes('75-yil-bulvari.html')) {
            // Find the last nav-item or isbirlikleri and insert before it
            content = content.replace(/(<li class="nav-item">\s*<a href="isbirlikleri\.html")/s, `${linkToInject}\n            $1`);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
console.log("Nav links for 75 Yıl Bulvarı updated.");
