const { chromium } = require('playwright');
const dns = require('dns').promises;
const geoip = require('geoip-lite');
const { validateTargetUrl, isSafeInflightUrl, isPrivateIp } = require('./security');
const { resolveIntelligence } = require('./intel');

// Shared Chromium instance with lazy launch and automatic recovery
let sharedBrowser = null;

async function getSharedBrowser() {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1440,900'
      ]
    });
  }
  return sharedBrowser;
}

async function closeSharedBrowser() {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    try {
      await sharedBrowser.close();
    } catch (e) {}
    sharedBrowser = null;
  }
}

function isBrowserActive() {
  return sharedBrowser !== null && sharedBrowser.isConnected();
}

// Deep inspect outgoing requests for surveillance payload details
function inspectSensitiveData(req) {
  const leaks = [];
  const rawUrl = req.url();
  const postData = req.postData() || '';
  const headers = req.headers();

  try {
    const parsed = new URL(rawUrl);
    const searchParams = Array.from(parsed.searchParams.keys());
    
    // 1. Inspect genuine Tracking Parameters (no single-letter or generic params)
    const trackingParams = searchParams.filter((p) =>
      /^(utm_(source|medium|campaign|term|content)|gclid|fbclid|dclid|msclkid|ttclid|_ga|_gl|fbc|fbp|client_id|visitor_id|user_id|session_id|device_id|anonymize_ip)/i.test(p)
    );
    if (trackingParams.length > 0) {
      leaks.push(`Observed Tracking Params: [${trackingParams.slice(0, 4).join(', ')}]`);
    }

    // 2. Inspect genuine Cookies
    if (headers['cookie']) {
      const cookieKeys = headers['cookie'].split(';').map((c) => c.split('=')[0].trim()).filter(Boolean);
      leaks.push(`Transmitted Cookies (${cookieKeys.length} tokens): [${cookieKeys.slice(0, 3).join(', ')}...]`);
    }

    // 3. Inspect Referrer Header
    if (headers['referer']) {
      try {
        const refHost = new URL(headers['referer']).hostname;
        leaks.push(`Referer Header: ${refHost}`);
      } catch (e) {
        leaks.push('HTTP Referer Header Present');
      }
    }

    // 4. Hardware & Fingerprint probes (only if explicit parameters exist, NEVER on generic w=)
    const hasScreen = /^(screen_width|screen_height|resolution|screen_depth|color_depth|sw|sh|sr)$/i;
    const screenParams = searchParams.filter((p) => hasScreen.test(p));
    if (screenParams.length > 0) {
      leaks.push(`Display Resolution Parameters: [${screenParams.join(', ')}]`);
    }

    // Canvas / WebGL probes
    if (rawUrl.includes('webgl_renderer') || postData.includes('webgl_unmasked') || postData.includes('canvas_hash')) {
      leaks.push('Canvas/WebGL Fingerprint Probe Detected');
    }

    // Keystroke / telemetry streams
    if (postData.includes('keystrokes') || postData.includes('clickstream') || rawUrl.includes('clickstream')) {
      leaks.push('User Interaction Stream / Heatmap Telemetry');
    }

    // 5. POST Payload inspection
    if (postData) {
      leaks.push(`Outbound POST Payload: ${postData.length} bytes`);
    }

    // 6. High-entropy client hints
    if (headers['sec-ch-ua-platform-version'] || headers['sec-ch-ua-model']) {
      leaks.push('High-Entropy Client Hints Requested');
    }
  } catch (e) {}

  if (leaks.length === 0) {
    leaks.push('Standard HTTP Request (No telemetry parameters observed)');
  }

  return leaks;
}

