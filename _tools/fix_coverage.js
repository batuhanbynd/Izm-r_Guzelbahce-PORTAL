const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'eshot.html');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Coverage block template generator
function coverageBlock(hatNo, imgSrc) {
    return [
        '',
        '                                    <div class="coverage-container" style="width: 100%; margin-top: 1rem;">',
        '                                        <h3 style="display: flex; align-items: center; gap: 10px; color: var(--text-main); font-size: 1.15rem; margin-bottom: 1rem;">',
        '                                            <i class="fa-solid fa-circle-nodes" style="color: var(--accent-2);"></i>',
        `                                            ${hatNo} NO'lu Hat \u2013 Durak Ula\u015f\u0131m \u00c7aplar\u0131 (Coverage Area)`,
        '                                        </h3>',
        '                                        <div style="background: rgba(129, 140, 248, 0.08); border: 1px solid rgba(129, 140, 248, 0.2); border-radius: 12px; padding: 1rem;">',
        '                                            <p style="margin: 0 0 1rem 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">',
        '                                                <i class="fa-solid fa-info-circle" style="color: var(--accent-2); margin-right: 8px;"></i>',
        '                                                A\u015fa\u011f\u0131daki haritada her durak noktas\u0131 etraf\u0131ndaki <strong style="color: var(--accent-1);">y\u00fcr\u00fcme mesafesi \u00e7aplar\u0131</strong> g\u00f6sterilmektedir. Ye\u015fil daireler yak\u0131n eri\u015fim (~300m), gri daireler orta eri\u015fim (~500m) alan\u0131n\u0131 temsil eder.',
        '                                            </p>',
        `                                            <div class="interactive-image-container" onclick="openImageModal(this.querySelector('img').src)" style="border-radius: 10px; overflow: hidden;">`,
        `                                                <img src="${imgSrc}" alt="${hatNo} Numaral\u0131 Hat Durak Ula\u015f\u0131m \u00c7aplar\u0131" style="width:100%; display:block;">`,
        '                                                <div class="image-overlay"><i class="fa-solid fa-expand"></i> Ula\u015f\u0131m \u00c7ap\u0131 Haritas\u0131n\u0131 A\u00e7 / B\u00fcy\u00fct</div>',
        '                                            </div>',
        '                                        </div>',
        '                                    </div>',
    ];
}

// Step 1: Find and remove all existing coverage blocks
// They start with "coverage-container" and end 16 lines later
let coverageStarts = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('coverage-container')) {
        coverageStarts.push(i);
    }
}

// Remove from bottom to top to preserve indices
for (let idx = coverageStarts.length - 1; idx >= 0; idx--) {
    let start = coverageStarts[idx];
    // Check if there's an empty line before
    if (start > 0 && lines[start - 1].trim() === '') {
        start = start - 1;
    }
    // Find end: coverage container is 16 content lines, find closing </div> x3
    let end = coverageStarts[idx];
    let divCount = 0;
    for (let j = coverageStarts[idx]; j < lines.length; j++) {
        if (lines[j].includes('coverage-container')) divCount++;
        // Count closing divs for this container
        if (lines[j].trim() === '</div>' && j > coverageStarts[idx]) {
            // Check if this is the outermost closing div of coverage-container
        }
    }
    // Simpler: coverage block is always 17 lines (including empty line before)
    // Let's count: from the empty line to the last </div> of coverage
    end = coverageStarts[idx] + 15; // 16 lines of content
    if (start === coverageStarts[idx] - 1) {
        // includes empty line
        lines.splice(start, end - start + 1);
    } else {
        lines.splice(coverageStarts[idx], 16);
    }
}

// Step 2: Now insert coverage blocks BEFORE each stops-container
// Map hat numbers to image files and find stops-container positions
const hatConfigs = [
    { hatNo: '8', imgSrc: '8cap.jpg', stopsMarker: "8 NO'lu Hatt" },
    { hatNo: '9', imgSrc: '9cap.jpg', stopsMarker: "9 NO'lu Hatt" },
    { hatNo: '28', imgSrc: '28cap.jpg', stopsMarker: "28 NO'lu Hatt" },
    { hatNo: '82', imgSrc: '82cap.jpg', stopsMarker: "82 NO'lu Hatt" },
    { hatNo: '762', imgSrc: '762cap.jpg', stopsMarker: "762 NO'lu Hatt" },
    { hatNo: '684', imgSrc: '684cap.jpg', stopsMarker: "684 NO'lu Hatt" },
];

// Find stops-container positions (from bottom to top to preserve indices)
let insertions = [];
for (const config of hatConfigs) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('stops-container') && i + 1 < lines.length && lines[i + 1].includes(config.stopsMarker)) {
            insertions.push({ index: i, ...config });
            break;
        }
    }
}

// Sort by index descending to insert from bottom to top
insertions.sort((a, b) => b.index - a.index);

for (const ins of insertions) {
    const block = coverageBlock(ins.hatNo, ins.imgSrc);
    lines.splice(ins.index, 0, ...block);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done! Coverage blocks moved above stops containers.');
console.log('Insertions made at:', insertions.map(i => `Hat ${i.hatNo} at line ${i.index}`).join(', '));
