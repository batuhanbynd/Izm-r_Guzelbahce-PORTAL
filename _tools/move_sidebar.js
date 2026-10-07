const fs = require('fs');

const files = [
    'index.html', 'eshot.html', 'izban.html', 'karsilastirma.html', 
    'kgm.html', 'metro.html', 'tramvay.html', 'vapur.html', 'kavramsal.html'
];

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove the old Kavramsal nav-item completely
    // It looks like:
    //             <li class="nav-item">
    //                 <a href="kavramsal.html" class="nav-link" data-target="kavramsal">
    //                     <i class="fa-solid fa-network-wired"></i>
    //                     Kavramsal Diyagramlar
    //                 </a>
    //             </li>
    // Or with "nav-link active" for kavramsal.html
    
    // We can use a regex to remove it
    const regex = /[ \t]*<li class="nav-item">\s*<a href="kavramsal\.html" class="nav-link(?: active)?" data-target="kavramsal">\s*<i class="fa-solid fa-network-wired"><\/i>\s*Kavramsal Diyagramlar\s*<\/a>\s*<\/li>\r?\n?/g;
    
    content = content.replace(regex, '');

    // Now define the new block
    const isActive = file === 'kavramsal.html' ? 'nav-link active' : 'nav-link';
    const newBlock = `            <li class="nav-item">
                <a href="kavramsal.html" class="${isActive}" data-target="kavramsal">
                    <i class="fa-solid fa-network-wired"></i>
                    Diyagramlar
                </a>
            </li>\n`;

    // Insert right after <ul class="nav-menu">
    const insertPoint = '<ul class="nav-menu">';
    const insertIdx = content.indexOf(insertPoint);
    
    if (insertIdx !== -1) {
        // we add the length of the insert point, plus optionally \r\n
        let offset = insertIdx + insertPoint.length;
        if (content[offset] === '\r') offset++;
        if (content[offset] === '\n') offset++;
        
        content = content.substring(0, offset) + newBlock + content.substring(offset);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated sidebar in ${file}`);
    } else {
        console.log(`Could not find nav-menu in ${file}`);
    }
}
