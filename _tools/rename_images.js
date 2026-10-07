const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('cap.jpg.jpeg')) {
        const oldPath = path.join(dir, file);
        const newPath = path.join(dir, file.replace('.jpeg', ''));
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed ${file} to ${path.basename(newPath)}`);
    }
});
