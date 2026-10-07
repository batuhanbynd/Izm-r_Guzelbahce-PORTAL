const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFile = path.join(dir, 'eshot.html');
let htmlContent = fs.readFileSync(htmlFile, 'utf8');

const routes = ['8', '28', '82', '684', '762'];

routes.forEach(route => {
    const oldName = `${route}cap.jpg`;
    const newName = `${route}cap_v2.jpg`;
    
    // Rename file if exists
    if (fs.existsSync(path.join(dir, oldName))) {
        fs.renameSync(path.join(dir, oldName), path.join(dir, newName));
    }
    
    // Update HTML
    htmlContent = htmlContent.split(`"${oldName}"`).join(`"${newName}"`);
});

fs.writeFileSync(htmlFile, htmlContent, 'utf8');
console.log('Cache busted successfully');
