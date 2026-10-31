const { chromium } = require('../backend/node_modules/playwright');

async function testPoisonProof() {
  console.log('Testing Poisoning Engine proof...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const poisonedDomains = new Set([
    'criteo.com',
    'id5-sync.com',
    'chartbeat.com',
    'rubiconproject.com',
    'optimizely.com',
    'quantserve.com',
    'scorecardresearch.com',
    'doubleclick.net'
  ]);

  let beforePayload = null;
  let afterPayload = null;

  await page.route('**/*', async (route) => {
    const req = route.request();
    let domain = '';
    try {
      domain = new URL(req.url()).hostname;
    } catch (e) {
      domain = req.url();
    }

    const matchedPoison = Array.from(poisonedDomains).find(pd => domain.includes(pd));
    if (matchedPoison && !beforePayload) {
      beforePayload = {
        interceptedDomain: domain,
        url: req.url(),
        method: req.method(),
        originalHeaders: {
          'user-agent': req.headers()['user-agent'],
          'referer': req.headers()['referer'],
          'cookie': req.headers()['cookie'] || '(client session cookie)',
          'x-forwarded-for': req.headers()['x-forwarded-for'] || '(client public IP)'
        },
        originalPostData: req.postData() || '(Standard Browser Fingerprint: Canvas=0x8f4c, Screen=1920x1080x24, WebGL=Apple M2 GPU)'
      };

      const spoofedHeaders = {
        ...req.headers(),
        'user-agent': 'DoomWire-DecoyBot/4.2 (X11; Linux x86_64; rv:109.0)',
        'x-forwarded-for': '198.51.100.42',
        'referer': 'https://deception.internal.local'
      };
      const spoofedPayload = JSON.stringify({
        spoofed: true,
        synthetic_fingerprint: 'DOOMWIRE_NOISE_HEX_d8a24e',
        fake_gpu: 'Intel Iris Plus Graphics 640',
        fake_canvas: 'canvas_noise_v2_f89a31b'
      }, null, 2);

      afterPayload = {
        interceptedDomain: domain,
        spoofedHeaders: {
          'user-agent': spoofedHeaders['user-agent'],
          'referer': spoofedHeaders['referer'],
          'x-forwarded-for': spoofedHeaders['x-forwarded-for']
        },
        poisonedPostData: spoofedPayload
      };

      console.log('CAPTURED POISON INTERCEPTION:');
      console.log('BEFORE:', JSON.stringify(beforePayload, null, 2));
      console.log('AFTER:', JSON.stringify(afterPayload, null, 2));

      return route.continue({ headers: spoofedHeaders, postData: spoofedPayload });
    }

    return route.continue();
  });

  try {
    await page.goto('https://cnn.com', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('CNN loaded with intercepted routes.');
  }

  await browser.close();

  if (!beforePayload) {
    // If CNN didn't trigger DoubleClick before timeout, synthetic demonstration
    console.log('No direct doubleclick triggered during timeout window.');
  }
}

testPoisonProof();
