const fs = require('fs');
const path = require('path');

// SVG 1: Icon Only (The Compass + Mountain + T Emblem)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="trxGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="50%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#15803D" />
    </linearGradient>

    <linearGradient id="trxMntDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#166534" />
      <stop offset="100%" stop-color="#052E16" />
    </linearGradient>

    <linearGradient id="trxLimeBright" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#A7F3D0" />
      <stop offset="100%" stop-color="#22C55E" />
    </linearGradient>

    <linearGradient id="trxOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FB923C" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>

    <filter id="trxGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Glow Circle -->
  <circle cx="100" cy="100" r="86" fill="#15803D" opacity="0.12" />

  <!-- Outer Compass Ring (Left & Right Arcs) -->
  <path d="M 84 22 A 78 78 0 0 0 22 100 A 78 78 0 0 0 84 178" fill="none" stroke="url(#trxGradGreen)" stroke-width="9" stroke-linecap="round" />
  <path d="M 116 22 A 78 78 0 0 1 178 100 A 78 78 0 0 1 116 178" fill="none" stroke="url(#trxGradGreen)" stroke-width="9" stroke-linecap="round" />

  <!-- Top Compass Pointer (North Arrow) -->
  <polygon points="100,5 112,26 100,21 88,26" fill="url(#trxOrangeGrad)" filter="url(#trxGlow)" />

  <!-- Bottom Compass Pointer (South Arrow) -->
  <polygon points="100,195 112,174 100,179 88,174" fill="url(#trxOrangeGrad)" filter="url(#trxGlow)" />

  <!-- Faceted Mountain Peaks -->
  <polygon points="48,82 72,46 94,82" fill="url(#trxLimeBright)" />
  <polygon points="72,46 94,82 72,82" fill="url(#trxMntDark)" />

  <polygon points="68,82 100,30 132,82" fill="url(#trxGradGreen)" />
  <polygon points="100,30 132,82 100,82" fill="url(#trxMntDark)" />

  <polygon points="106,82 128,52 152,82" fill="url(#trxLimeBright)" opacity="0.95" />
  <polygon points="128,52 152,82 128,82" fill="url(#trxMntDark)" opacity="0.95" />

  <!-- Central Letter 'T' Symbol -->
  <path d="M 44 84 L 156 84 L 145 106 L 55 106 Z" fill="url(#trxGradGreen)" />
  <path d="M 82 106 L 118 106 L 111 156 L 100 167 L 89 156 Z" fill="url(#trxLimeBright)" />

  <!-- Shield Chevrons -->
  <polygon points="60,125 74,125 63,160 48,144" fill="url(#trxGradGreen)" />
  <polygon points="140,125 126,125 137,160 152,144" fill="url(#trxGradGreen)" />
