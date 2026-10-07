const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// We will remove the exaggerated 3D blur fade-up and delays.
// Let's replace the fadeUpPro and stagger delays with a simple subtle fade.

const removalRegex = /\/\* Staggered 3D Fade-Up with Blur \*\/[\s\S]*?(?=\/\* Glare \(Shine\) Effect on Cards \*\/)/;
css = css.replace(removalRegex, `/* Subtle Clean Fade-In */
@keyframes subtleFadeIn {
    0% { 
        opacity: 0; 
        transform: translateY(10px); 
    }
    100% { 
        opacity: 1; 
        transform: translateY(0); 
    }
}

.card, .stat-card, .tab-pane, .stage-box, .premium-card {
    animation: subtleFadeIn 0.5s ease-out forwards !important;
}

`);

// Let's also tone down the Shimmer Text if it's too much, but maybe leave it.
// The user mainly complained about "hepsinin tek tek zıplaması" (all of them jumping one by one).

fs.writeFileSync('styles.css', css, 'utf8');
console.log('Toned down animations to be clean and professional.');
