const fs = require('fs');
const path = require('path');
const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
const allFiles = fs.readdirSync(__dirname);
let errors = [];

htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // Check images
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
        const src = imgMatch[1];
        if (!src.startsWith('http') && !src.startsWith('data:')) {
            if (!allFiles.includes(src) && !fs.existsSync(path.join(__dirname, src))) {
                errors.push("Broken image link in " + file + ": " + src);
            }
        }
    }

    // Check links
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
        const href = linkMatch[1];
        if (!href.startsWith('http') && !href.startsWith('#') && href.endsWith('.html')) {
            if (!allFiles.includes(href)) {
                errors.push("Broken href in " + file + ": " + href);
            }
        }
    }
    
    // Check CSS
    if (!content.includes('styles.css')) {
        errors.push("styles.css missing in " + file);
    }

    // Check Data-Targets
    const dataTargetRegex = /data-target=["']([^"']+)["']/g;
    let dtMatch;
    let targets = [];
    while ((dtMatch = dataTargetRegex.exec(content)) !== null) {
        targets.push(dtMatch[1]);
    }
    
    // Check main content div id matching data-target
    const idRegex = /<div id=["']([^"']+)["'] class="tab-pane active"/;
    const idMatch = idRegex.exec(content);
    if (idMatch) {
        // Ensure there's a link pointing to this id, though some pages might use an a tag.
        // Actually, since they are separate files, the link for "this" page should have data-target that matches the id.
        const currentTarget = idMatch[1];
        if (!content.includes('data-target="' + currentTarget + '"')) {
            // Check if there is data-target="planlanan" but id is "75yil" or something
            if (file === 'planlanan-projeler.html') {
                if (currentTarget === '75yil' && !content.includes('data-target="75yil"')) {
                    errors.push("Data-target mismatch in " + file + ": ID is " + currentTarget);
                }
            }
        }
    }
});

if (allFiles.includes('75-yil-bulvari.html')) {
    errors.push('WARNING: 75-yil-bulvari.html still exists. You may want to delete it to avoid confusion since it was renamed to planlanan-projeler.html');
}

console.log(errors.length ? errors.join('\n') : 'No broken links, missing images, or data-target issues found.');
