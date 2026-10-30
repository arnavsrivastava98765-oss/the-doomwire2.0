const path = require('path');
const fs = require('fs');
const http = require('http');

// Load Playwright from backend node_modules
const { chromium } = require(path.resolve(__dirname, '..', 'backend', 'node_modules', 'playwright'));

const distDir = path.resolve(__dirname, '..', 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// 1. Zero-dependency static server to serve compiled production bundle
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(distDir, urlPath);
  
  if (urlPath === '/' || !path.extname(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

const PORT = 4173;
server.listen(PORT, async () => {
  console.log(`[PDF Generator] Local production server listening on http://localhost:${PORT}`);
  
  try {
    console.log('[PDF Generator] Launching headless Chromium...');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2 // 2x Retina rendering for ultra-crisp vector graphics & fonts
    });

    // Emulate print media
    await page.emulateMedia({ media: 'print' });

    console.log('[PDF Generator] Loading 7-Slide Master Deck...');
    await page.goto(`http://localhost:${PORT}/?deck=true`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Ensure all Google Fonts and SVGs are loaded
    await page.evaluate(async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
    });

    // Extra brief buffer to ensure full paint
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const outputPath = path.resolve(__dirname, '..', 'DOOMWIRE_HACKATHON_7_SLIDES.pdf');
    console.log(`[PDF Generator] Exporting 16:9 PDF to: ${outputPath}...`);

    await page.pdf({
      path: outputPath,
      width: '1920px',
      height: '1080px',
      printBackground: true,
      landscape: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    console.log(`[PDF Generator] SUCCESS! Master Hackathon PDF generated successfully at:`);
    console.log(`⚡ ${outputPath}`);

    await browser.close();
  } catch (error) {
    console.error('[PDF Generator] Error during generation:', error);
  } finally {
    server.close();
    process.exit(0);
  }
});
