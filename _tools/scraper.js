const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const filesToParse = [
    'index.html',
    'kavramsal.html',
    'eshot.html',
    'izban.html',
    'kgm.html',
    'karsilastirma.html',
    'isbirlikleri.html'
];

let fullText = '';

for (const file of filesToParse) {
    if (!fs.existsSync(file)) continue;
    
    fullText += `\n\n================ PAGE: ${file} ================\n\n`;
    const html = fs.readFileSync(file, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Extract main content
    const main = document.querySelector('main') || document.body;
    
    const elements = main.querySelectorAll('h1, h2, h3, h4, p, li, .stat-value, .stat-label, table');
    for (const el of elements) {
        if (el.tagName.toLowerCase() === 'table') {
            fullText += '[TABLE DETECTED]\n';
        } else {
            const text = el.textContent.trim().replace(/\s+/g, ' ');
            if (text) {
                fullText += `${el.tagName}: ${text}\n`;
            }
        }
    }
}

fs.writeFileSync('portal_dump.txt', fullText, 'utf8');
console.log('Dump created in portal_dump.txt');
