const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'eshot.html');
let content = fs.readFileSync(filePath, 'utf8');

content = content.split('400 metrelik y\u00fcr\u00fcme').join('800 metrelik y\u00fcr\u00fcme');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated 400 to 800 successfully.');
