const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'styles.css');
let css = fs.readFileSync(cssFile, 'utf8');

// Update .card
css = css.replace(/\.card\s*\{[^}]+\}/, `.card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 1.5rem;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    animation: fadeUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, rgba(56, 189, 248, 0.15), transparent 60%);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
    z-index: 0;
}
.card > * {
    position: relative;
    z-index: 1;
}`);

// Update .card:hover
css = css.replace(/\.card:hover\s*\{[^}]+\}/, `.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px -5px rgba(56, 189, 248, 0.3);
    border-color: rgba(56, 189, 248, 0.5);
}
.card:hover::before {
    opacity: 1;
}`);

// Update .stat-card
css = css.replace(/\.stat-card\s*\{[^}]+\}/, `.stat-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
    border: 1px solid rgba(129, 140, 248, 0.3);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    backdrop-filter: blur(12px);
    position: relative;
    overflow: hidden;
    transition: all 0.4s ease;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    animation: fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.stat-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: skewX(-20deg);
    transition: 0.5s;
}
.stat-card:hover {
    transform: translateY(-5px);
    border-color: var(--accent-1);
    box-shadow: 0 15px 30px rgba(56, 189, 248, 0.2);
}
.stat-card:hover::after {
    left: 150%;
}`);

// Add fadeUp animation if it doesn't exist
if (!css.includes('@keyframes fadeUp')) {
    css += `
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}`;
}

// Update .nav-link.active
css = css.replace(/\.nav-link\.active\s*\{[^}]+\}/, `.nav-link.active {
    color: var(--text-main);
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.1));
    border-left: 4px solid var(--accent-1);
    box-shadow: inset 0 0 20px rgba(56, 189, 248, 0.1);
}`);

// Enhance body background for a deeper, more professional look
css = css.replace(/background: radial-gradient\(circle at top left, #1e1b4b, #0f172a 40%, #020617\);/, `background: radial-gradient(circle at top left, #171033, #0b1120 40%, #020617);
    background-attachment: fixed;`);

fs.writeFileSync(cssFile, css, 'utf8');
console.log("CSS Premium overhauls applied to styles.css");

// Update all HTML files to replace "fa-building" with "fa-layer-group" for Planlanan Projeler logo
const htmlFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    const htmlPath = path.join(__dirname, file);
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    let modified = false;
    // Replace fa-building with fa-layer-group for the sidebar item
    if (htmlContent.includes('<i class="fa-solid fa-building"></i>')) {
        htmlContent = htmlContent.replace(/<i class="fa-solid fa-building"><\/i>/g, '<i class="fa-solid fa-layer-group"></i>');
        modified = true;
    }
    
    // Also replace in header of planlanan-projeler.html
    if (file === 'planlanan-projeler.html' && htmlContent.includes('<i class="fa-solid fa-road-bridge"')) {
        htmlContent = htmlContent.replace(/<i class="fa-solid fa-road-bridge" style="color: var\(--accent-1\); margin-right: 10px;"><\/i>/, '<i class="fa-solid fa-layer-group" style="color: var(--accent-1); margin-right: 10px;"></i>');
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log("Updated Planlanan Projeler logo in " + file);
    }
});
