const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'eshot.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the old text with the new one globally
const oldText = 'A\u015fa\u011f\u0131daki haritada her durak noktas\u0131 etraf\u0131ndaki <strong style="color: var(--accent-1);">y\u00fcr\u00fcme mesafesi \u00e7aplar\u0131</strong> g\u00f6sterilmektedir. Ye\u015fil daireler yak\u0131n eri\u015fim (400 metre), siyah daireler orta eri\u015fim (800 metre) alan\u0131n\u0131 temsil eder.';
const newText = 'A\u015fa\u011f\u0131daki haritada her durak noktas\u0131 etraf\u0131ndaki <strong style="color: var(--accent-1);">400 metrelik y\u00fcr\u00fcme mesafesi \u00e7aplar\u0131</strong> g\u00f6sterilmektedir.';

content = content.split(oldText).join(newText);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Text updated successfully.');
