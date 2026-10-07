const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'eshot.html');
let content = fs.readFileSync(filePath, 'utf8');

// The original text to be replaced
const oldText = '800 metrelik y\u00fcr\u00fcme mesafesi \u00e7aplar\u0131';
const newText = '400 metrelik y\u00fcr\u00fcme mesafesi yar\u0131\u00e7ap\u0131';

content = content.split(oldText).join(newText);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated to 400 metrelik yaricapi');
