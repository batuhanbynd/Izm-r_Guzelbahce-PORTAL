const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'eshot.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the old text with the new one globally
const oldText = "Yeşil daireler yakın erişim (~300m), gri daireler orta erişim (~500m) alanını temsil eder.";
const newText = "Yeşil daireler yakın erişim (400 metre), siyah daireler orta erişim (800 metre) alanını temsil eder.";

content = content.split(oldText).join(newText);

// Save the updated HTML
fs.writeFileSync(filePath, content, 'utf8');
console.log('Text updated successfully.');