// Active DNS & Subdomain Enumeration engine for genuine domain infrastructure
async function discoverTargetInfrastructure(targetUrl) {
  const validation = await validateTargetUrl(targetUrl);
  if (!validation.valid) {
    console.warn(`[DoomWire] Infrastructure discovery skipped for unsafe target: ${targetUrl}`);
    return [];
  }
  const cleanUrl = validation.url;
  let domain = cleanUrl.replace(/https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0].toLowerCase();
  const parts = domain.split('.');
  const baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : domain;

  const probeHosts = new Set([domain, baseDomain]);
  const subPrefixes = [
    'api', 'cdn', 'static', 'media', 'auth', 'assets', 'login', 'app', 'events',
    'v', 'preview', 'm', 'mobile', 'gql', 'collector', 'alb', 'dit', 'crashlogs',
    'pps', 'mmg', 'edition', 'lightning', 'styles', 'gateway', 'edge', 'analytics'
  ];
  subPrefixes.forEach((p) => probeHosts.add(`${p}.${baseDomain}`));

  if (baseDomain.includes('whatsapp')) {
    ['static.whatsapp.net', 'mmg.whatsapp.net', 'crashlogs.whatsapp.net', 'dit.whatsapp.net', 'pps.whatsapp.net', 'graph.facebook.com'].forEach(h => probeHosts.add(h));
  }
  if (baseDomain.includes('reddit')) {
    ['v.redd.it', 'preview.redd.it', 'styles.redditmedia.com', 'alb.reddit.com', 'gql.reddit.com'].forEach(h => probeHosts.add(h));
  }
  if (baseDomain.includes('cnn')) {
    ['media.cnn.com', 'lightning.cnn.com', 'fave.api.cnn.io', 'registry.api.cnn.io', 'edition.cnn.com'].forEach(h => probeHosts.add(h));
  }

  const nodes = [];
  await Promise.all(
    Array.from(probeHosts).map(async (host) => {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1800));
        const a = await Promise.race([dns.resolve4(host), timeoutPromise]);
        if (a && a.length > 0) {
          const ip = a[0];
          if (isPrivateIp(ip)) {
            return; // Reject any private or internal IP in discovery
          }
          const intel = await resolveIntelligence(host, `https://${host}`, 'script');
          nodes.push({
            domain: host,
            ip: ip,
            company: intel.company,
            city: intel.city,
            lat: intel.lat,
            lng: intel.lng,
            threatLevel: intel.threat,
            trackerType: intel.type,
            leakedData: [
              `DNS A Record: ${host} -> ${ip}`,
              `Protocol: Authoritative DNS Resolution`,
              `Verified Target Domain Infrastructure`
            ]
          });
        }
      } catch (e) {}
    })
  );

  return nodes;
}