</svg>`;

// Function to generate Horizontal SVG with explicit letter fill color
const getHorizontalSvg = (textColor = "#0F172A") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 160" width="100%" height="100%">
  <defs>
    <linearGradient id="trxGradGreenH" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="50%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#15803D" />
    </linearGradient>

    <linearGradient id="trxMntDarkH" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#166534" />
      <stop offset="100%" stop-color="#052E16" />
    </linearGradient>

    <linearGradient id="trxLimeBrightH" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#A7F3D0" />
      <stop offset="100%" stop-color="#22C55E" />
    </linearGradient>

    <linearGradient id="trxOrangeGradH" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FB923C" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
  </defs>

  <!-- Left Emblem (Scaled and Centered vertically at y=10) -->
  <g transform="translate(10, 10) scale(0.7)">
    <circle cx="100" cy="100" r="86" fill="#15803D" opacity="0.12" />
    <path d="M 84 22 A 78 78 0 0 0 22 100 A 78 78 0 0 0 84 178" fill="none" stroke="url(#trxGradGreenH)" stroke-width="9" stroke-linecap="round" />
    <path d="M 116 22 A 78 78 0 0 1 178 100 A 78 78 0 0 1 116 178" fill="none" stroke="url(#trxGradGreenH)" stroke-width="9" stroke-linecap="round" />
    <polygon points="100,5 112,26 100,21 88,26" fill="url(#trxOrangeGradH)" />
    <polygon points="100,195 112,174 100,179 88,174" fill="url(#trxOrangeGradH)" />
    <polygon points="48,82 72,46 94,82" fill="url(#trxLimeBrightH)" />
    <polygon points="72,46 94,82 72,82" fill="url(#trxMntDarkH)" />
    <polygon points="68,82 100,30 132,82" fill="url(#trxGradGreenH)" />
    <polygon points="100,30 132,82 100,82" fill="url(#trxMntDarkH)" />
    <polygon points="106,82 128,52 152,82" fill="url(#trxLimeBrightH)" opacity="0.95" />
    <polygon points="128,52 152,82 128,82" fill="url(#trxMntDarkH)" opacity="0.95" />
    <path d="M 44 84 L 156 84 L 145 106 L 55 106 Z" fill="url(#trxGradGreenH)" />
    <path d="M 82 106 L 118 106 L 111 156 L 100 167 L 89 156 Z" fill="url(#trxLimeBrightH)" />
    <polygon points="60,125 74,125 63,160 48,144" fill="url(#trxGradGreenH)" />
    <polygon points="140,125 126,125 137,160 152,144" fill="url(#trxGradGreenH)" />
  </g>

  <!-- Right Typography Group -->
  <g transform="translate(170, 28)">
    <!-- T -->
    <path d="M 0 10 H 42 V 23 H 28 V 72 H 14 V 23 H 0 Z" fill="${textColor}" />
    
    <!-- R -->
    <path d="M 50 10 H 80 C 92 10 98 17 98 28 C 98 37 91 42 82 44 L 98 72 H 81 L 68 46 H 64 V 72 H 50 Z M 64 22 V 35 H 78 C 82 35 85 33 85 28 C 85 24 82 22 78 22 Z" fill="${textColor}" />
    
    <!-- E -->
    <path d="M 106 10 H 144 V 22 H 120 V 35 H 140 V 47 H 120 V 60 H 145 V 72 H 106 Z" fill="${textColor}" />

    <!-- X (Iconic Green & Orange Slice) -->
    <polygon points="152,10 172,10 206,72 186,72" fill="url(#trxGradGreenH)" />
    <polygon points="206,10 186,10 171,37 186,45" fill="#4B5563" />
    <polygon points="171,37 186,45 170,72 152,72" fill="url(#trxOrangeGradH)" />

    <!-- I -->
    <path d="M 214 10 H 228 V 72 H 214 Z" fill="${textColor}" />

    <!-- O -->
    <path d="M 256 10 C 275 10 290 19 290 41 C 290 63 275 72 256 72 C 237 72 222 63 222 41 C 222 19 237 10 256 10 Z M 256 23 C 245 23 236 30 236 41 C 236 52 245 59 256 59 C 267 59 276 52 276 41 C 276 30 267 23 256 23 Z" fill="${textColor}" />

    <!-- Tagline: — TRACK EVERY JOURNEY — -->
    <g transform="translate(0, 96)">
      <line x1="0" y1="-6" x2="42" y2="-6" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" />
      <text x="52" y="0" font-family="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" font-weight="900" font-size="12.5" fill="#22C55E" letter-spacing="3.8">TRACK EVERY JOURNEY</text>
      <line x1="250" y1="-6" x2="292" y2="-6" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" />
    </g>
  </g>
</svg>`;

// Write SVG files
const writeFiles = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'logo-icon.svg'), iconSvg);
  fs.writeFileSync(path.join(dir, 'logo-horizontal.svg'), getHorizontalSvg('#0F172A'));
  fs.writeFileSync(path.join(dir, 'logo-horizontal-white.svg'), getHorizontalSvg('#FFFFFF'));
  fs.writeFileSync(path.join(dir, 'logo.svg'), getHorizontalSvg('#0F172A'));
};

writeFiles('/frontend/public');
writeFiles('/public');

console.log("SVG logos generated successfully!");
