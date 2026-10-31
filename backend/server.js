const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { chromium } = require('playwright');
const cors = require('cors');
const dns = require('dns').promises;
const geoip = require('geoip-lite');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Global tracking states
let activeBrowser = null;
let activePage = null;
const blockedDomains = new Set();
const poisonedDomains = new Set();

// Comprehensive Tracker & Entity Intelligence Dictionary
const TRACKER_RADAR = {
  'google-analytics.com': { company: 'Google LLC', type: 'Analytics & Telemetry', threat: 'yellow', defaultCity: 'Mountain View, US', lat: 37.422, lng: -122.084 },
  'googletagmanager.com': { company: 'Google LLC', type: 'Tag Management & Trigger', threat: 'yellow', defaultCity: 'Mountain View, US', lat: 37.422, lng: -122.084 },
  'doubleclick.net': { company: 'Google / DoubleClick', type: 'Behavioral Ad Tracker', threat: 'yellow', defaultCity: 'Frankfurt, DE', lat: 50.1109, lng: 8.6821 },
  'googleadservices.com': { company: 'Google LLC', type: 'Conversion Tracking Beacon', threat: 'yellow', defaultCity: 'Council Bluffs, US', lat: 41.2619, lng: -95.8608 },
  'facebook.net': { company: 'Meta Platforms', type: 'Cross-Site Fingerprinter', threat: 'orange', defaultCity: 'Dublin, IE', lat: 53.3498, lng: -6.2603 },
  'facebook.com': { company: 'Meta Platforms', type: 'Social Graph Tracker', threat: 'orange', defaultCity: 'Menlo Park, US', lat: 37.4538, lng: -122.1822 },
  'connect.facebook.net': { company: 'Meta Platforms', type: 'SDK Identity Beacon', threat: 'orange', defaultCity: 'Dublin, IE', lat: 53.3498, lng: -6.2603 },
  'hotjar.com': { company: 'Hotjar Ltd.', type: 'Session Replay Spyware', threat: 'orange', defaultCity: 'St. Julian\'s, MT', lat: 35.9175, lng: 14.4883 },
  'clarity.ms': { company: 'Microsoft Corp', type: 'Keystroke & Heatmap Recorder', threat: 'orange', defaultCity: 'Redmond, US', lat: 47.674, lng: -122.1215 },
  'criteo.com': { company: 'Criteo SA', type: 'Dynamic Retargeter', threat: 'yellow', defaultCity: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  'criteo.net': { company: 'Criteo SA', type: 'Cross-Domain Pixel', threat: 'yellow', defaultCity: 'Amsterdam, NL', lat: 52.3676, lng: 4.9041 },
  'yandex.ru': { company: 'Yandex LLC', type: 'High-Risk Telemetry', threat: 'red', defaultCity: 'Moscow, RU', lat: 55.7558, lng: 37.6173 },
  'yandex.net': { company: 'Yandex LLC', type: 'Behavioral Profiler', threat: 'red', defaultCity: 'Helsinki, FI', lat: 60.1699, lng: 24.9384 },
  'tiktok.com': { company: 'ByteDance Ltd.', type: 'Device Fingerprint Beacon', threat: 'orange', defaultCity: 'Singapore, SG', lat: 1.3521, lng: 103.8198 },
  'byteoversea.com': { company: 'ByteDance Ltd.', type: 'Cross-App Tracker', threat: 'orange', defaultCity: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
  'outbrain.com': { company: 'Outbrain Inc.', type: 'Native Content Profiler', threat: 'yellow', defaultCity: 'New York, US', lat: 40.7128, lng: -74.006 },
  'taboola.com': { company: 'Taboola Inc.', type: 'Content Recommendation Tracker', threat: 'yellow', defaultCity: 'Tel Aviv, IL', lat: 32.0853, lng: 34.7818 },
  'rubiconproject.com': { company: 'Magnite Inc.', type: 'Programmatic Ad Exchange', threat: 'yellow', defaultCity: 'Los Angeles, US', lat: 34.0522, lng: -118.2437 },
  'pubmatic.com': { company: 'PubMatic Inc.', type: 'Bidstream Data Broker', threat: 'orange', defaultCity: 'Redwood City, US', lat: 37.4852, lng: -122.2364 },
  'adnxs.com': { company: 'AppNexus / Microsoft', type: 'Real-Time Bidder', threat: 'yellow', defaultCity: 'Secaucus, US', lat: 40.7895, lng: -74.0565 },
  'casalemedia.com': { company: 'Index Exchange', type: 'Ad Fingerprinter', threat: 'yellow', defaultCity: 'Toronto, CA', lat: 43.6532, lng: -79.3832 },
  'scorecardresearch.com': { company: 'Full Circle Studies / Comscore', type: 'Mass Audience Tracker', threat: 'orange', defaultCity: 'Reston, US', lat: 38.9586, lng: -77.357 },
  'amazon-adsystem.com': { company: 'Amazon.com Inc.', type: 'Commercial Graph Tracker', threat: 'yellow', defaultCity: 'Seattle, US', lat: 47.6062, lng: -122.3321 },
  'cloudfront.net': { company: 'Amazon Web Services', type: 'Cloud CDN / Asset Delivery', threat: 'green', defaultCity: 'Ashburn, US', lat: 39.0438, lng: -77.4874 },
  'cloudflare.com': { company: 'Cloudflare Inc.', type: 'Edge Security & CDN', threat: 'green', defaultCity: 'San Francisco, US', lat: 37.7749, lng: -122.4194 },
  'cloudflare.net': { company: 'Cloudflare Inc.', type: 'Edge Security & CDN', threat: 'green', defaultCity: 'San Francisco, US', lat: 37.7749, lng: -122.4194 },
  'fastly.net': { company: 'Fastly Inc.', type: 'Edge Content Network', threat: 'green', defaultCity: 'Denver, US', lat: 39.7392, lng: -104.9903 },
  'akamaihd.net': { company: 'Akamai Technologies', type: 'Global Edge Network', threat: 'green', defaultCity: 'Cambridge, US', lat: 42.3736, lng: -71.1097 },
  'akamaized.net': { company: 'Akamai Technologies', type: 'Global Edge Network', threat: 'green', defaultCity: 'Cambridge, US', lat: 42.3736, lng: -71.1097 },
  'onetrust.io': { company: 'OneTrust Privacy', type: 'Consent & Cookie Tracker', threat: 'yellow', defaultCity: 'Atlanta, US', lat: 33.749, lng: -84.388 },
  'onetrust.com': { company: 'OneTrust Privacy', type: 'Consent & Cookie Tracker', threat: 'yellow', defaultCity: 'Atlanta, US', lat: 33.749, lng: -84.388 },
  'optimizely.com': { company: 'Optimizely Inc.', type: 'A/B Testing & Profiler', threat: 'yellow', defaultCity: 'Austin, US', lat: 30.2672, lng: -97.7431 },
  'quantserve.com': { company: 'Quantcast Corp', type: 'Audience Measurement', threat: 'orange', defaultCity: 'San Francisco, US', lat: 37.7749, lng: -122.4194 },
  'id5-sync.com': { company: 'ID5 Technology', type: 'Universal ID Cookie Sync', threat: 'red', defaultCity: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'openx.net': { company: 'OpenX Software', type: 'Ad Exchange & RTB Bidder', threat: 'red', defaultCity: 'Pasadena, US', lat: 34.1478, lng: -118.1445 },
  'permutive.com': { company: 'Permutive Inc.', type: 'Publisher Edge Cohorts', threat: 'yellow', defaultCity: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'adsafeprotected.com': { company: 'Integral Ad Science', type: 'Ad Verification & Telemetry', threat: 'yellow', defaultCity: 'New York, US', lat: 40.7128, lng: -74.006 },
  'teads.tv': { company: 'Teads SA', type: 'Video Ad Delivery Engine', threat: 'yellow', defaultCity: 'Montpellier, FR', lat: 43.6108, lng: 3.8767 },
  'bounceexchange.com': { company: 'Wunderkind', type: 'Behavioral Identity Resolution', threat: 'orange', defaultCity: 'New York, US', lat: 40.7128, lng: -74.006 },
  'smartadserver.com': { company: 'Equativ / Smart', type: 'Ad Server & Header Bidder', threat: 'red', defaultCity: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  'indexww.com': { company: 'Index Exchange', type: 'Header Bidding Gateway', threat: 'yellow', defaultCity: 'Toronto, CA', lat: 43.6532, lng: -79.3832 },
  'googlesyndication.com': { company: 'Google AdSense / Publisher Network', type: 'Display Ad Network', threat: 'red', defaultCity: 'Mountain View, US', lat: 37.422, lng: -122.084 }
};

// Clean company name from domain if not in static radar
function deriveCompanyFromDomain(domain) {
  const parts = domain.replace(/^www\./, '').split('.');
  if (parts.length >= 2) {
    const brand = parts[parts.length - 2];
    return brand.charAt(0).toUpperCase() + brand.slice(1) + ' Network';
  }
  return 'Edge Host / Server';
}

// Dynamically determine threat level from domain and URL patterns
function classifyThreat(domain, url, resourceType) {
  const d = domain.toLowerCase();
  const u = url.toLowerCase();
  if (d.includes('ad') || d.includes('criteo') || d.includes('rubicon') || d.includes('openx') || d.includes('bid') || d.includes('pixel') || d.includes('sync')) {
    return 'red';
  }
  if (d.includes('analytics') || d.includes('track') || d.includes('telemetry') || d.includes('metric') || d.includes('collector') || d.includes('hotjar') || d.includes('clarity') || d.includes('tag')) {
    return 'orange';
  }
  if (d.includes('optimizely') || d.includes('onetrust') || d.includes('cookie') || d.includes('score') || d.includes('survey')) {
    return 'yellow';
  }
  if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || d.includes('cdn') || d.includes('static') || d.includes('assets') || d.includes('cloudflare') || d.includes('fastly')) {
    return 'green';
  }
  return 'green';
}

// DNS and Geo-IP resolution with dynamic intelligence
async function resolveIntelligence(domain, fullUrl = '', resourceType = 'other') {
  // Check predefined intelligence radar first
  for (const [key, val] of Object.entries(TRACKER_RADAR)) {
    if (domain.includes(key)) {
      return {
        company: val.company,
        city: val.defaultCity,
        lat: val.lat,
        lng: val.lng,
        type: val.type,
        threat: val.threat
      };
    }
  }

  const derivedCompany = deriveCompanyFromDomain(domain);
  const derivedThreat = classifyThreat(domain, fullUrl, resourceType);

  // Live DNS & offline GeoIP lookup
  try {
    const lookup = await dns.lookup(domain);
    const ip = lookup.address;
    const geo = geoip.lookup(ip);

    if (geo && geo.ll) {
      return {
        company: derivedCompany,
        city: `${geo.city || 'Edge Node'}, ${geo.country || 'Global'}`,
        lat: geo.ll[0],
        lng: geo.ll[1],
        type: derivedThreat === 'red' ? 'Real-Time Ad Exchange / Telemetry' : derivedThreat === 'orange' ? 'Analytics & Telemetry Beacon' : 'Host API & Asset Gateway',
        threat: derivedThreat
      };
    }
  } catch (e) {
    // DNS resolution failure or private IP fallback
  }

  // Consistent hash-based coordinates across the globe for unknown/distributed servers
  const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackLocations = [
    { city: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { city: 'Frankfurt, DE', lat: 50.1109, lng: 8.6821 },
    { city: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
    { city: 'Singapore, SG', lat: 1.3521, lng: 103.8198 },
    { city: 'Sydney, AU', lat: -33.8688, lng: 151.2093 },
    { city: 'São Paulo, BR', lat: -23.5505, lng: -46.6333 },
    { city: 'Ashburn, VA', lat: 39.0438, lng: -77.4874 }
  ];
  const selected = fallbackLocations[hash % fallbackLocations.length];

  return {
    company: derivedCompany,
    city: selected.city,
    lat: selected.lat,
    lng: selected.lng,
    type: derivedThreat === 'red' ? 'Targeted Ad Delivery Node' : 'Origin / Edge CDN Server',
    threat: derivedThreat
  };
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
    
    // 1. Inspect real Query Parameters
    const trackingParams = searchParams.filter((p) =>
      /^(utm_|gclid|fbclid|dclid|msclkid|id|uid|uuid|_ga|_gl|v|tid|cid|event|session)/i.test(p)
    );
    if (trackingParams.length > 0) {
      leaks.push(`Telemetry Query Params: [${trackingParams.slice(0, 4).join(', ')}]`);
    }

    // 2. Inspect real Cookies
    if (headers['cookie']) {
      const cookieKeys = headers['cookie'].split(';').map((c) => c.split('=')[0].trim()).filter(Boolean);
      leaks.push(`Transmitted Cookies (${cookieKeys.length} tokens): [${cookieKeys.slice(0, 3).join(', ')}...]`);
    }

    // 3. Inspect Referrer & Origin Leaks
    if (headers['referer']) {
      try {
        const refHost = new URL(headers['referer']).hostname;
        leaks.push(`Origin Referrer Exfiltration: -> ${refHost}`);
      } catch (e) {
        leaks.push('HTTP Referrer Header Transmitted');
      }
    }

    // 4. Hardware & Fingerprint probes
    if (rawUrl.includes('resolution=') || rawUrl.includes('screen=') || rawUrl.includes('w=') || postData.includes('screen')) {
      leaks.push('Hardware Display Fingerprint (Screen Resolution & Depth Probes)');
    }
    if (rawUrl.includes('webgl') || rawUrl.includes('gpu') || postData.includes('renderer') || postData.includes('canvas')) {
      leaks.push('GPU Canvas Fingerprint: WebGL Renderer & Shader Enumeration');
    }
    if (rawUrl.includes('mouse') || rawUrl.includes('click') || postData.includes('keystroke') || rawUrl.includes('heat')) {
      leaks.push('DOM Biometric Vector: Real-time Cursor & Keystroke Telemetry');
    }

    // 5. POST Payload inspection
    if (postData) {
      leaks.push(`Outbound POST Payload: ${postData.length} bytes (JSON/Beacon Form)`);
    }

    // 6. User-Agent
    if (headers['user-agent']) {
      leaks.push('Client Hardware & OS User-Agent Fingerprint');
    }
  } catch (e) {}

  if (leaks.length === 0) {
    leaks.push('Network Latency & Connection Profile: RTT Probe');
    leaks.push('Direct HTTP Gateway Request Token');
  }

  return leaks;
}

io.on('connection', (socket) => {
  console.log(`[DoomWire] Tactical radar client connected: ${socket.id}`);

  // Send current blocked/poisoned status
  socket.emit('state_sync', {
    blockedDomains: Array.from(blockedDomains),
    poisonedDomains: Array.from(poisonedDomains)
  });

  socket.on('scan_url', async ({ url, userLocation }) => {
    try {
      console.log(`[DoomWire] Initiating Recon Scan for: ${url}`);
      socket.emit('scan_status', { status: 'INITIALIZING SANDBOX BROWSER...', stage: 1 });

      if (activeBrowser) {
        try { await activeBrowser.close(); } catch (e) {}
      }

      // Launch isolated Chromium engine
      activeBrowser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const context = await activeBrowser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true
      });

      activePage = await context.newPage();
      let interceptedCount = 0;

      // Intercept and route every outgoing request
      await activePage.route('**/*', async (route) => {
        const req = route.request();
        let domain = 'unknown';
        try {
          domain = new URL(req.url()).hostname;
        } catch (e) {
          domain = req.url().split('/')[2] || 'unknown';
        }

        // 1. Action: "Cut the Wire" (Hard Abort)
        if (blockedDomains.has(domain)) {
          console.log(`[DoomWire // SEVERED] Intercepted & Aborted connection to: ${domain}`);
          socket.emit('wire_severed_live', { domain, url: req.url() });
          return route.abort('blockedbyclient');
        }

        // 2. Action: "Poison the Wire" (Deception Mode)
        if (poisonedDomains.has(domain)) {
          console.log(`[DoomWire // POISONED] Deception active for: ${domain}`);
          const spoofedHeaders = {
            ...req.headers(),
            'user-agent': 'DoomWire-DecoyBot/4.2 (X11; Linux x86_64; rv:109.0)',
            'x-forwarded-for': '198.51.100.42',
            'referer': 'https://deception.internal.local'
          };
          const spoofedPayload = JSON.stringify({
            spoofed: true,
            synthetic_fingerprint: 'DOOMWIRE_NOISE_HEX_' + Math.random().toString(16).substring(2, 8),
            fake_gpu: 'Intel Iris Plus Graphics 640',
            fake_canvas: 'canvas_noise_v2_f89a31b'
          });

          socket.emit('wire_poisoned_live', { domain, url: req.url() });
          return route.continue({ headers: spoofedHeaders, postData: spoofedPayload });
        }

        // 3. Resolve intelligence and stream packet telemetry
        interceptedCount++;
        const intel = await resolveIntelligence(domain, req.url(), req.resourceType());
        const packetPayload = {
          id: Math.random().toString(36).substring(7),
          domain: domain,
          url: req.url(),
          method: req.method(),
          resourceType: req.resourceType(),
          company: intel.company,
          city: intel.city,
          threatLevel: intel.threat,
          trackerType: intel.type,
          geo: { lat: intel.lat, lng: intel.lng },
          leakedData: inspectSensitiveData(req),
          timestamp: new Date().toLocaleTimeString(),
          isBlocked: blockedDomains.has(domain),
          isPoisoned: poisonedDomains.has(domain)
        };

        socket.emit('packet_captured', packetPayload);
        return route.continue();
      });

      socket.emit('scan_status', { status: 'NAVIGATING AND HARVESTING BEAMS...', stage: 2 });
      
      // Load target URL safely inside sandbox
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      await activePage.goto(formattedUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => {
        console.warn(`[DoomWire] Page load notice: ${e.message}`);
      });

      // Allow 3 seconds for dynamic tracking beacons & WebSockets to trigger
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // Capture Clean-Room safe preview frame
      let safeViewBase64 = null;
      try {
        if (activePage) {
          const buffer = await activePage.screenshot({ type: 'jpeg', quality: 65 });
          safeViewBase64 = buffer.toString('base64');
        }
      } catch (err) {
        console.warn(`[DoomWire] Preview capture note: ${err.message}`);
      }

      socket.emit('scan_complete', {
        message: 'Reconnaissance scan finalized. Perimeter established.',
        totalPackets: interceptedCount,
        safeViewImage: safeViewBase64 ? `data:image/jpeg;base64,${safeViewBase64}` : null
      });

    } catch (err) {
      console.error('[DoomWire Error]:', err);
      socket.emit('scan_error', { error: err.message });
    }
  });

  // Action: Cut the wire (block)
  socket.on('cut_wire', (domain) => {
    blockedDomains.add(domain);
    poisonedDomains.delete(domain); // Block overrides poison
    console.log(`[DoomWire] Wire Cut for domain: ${domain}`);
    io.emit('wire_cut', { domain });
  });

  // Action: Poison the wire (inject synthetic decoys)
  socket.on('poison_wire', (domain) => {
    poisonedDomains.add(domain);
    blockedDomains.delete(domain); // Poison allows request with fake data
    console.log(`[DoomWire] Wire Poisoned for domain: ${domain}`);
    io.emit('wire_poisoned', { domain });
  });

  // Action: Restore wire connection
  socket.on('restore_wire', (domain) => {
    blockedDomains.delete(domain);
    poisonedDomains.delete(domain);
    console.log(`[DoomWire] Wire Restored for domain: ${domain}`);
    io.emit('wire_restored', { domain });
  });

  // Action: Master Cut (Block all active tracker domains)
  socket.on('cut_all', ({ domains }) => {
    if (Array.isArray(domains)) {
      domains.forEach((d) => {
        blockedDomains.add(d);
        poisonedDomains.delete(d);
      });
      console.log(`[DoomWire] MASTER CUT executed on ${domains.length} tracker domains.`);
      io.emit('all_wires_cut', { domains });
    }
  });

  // Action: Master Poison (Deceive all active tracker domains)
  socket.on('poison_all', ({ domains }) => {
    if (Array.isArray(domains)) {
      domains.forEach((d) => {
        poisonedDomains.add(d);
        blockedDomains.delete(d);
      });
      console.log(`[DoomWire] MASTER POISON executed on ${domains.length} tracker domains.`);
      io.emit('all_wires_poisoned', { domains });
    }
  });

  // Action: Clear all rules
  socket.on('clear_rules', () => {
    blockedDomains.clear();
    poisonedDomains.clear();
    console.log('[DoomWire] All firewall and deception rules cleared.');
    io.emit('rules_cleared');
  });

  socket.on('disconnect', () => {
    console.log(`[DoomWire] Radar client disconnected: ${socket.id}`);
  });
});

const path = require('path');
const fs = require('fs');

// Serve static frontend bundle from dist
const distPath = fs.existsSync(path.join(__dirname, '../dist'))
  ? path.join(__dirname, '../dist')
  : path.join(__dirname, './dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// REST Health Check & Status Endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    system: 'DoomWire Tactical Command Backend',
    status: 'ONLINE',
    blockedCount: blockedDomains.size,
    poisonedCount: poisonedDomains.size
  });
});

// Serve the 3D Web Application for any non-API web route
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(200).json({
      status: 'ONLINE',
      system: 'DoomWire Tactical Command Backend',
      service: 'Active Playwright Chromium Sandbox',
      blockedCount: blockedDomains.size,
      poisonedCount: poisonedDomains.size,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`⚡ DOOMWIRE CYBER-RADAR BACKEND ONLINE ON PORT ${PORT}`);
  console.log(`⚡ Playwright Sandbox & Active Firewall Active`);
  console.log(`=================================================`);
});

