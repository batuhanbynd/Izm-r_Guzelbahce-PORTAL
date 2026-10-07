const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// Advanced Body Background Animation
if (!css.includes('ambient-background')) {
    css += `
/* ====================================================
   ULTRA PREMIUM ANIMATIONS & EFFECTS
   ==================================================== */

/* Ambient Moving Background */
@keyframes ambient-background {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

body {
    background: linear-gradient(-45deg, #0f172a, #1e1b4b, #020617, #171033);
    background-size: 400% 400%;
    animation: ambient-background 25s ease infinite;
}

/* Staggered 3D Fade-Up with Blur */
@keyframes fadeUpPro {
    0% { 
        opacity: 0; 
        transform: translateY(40px) scale(0.98); 
        filter: blur(12px); 
    }
    100% { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
        filter: blur(0); 
    }
}

.card, .stat-card, .tab-pane, .stage-box, .premium-card {
    animation: fadeUpPro 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
}

/* Add staggered delays based on nth-child dynamically */
.stat-card:nth-child(1) { animation-delay: 0.1s !important; }
.stat-card:nth-child(2) { animation-delay: 0.2s !important; }
.stat-card:nth-child(3) { animation-delay: 0.3s !important; }
.card:nth-child(1) { animation-delay: 0.4s !important; }
.card:nth-child(2) { animation-delay: 0.5s !important; }
.card:nth-child(3) { animation-delay: 0.6s !important; }

/* Glare (Shine) Effect on Cards */
.card::after, .stat-card::after, .premium-card::after, .stage-box::after {
    content: '';
    position: absolute;
    top: 0;
    left: -200%;
    width: 50%;
    height: 100%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
    transform: skewX(-25deg);
    transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
    z-index: 2;
    pointer-events: none;
}

.card:hover::after, .stat-card:hover::after, .premium-card:hover::after, .stage-box:hover::after {
    left: 200%;
}

/* Sidebar Ultra Hover */
.nav-link {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid transparent;
}
.nav-link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.15), transparent);
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: -1;
    border-radius: 12px;
}
.nav-link:hover::before {
    width: 100%;
}
.nav-link:hover {
    letter-spacing: 0.5px;
    border: 1px solid rgba(56, 189, 248, 0.2);
    box-shadow: 0 5px 15px rgba(56, 189, 248, 0.1);
}

/* Interactive Image Container Extra Smooth */
.interactive-image-container img {
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s ease;
}
.interactive-image-container:hover img {
    transform: scale(1.05);
    filter: brightness(1.1);
}

/* Pulsing Dots / Notification Badges */
.pulse-badge {
    position: relative;
    overflow: visible;
}
.pulse-badge::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
    animation: professional-pulse 2.5s infinite cubic-bezier(0.66, 0, 0, 1);
}
@keyframes professional-pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
    100% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
}

/* Header Text Gradient Shimmer */
header h1 {
    background: linear-gradient(90deg, var(--text-main), var(--accent-1), var(--text-main));
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: textShimmer 5s linear infinite;
}
@keyframes textShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
}

`;
    fs.writeFileSync('styles.css', css, 'utf8');
    console.log('Advanced CSS animations applied globally.');
} else {
    console.log('Animations already exist.');
}
