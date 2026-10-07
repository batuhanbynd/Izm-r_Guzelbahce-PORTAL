const fs = require('fs');
const path = require('path');

const htmlFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the link href and text
    content = content.replace(
        /<a href="75-yil-bulvari\.html" class="nav-link(.*?)">\s*<i class="fa-solid fa-route"><\/i>\s*75\. Yıl Bulvarı\s*<\/a>/g,
        '<a href="planlanan-projeler.html" class="nav-link$1" data-target="planlanan">\n                    <i class="fa-solid fa-building"></i>\n                    Planlanan Projeler\n                </a>'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated link in ${file}`);
});
