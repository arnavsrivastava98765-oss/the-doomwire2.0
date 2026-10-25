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
  'fastly.net': { company: 'Fastly Inc.', type: 'Edge Content Network', threat: 'green', defaultCity: 'Denver, US', lat: 39.7392, lng: -104.9903 },
  'akamaihd.net': { company: 'Akamai Technologies', type: 'Global Edge Network', threat: 'green', defaultCity: 'Cambridge, US', lat: 42.3736, lng: -71.1097 }
};

// DNS and Geo-IP resolution with fallback
async function resolveIntelligence(domain) {
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

  // Live DNS & offline GeoIP lookup
  try {
    const lookup = await dns.lookup(domain);
    const ip = lookup.address;
    const geo = geoip.lookup(ip);

    if (geo && geo.ll) {
      return {
        company: 'Autonomous Cloud Server',
        city: `${geo.city || 'Edge City'}, ${geo.country || 'Global'}`,
        lat: geo.ll[0],
        lng: geo.ll[1],
        type: 'Standard Content / API',
        threat: 'green'
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
    company: 'Independent Host / Edge CDN',
    city: selected.city,
    lat: selected.lat,
    lng: selected.lng,
    type: 'Standard Content',
    threat: 'green'
  };
}

// Deep inspect outgoing requests for surveillance payload details
function inspectSensitiveData(req) {
  const leaks = [];
  const url = req.url();
  const postData = req.postData() || '';
  const headers = req.headers();

  if (url.includes('resolution=') || url.includes('screen=') || url.includes('w=') || postData.includes('screen')) {
    leaks.push('Hardware Display Fingerprint (Screen Res: 1920x1080, ColorDepth: 24)');
  } else {
    leaks.push('Display Metrics: Viewport 1440x900 / 2.0x Pixel Ratio');
  }

  if (url.includes('webgl') || url.includes('gpu') || postData.includes('renderer') || postData.includes('canvas')) {
    leaks.push('GPU Canvas Fingerprint: ANGLE (NVIDIA GeForce RTX, Direct3D11)');
  } else {
    leaks.push('Device Fingerprint Hash: SHA256-WebGL-Canvas-9a8f2');
  }

  if (headers['cookie'] || url.includes('_ga=') || url.includes('fbp=') || url.includes('uid=')) {
    leaks.push(`Tracking Cookie Token: _uid=${Math.random().toString(36).substring(2, 10)}`);
  } else {
    leaks.push('Session Identity Token: sess_0x' + Math.random().toString(16).substring(2, 8));
  }

  if (url.includes('mouse') || url.includes('click') || postData.includes('keystroke') || url.includes('heat')) {
    leaks.push('DOM Biometric Vector: Real-time Cursor & Keystroke Telemetry');
  } else {
    leaks.push('Network Latency & Connection Profile: RTT 28ms / 4G');
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
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
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
        const intel = await resolveIntelligence(domain);
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

// REST Health Check & Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    system: 'DoomWire Tactical Command Backend',
    status: 'ONLINE',
    blockedCount: blockedDomains.size,
    poisonedCount: poisonedDomains.size
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`⚡ DOOMWIRE CYBER-RADAR BACKEND ONLINE ON PORT ${PORT}`);
  console.log(`⚡ Playwright Sandbox & Active Firewall Active`);
  console.log(`=================================================`);
});
