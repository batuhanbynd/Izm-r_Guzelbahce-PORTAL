const fs = require('fs');
const oldHtml = fs.readFileSync('Havalimanlari_Yolcu_Trafigi.html', 'utf8');

const startStr = '<!-- KAVRAMSAL DİYAGRAM TAB -->';
const startIdx = oldHtml.indexOf(startStr);
const endIdx = oldHtml.indexOf('</main>', startIdx);
const kavramsalContent = oldHtml.substring(startIdx, endIdx);

let kgmHtml = fs.readFileSync('kgm.html', 'utf8');
const mainStart = kgmHtml.indexOf('<div id="kgm"');
const mainEnd = kgmHtml.indexOf('</main>');
const preMain = kgmHtml.substring(0, mainStart);
const postMain = kgmHtml.substring(mainEnd);

let newHtml = preMain + kavramsalContent + postMain;
newHtml = newHtml.replace('<a href="kgm.html" class="nav-link active"', '<a href="kgm.html" class="nav-link"');
newHtml = newHtml.replace('<script src="js/kgm.js"></script>', '<script src="js/kavramsal.js"></script>');

const kavramsalJs = fs.readFileSync('js/kavramsal.js', 'utf8');
const usesD3 = kavramsalJs.includes('d3.');
if (usesD3) {
    newHtml = newHtml.replace('</head>', '    <script src="https://d3js.org/d3.v7.min.js"></script>\n</head>');
}

// Write kavramsal.html
fs.writeFileSync('kavramsal.html', newHtml, 'utf8');
console.log('kavramsal.html created.');

// Now we need to add Kavramsal to the sidebar of ALL html files
const files = ['index.html', 'eshot.html', 'izban.html', 'karsilastirma.html', 'kgm.html', 'metro.html', 'tramvay.html', 'vapur.html', 'kavramsal.html'];
const sidebarLink = `            <li class="nav-item">
                <a href="kavramsal.html" class="nav-link" data-target="kavramsal">
                    <i class="fa-solid fa-network-wired"></i>
                    Kavramsal Diyagramlar
                </a>
            </li>
`;

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('kavramsal.html')) {
        // Find the last nav-item (which is KGM Karayolları)
        const insertIdx = content.indexOf('</ul>\r\n    </aside>');
        if (insertIdx !== -1) {
            content = content.substring(0, insertIdx) + sidebarLink + content.substring(insertIdx);
        } else {
            const insertIdx2 = content.indexOf('</ul>\n    </aside>');
            if (insertIdx2 !== -1) {
                content = content.substring(0, insertIdx2) + sidebarLink + content.substring(insertIdx2);
            }
        }
        
        if (file === 'kavramsal.html') {
            content = content.replace('<a href="kavramsal.html" class="nav-link"', '<a href="kavramsal.html" class="nav-link active"');
        }
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated sidebar in ${file}`);
    }
}
