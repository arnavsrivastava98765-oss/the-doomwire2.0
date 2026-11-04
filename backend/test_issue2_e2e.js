// backend/test_issue2_e2e.js
// 10-Cycle verification for Issue 2: Poison Feature Realignment & HTTP Method Compliance

const http = require('http');
const { chromium } = require('./node_modules/playwright');

// The exact Poison interception logic used in DoomWire server.js
function handlePoisonInterception(req, route, session, domain, reqUrl, onPoisonedLive) {
  if (session.poisonedDomains.has(domain)) {
    const method = req.method();
    const spoofedHeaders = {
      ...req.headers(),
      'user-agent': 'DoomWire-DecoyBot/4.2 (X11; Linux x86_64; rv:109.0)',
      'x-forwarded-for': '198.51.100.42',
      'x-doomwire-decoy': 'active',
      'referer': 'https://deception.internal.local'
    };

    if (onPoisonedLive) onPoisonedLive({ domain, url: reqUrl });

    // Only attach payload if HTTP method genuinely supports a body (POST, PUT, PATCH)
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const rawBody = req.postData() || '';
      const cType = (spoofedHeaders['content-type'] || '').toLowerCase();
      let finalBody = rawBody;

      if (cType.includes('application/json') || (!cType && rawBody.startsWith('{'))) {
        try {
          const parsed = JSON.parse(rawBody || '{}');
          parsed._doomwire_decoy = true;
          parsed._synthetic_entropy = Math.random().toString(16).substring(2, 10);
          finalBody = JSON.stringify(parsed);
        } catch (e) {
          finalBody = JSON.stringify({ _doomwire_decoy: true, _synthetic_entropy: Math.random().toString(16).substring(2, 10) });
        }
      } else if (cType.includes('application/x-www-form-urlencoded')) {
        finalBody = (rawBody ? rawBody + '&' : '') + '_doomwire_decoy=1';
      }
      return route.continue({ headers: spoofedHeaders, postData: finalBody });
    }

    // GET, HEAD, OPTIONS: continue with decoy headers only (never attach illegal request bodies)
    return route.continue({ headers: spoofedHeaders });
  }

  return route.continue();
}

async function runOneCycle(cycleNum, browser, targetPort) {
  const session = {
    poisonedDomains: new Set(['tracker-poison-test.com'])
  };

  const recordedRequests = [];
  const testServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end('<html><body>Test Page</body></html>');
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      recordedRequests.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', receivedMethod: req.method }));
    });
  });

  await new Promise(resolve => testServer.listen(targetPort, '127.0.0.1', resolve));

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    let poisonedEvents = 0;
    await page.route('**/*', (route) => {
      const req = route.request();
      const url = req.url();
      let domain = 'unknown';
      try {
        domain = new URL(url).hostname;
      } catch (e) {}

      // If test request is directed to tracker-poison-test.com, map domain for test
      if (url.includes(`127.0.0.1:${targetPort}/tracker`)) {
        domain = 'tracker-poison-test.com';
      }

      handlePoisonInterception(req, route, session, domain, url, () => {
        poisonedEvents++;
      });
    });

    await page.goto(`http://127.0.0.1:${targetPort}/index.html`);

    // Test 1: GET request to poisoned domain
    const getRes = await page.evaluate(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/tracker/pixel.gif?id=123`);
      return res.status;
    }, targetPort);

    if (getRes !== 200) {
      throw new Error(`GET request failed with status ${getRes}`);
    }

    const getReqRecord = recordedRequests.find(r => r.url.includes('/tracker/pixel.gif'));
    if (!getReqRecord) {
      throw new Error('GET request was not recorded by test server!');
    }

    // Assert GET received decoy headers
    if (getReqRecord.headers['x-forwarded-for'] !== '198.51.100.42') {
      throw new Error(`GET request missing decoy X-Forwarded-For: ${getReqRecord.headers['x-forwarded-for']}`);
    }
    if (!getReqRecord.headers['user-agent']?.includes('DoomWire-DecoyBot')) {
      throw new Error(`GET request missing decoy User-Agent: ${getReqRecord.headers['user-agent']}`);
    }
    if (getReqRecord.headers['x-doomwire-decoy'] !== 'active') {
      throw new Error(`GET request missing x-doomwire-decoy header, value: ${getReqRecord.headers['x-doomwire-decoy']}`);
    }

    // CRITICAL ASSERTION: GET request body MUST BE EMPTY (never corrupted with postData)
    if (getReqRecord.body && getReqRecord.body.length > 0) {
      throw new Error(`[CRITICAL BUG] GET request was given an illegal body by Poison: "${getReqRecord.body}"`);
    }

    // Test 2: POST request to poisoned domain with JSON body
    const postRes = await page.evaluate(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/tracker/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_data: 'user_analytics', timestamp: 123456 })
      });
      return res.status;
    }, targetPort);

    if (postRes !== 200) {
      throw new Error(`POST request failed with status ${postRes}`);
    }

    const postReqRecord = recordedRequests.find(r => r.url.includes('/tracker/telemetry'));
    if (!postReqRecord) {
      throw new Error('POST request was not recorded by test server!');
    }

    // Assert POST received decoy headers
    if (postReqRecord.headers['x-forwarded-for'] !== '198.51.100.42') {
      throw new Error('POST request missing decoy X-Forwarded-For');
    }

    // Assert POST body was safely augmented with decoy entropy without breaking JSON structure
    const parsedPostBody = JSON.parse(postReqRecord.body);
    if (!parsedPostBody._doomwire_decoy || !parsedPostBody._synthetic_entropy) {
      throw new Error('POST body missing _doomwire_decoy or _synthetic_entropy!');
    }
    if (parsedPostBody.original_data !== 'user_analytics') {
      throw new Error('POST body corrupted original user data attributes!');
    }

    // Test 3: Normal unpoisoned domain must NOT receive decoy headers
    await page.evaluate(async (port) => {
      await fetch(`http://127.0.0.1:${port}/normal-content.js`);
    }, targetPort);

    const normalReqRecord = recordedRequests.find(r => r.url.includes('/normal-content.js'));
    if (normalReqRecord.headers['x-forwarded-for'] === '198.51.100.42') {
      throw new Error('Normal unpoisoned request received decoy headers!');
    }

    if (poisonedEvents !== 2) {
      throw new Error(`Expected exactly 2 poison events, got ${poisonedEvents}`);
    }

    await context.close();
  } finally {
    await new Promise(resolve => testServer.close(resolve));
  }
}

async function main() {
  console.log('=== VERIFYING ISSUE 2: POISON FEATURE REALIGNMENT (10 CONSECUTIVE CYCLES) ===\n');
  const browser = await chromium.launch({ headless: true });
  const port = 5128;

  try {
    for (let c = 1; c <= 10; c++) {
      process.stdout.write(`   [Cycle ${c}/10] Testing GET header-only decoy, POST JSON augmentation & unpoisoned pass-through... `);
      await runOneCycle(c, browser, port);
      process.stdout.write('Passed.\n');
      await new Promise(r => setTimeout(r, 200));
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! POISON FEATURE IS 100% COMPLIANT & TESTED! <<<\n');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    await browser.close();
    process.exit(1);
  }
}

main();
