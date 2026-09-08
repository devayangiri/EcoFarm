const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

function getIconHtml(size, isMaskable = false) {
  // Safe zone for maskable is inner 80%
  const scale = isMaskable ? 0.75 : 0.88;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #064e3b;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .container {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: scale(${scale});
    }
  </style>
</head>
<body>
  <div class="container">
    <svg width="${Math.round(size * 0.7)}" height="${Math.round(size * 0.7)}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Soil / Platform Base -->
      <path d="M20 90C35 88 50 92 60 90C70 88 85 92 100 90" stroke="#0891b2" stroke-width="6" stroke-linecap="round"/>
      <path d="M30 102C42 100 52 103 60 102C68 101 78 103 90 102" stroke="#0891b2" stroke-width="4.5" stroke-linecap="round" opacity="0.8"/>
      
      <!-- Central Sprout Stem -->
      <path d="M60 90V45" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
      
      <!-- Left Leaf (Agriculture) -->
      <path d="M60 65C45 65 30 52 32 35C48 35 60 50 60 65Z" fill="#34d399"/>
      
      <!-- Right Leaf (Growth) -->
      <path d="M60 52C75 52 90 38 88 22C72 22 60 36 60 52Z" fill="#10b981"/>
      
      <!-- Water Drop (Aquaculture) -->
      <path d="M60 20C60 20 50 32 50 38C50 43.5 54.5 48 60 48C65.5 48 70 43.5 70 38C70 32 60 20 60 20Z" fill="#38bdf8"/>
    </svg>
  </div>
</body>
</html>`;
}

async function generateIcons() {
  console.log('Launching Puppeteer to generate high-resolution PWA icons...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const targets = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];

  for (const t of targets) {
    await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 });
    await page.setContent(getIconHtml(t.size, t.maskable));
    const outPath = path.join(ICONS_DIR, t.name);
    await page.screenshot({ path: outPath, omitBackground: false });
    console.log(`✓ Generated ${t.name} (${t.size}x${t.size}${t.maskable ? ', maskable' : ''})`);
  }

  // Also write favicon.svg for modern browsers
  const svgContent = `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" rx="28" fill="#064e3b"/>
  <path d="M20 90C35 88 50 92 60 90C70 88 85 92 100 90" stroke="#0891b2" stroke-width="6" stroke-linecap="round"/>
  <path d="M30 102C42 100 52 103 60 102C68 101 78 103 90 102" stroke="#0891b2" stroke-width="4.5" stroke-linecap="round" opacity="0.8"/>
  <path d="M60 90V45" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
  <path d="M60 65C45 65 30 52 32 35C48 35 60 50 60 65Z" fill="#34d399"/>
  <path d="M60 52C75 52 90 38 88 22C72 22 60 36 60 52Z" fill="#10b981"/>
  <path d="M60 20C60 20 50 32 50 38C50 43.5 54.5 48 60 48C65.5 48 70 43.5 70 38C70 32 60 20 60 20Z" fill="#38bdf8"/>
</svg>`;
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon.svg'), svgContent, 'utf8');
  console.log('✓ Generated favicon.svg');

  await browser.close();
  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