// Executes an isolated reconnaissance scan inside Playwright
async function executeScan({ session, socket, validatedUrl, scanId, cleanupSessionBrowser }) {
  session.scanStartTime = Date.now();

  session.safetyWatchdog = setTimeout(async () => {
    if (!session.scanCompleted && session.currentScanId === scanId) {
      session.scanCompleted = true;
      const elapsedSec = ((Date.now() - session.scanStartTime) / 1000).toFixed(1);
      console.warn(`[DoomWire] Safety watchdog completed for ${validatedUrl} after ${elapsedSec}s (Session: ${socket.id})`);
      socket.emit('scan_complete', {
        message: `Reconnaissance scan finalized within ${elapsedSec}s safety window.`,
        totalPackets: session.interceptedCount || 0,
        captureWindowSec: parseFloat(elapsedSec),
        dnsInfrastructureCount: session.dnsDiscoveredCount || 0,
        firstPartyPackets: session.firstPartyCount || 0,
        thirdPartyPackets: session.thirdPartyCount || 0,
        safeViewImage: null
      });
      await cleanupSessionBrowser(session);
    }
  }, 20000);

  try {
    console.log(`[DoomWire] Initiating Recon Scan for: ${validatedUrl} [Client: ${socket.id}]`);
    socket.emit('scan_status', { status: 'INITIALIZING SANDBOX BROWSER...', stage: 1 });

    const browser = await getSharedBrowser();
    session.context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'en-US'
    });

    // Remove automation flags so ad-tech and telemetry scripts fire normally
    await session.context.addInitScript(() => {
      try {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        window.chrome = { runtime: {} };
      } catch (e) {}
    });

    session.page = await session.context.newPage();
    const seenDomains = new Set();

    // Intercept and route every outgoing request
    await session.page.route('**/*', async (route) => {
      const req = route.request();
      const reqUrl = req.url();

      // Strict in-flight SSRF defense
      if (!isSafeInflightUrl(reqUrl)) {
        console.warn(`[DoomWire // SSRF ABORT] Blocked in-flight request: ${reqUrl}`);
        return route.abort('blockedbyclient');
      }

      let domain = 'unknown';
      try {
        domain = new URL(reqUrl).hostname;
      } catch (e) {
        domain = reqUrl.split('/')[2] || 'unknown';
      }

      // 1. Action: "Cut the Wire" (Per-Session Hard Abort)
      if (session.blockedDomains.has(domain)) {
        console.log(`[DoomWire // SEVERED] Intercepted & Aborted connection to: ${domain} (Client: ${socket.id})`);
        socket.emit('wire_severed_live', { domain, url: reqUrl });
        return route.abort('blockedbyclient');
      }

      // 2. Action: "Poison the Wire" (Per-Session Deception Mode)
      if (session.poisonedDomains.has(domain)) {
        console.log(`[DoomWire // POISONED] Deception active for: ${domain} (Client: ${socket.id})`);
        const method = req.method();
        const spoofedHeaders = {
          ...req.headers(),
          'user-agent': 'DoomWire-DecoyBot/4.2 (X11; Linux x86_64; rv:109.0)',
          'x-forwarded-for': '198.51.100.42',
          'x-doomwire-decoy': 'active',
          'referer': 'https://deception.internal.local'
        };

        socket.emit('wire_poisoned_live', { domain, url: reqUrl });

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

      // 3. Unblock network pipeline so page loads
      route.continue();

      // 4. Resolve intelligence and stream packet telemetry
      session.interceptedCount++;
      seenDomains.add(domain);
      const reqMethod = req.method();
      const reqResType = req.resourceType();
      const sensitiveLeaks = inspectSensitiveData(req);

      let targetDomain = '';
      try { targetDomain = new URL(validatedUrl).hostname; } catch (e) {}

      resolveIntelligence(domain, reqUrl, reqResType, targetDomain).then((intel) => {
        if (intel.party === 'first') {
          session.firstPartyCount = (session.firstPartyCount || 0) + 1;
        } else {
          session.thirdPartyCount = (session.thirdPartyCount || 0) + 1;
        }

        const packetPayload = {
          id: Math.random().toString(36).substring(7),
          domain: domain,
          url: reqUrl,
          method: reqMethod,
          resourceType: reqResType,
          company: intel.company,
          party: intel.party,
          isThirdParty: intel.isThirdParty,
          locationType: intel.locationType,
          city: intel.city,
          threatLevel: intel.threat,
          trackerType: intel.type,
          geo: { lat: intel.lat, lng: intel.lng },
          leakedData: sensitiveLeaks,
          timestamp: new Date().toLocaleTimeString(),
          isBlocked: session.blockedDomains.has(domain),
          isPoisoned: session.poisonedDomains.has(domain)
        };

        socket.emit('packet_captured', packetPayload);
      }).catch(() => {});
    });

    socket.emit('scan_status', { status: 'NAVIGATING AND HARVESTING BEAMS...', stage: 2 });

    // Load target URL safely inside sandbox with 'load' strategy (falls back gracefully to partial DOM)
    try {
      await session.page.goto(validatedUrl, { waitUntil: 'load', timeout: 8000 });
    } catch (e) {
      console.warn(`[DoomWire] Page load notice (proceeding with captured DOM state): ${e.message}`);
    }

    // Auto-accept GDPR cookie/consent banners & trigger scroll to activate lazy-loaded trackers
    try {
      await session.page.evaluate(async () => {
        const consentBtn = document.querySelector(
          '#onetrust-accept-btn-handler, #accept-recommended-btn-handler, button[id*="accept"], button[class*="accept"], button[aria-label*="Accept"]'
        );
        if (consentBtn) {
          try { consentBtn.click(); } catch (e) {}
        }
        window.scrollBy({ top: 750, behavior: 'smooth' });
      });
    } catch (e) {}

    // Allow 1800ms for post-consent analytics & ad auctions to fire
    await new Promise((resolve) => setTimeout(resolve, 1800));

    try {
      await session.page.evaluate(() => {
        window.scrollBy({ top: 1000, behavior: 'smooth' });
      });
    } catch (e) {}

    await new Promise((resolve) => setTimeout(resolve, 600));

    // Discover real DNS infrastructure belonging specifically to target domain
    try {
      const timeoutInfra = new Promise((resolve) => setTimeout(() => resolve([]), 1800));
      const infraNodes = await Promise.race([discoverTargetInfrastructure(validatedUrl), timeoutInfra]);
      for (const node of infraNodes) {
        if (!seenDomains.has(node.domain)) {
          seenDomains.add(node.domain);
          session.dnsDiscoveredCount = (session.dnsDiscoveredCount || 0) + 1;
          socket.emit('packet_captured', {
            id: Math.random().toString(36).substring(7),
            domain: node.domain,
            url: `https://${node.domain}/`,
            method: 'DNS',
            resourceType: 'dns_infrastructure',
            observedTraffic: false,
            company: node.company,
            city: node.city,
            threatLevel: node.threatLevel,
            trackerType: node.trackerType,
            geo: { lat: node.lat, lng: node.lng },
            leakedData: [
              `DNS-Discovered Endpoint: ${node.domain}`,
              `Authoritative DNS A Record: ${node.ip || 'Resolved'}`,
              'Not observed in active HTTP traffic'
            ],
            timestamp: new Date().toLocaleTimeString(),
            isBlocked: session.blockedDomains.has(node.domain),
            isPoisoned: session.poisonedDomains.has(node.domain)
          });
        }
      }
    } catch (e) {}

    // Capture Clean-Room safe preview frame
    let safeViewBase64 = null;
    try {
      if (session.page && !session.page.isClosed()) {
        const buffer = await session.page.screenshot({ type: 'jpeg', quality: 55, timeout: 2500 });
        safeViewBase64 = buffer.toString('base64');
      }
    } catch (err) {
      console.warn(`[DoomWire] Preview capture note: ${err.message}`);
    }

    if (!session.scanCompleted) {
      session.scanCompleted = true;
      if (session.safetyWatchdog) {
        clearTimeout(session.safetyWatchdog);
        session.safetyWatchdog = null;
      }
      const captureWindowSec = ((Date.now() - session.scanStartTime) / 1000).toFixed(1);
      socket.emit('scan_complete', {
        message: `Reconnaissance scan finalized: captured across ${captureWindowSec}s window.`,
        totalPackets: session.interceptedCount,
        captureWindowSec: parseFloat(captureWindowSec),
        dnsInfrastructureCount: session.dnsDiscoveredCount || 0,
        firstPartyPackets: session.firstPartyCount || 0,
        thirdPartyPackets: session.thirdPartyCount || 0,
        safeViewImage: safeViewBase64 ? `data:image/jpeg;base64,${safeViewBase64}` : null
      });
    }
  } catch (err) {
    console.error('[DoomWire Error]:', err);
    socket.emit('scan_status', { status: 'HARVESTING VERIFIED DNS INFRASTRUCTURE...', stage: 2 });
    try {
      const infraNodes = await discoverTargetInfrastructure(validatedUrl);
      let dnsCount = 0;
      for (const node of infraNodes) {
        dnsCount++;
        socket.emit('packet_captured', {
          id: Math.random().toString(36).substring(7),
          domain: node.domain,
          url: `https://${node.domain}/`,
          method: 'DNS',
          resourceType: 'dns_infrastructure',
          observedTraffic: false,
          company: node.company,
          city: node.city,
          threatLevel: node.threatLevel,
          trackerType: node.trackerType,
          geo: { lat: node.lat, lng: node.lng },
          leakedData: [
            `DNS-Discovered Endpoint: ${node.domain}`,
            `Authoritative DNS A Record: ${node.ip || 'Resolved'}`,
            'Discovered via target DNS reconnaissance'
          ],
          timestamp: new Date().toLocaleTimeString(),
          isBlocked: session.blockedDomains.has(node.domain),
          isPoisoned: session.poisonedDomains.has(node.domain)
        });
      }
      if (!session.scanCompleted) {
        session.scanCompleted = true;
        if (session.safetyWatchdog) {
          clearTimeout(session.safetyWatchdog);
          session.safetyWatchdog = null;
        }
        socket.emit('scan_complete', {
          message: `Target reconnaissance finalized: ${dnsCount} DNS infrastructure endpoints discovered.`,
          totalPackets: session.interceptedCount || 0,
          dnsInfrastructureCount: dnsCount,
          safeViewImage: null
        });
      }
    } catch (fallbackErr) {
      if (!session.scanCompleted) {
        session.scanCompleted = true;
        if (session.safetyWatchdog) {
          clearTimeout(session.safetyWatchdog);
          session.safetyWatchdog = null;
        }
        socket.emit('scan_error', { error: err.message });
      }
    }
  } finally {
    if (session.currentScanId === scanId) {
      await cleanupSessionBrowser(session);
    }
  }
}

module.exports = {
  getSharedBrowser,
  closeSharedBrowser,
  isBrowserActive,
  inspectSensitiveData,
  discoverTargetInfrastructure,
  executeScan
};
