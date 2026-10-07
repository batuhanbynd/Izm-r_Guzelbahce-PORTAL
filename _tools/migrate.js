const fs = require('fs');

const oldHtml = fs.readFileSync('Havalimanlari_Yolcu_Trafigi.html', 'utf8');
const oldLines = oldHtml.split('\n');

let startIndex = -1;
let endIndex = -1;
for (let i = 0; i < oldLines.length; i++) {
    if (oldLines[i].includes('<div class="route-accordion" id="eshotAccordion">')) {
        startIndex = i;
    }
    if (oldLines[i].includes('<!-- TRAMVAY TAB -->')) {
        endIndex = i - 7;
        break;
    }
}

const accordionLines = oldLines.slice(startIndex, endIndex + 1).join('\n');

let eshotHtml = fs.readFileSync('eshot.html', 'utf8');
const eshotLines = eshotHtml.split('\n');
let eshotStart = -1;
let eshotEnd = -1;
for (let i = 0; i < eshotLines.length; i++) {
    if (eshotLines[i].includes('<div class="route-accordion" id="eshotAccordion">')) {
        eshotStart = i;
    }
    if (eshotLines[i].includes('Nasıl Gidilir?')) {
        eshotEnd = i - 3;
        break;
    }
}

if (eshotStart !== -1 && eshotEnd !== -1) {
    eshotLines.splice(eshotStart, eshotEnd - eshotStart + 1, accordionLines);
    fs.writeFileSync('eshot.html', eshotLines.join('\n'));
    console.log('Successfully replaced accordion in eshot.html');
} else {
    console.log('Could not find replace bounds in eshot.html');
}

// Now extract the route guide from eshot.html
let eshotLines2 = fs.readFileSync('eshot.html', 'utf8').split('\n');
let removeStart = -1;
let removeEnd = -1;

for(let i=0; i<eshotLines2.length; i++) {
    if(eshotLines2[i].includes('Nasıl Gidilir?')) {
        removeStart = i;
    }
    if(removeStart !== -1 && eshotLines2[i].includes('</main>')) {
        removeEnd = i - 2; // Right before closing divs
        break;
    }
}

let extractedRouteInfo = [];
if(removeStart !== -1 && removeEnd !== -1) {
    // Also include the </div></div> before the comment if we want, but let's just grab the actual route elements
    extractedRouteInfo = eshotLines2.slice(removeStart, removeEnd + 1);
    eshotLines2.splice(removeStart, removeEnd - removeStart + 1);
    fs.writeFileSync('eshot.html', eshotLines2.join('\n'));
    console.log('Removed route info from eshot.html');
}

// Now add it to index.html
if(extractedRouteInfo.length > 0) {
    let indexHtml = fs.readFileSync('index.html', 'utf8');
    let indexLines = indexHtml.split('\n');
    let insertIdx = -1;
    for(let i=0; i<indexLines.length; i++) {
        if(indexLines[i].includes('</main>')) {
            insertIdx = i - 2;
            break;
        }
    }
    if(insertIdx !== -1) {
        indexLines.splice(insertIdx, 0, ...extractedRouteInfo);
        fs.writeFileSync('index.html', indexLines.join('\n'));
        console.log('Added route info to index.html');
    }
}
