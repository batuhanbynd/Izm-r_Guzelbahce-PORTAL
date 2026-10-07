const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'eshot.html');
let content = fs.readFileSync(filePath, 'utf8');

content = content.split('9cap.jpg').join('9cap_v2.jpg');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated 9cap.jpg to 9cap_v2.jpg');
