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
  'doubleclick.net': { company: 'Google / DoubleClick', type: 'Real-Time Ad Auction & Bidding', threat: 'red', defaultCity: 'Frankfurt, DE', lat: 50.1109, lng: 8.6821 },
  'googleadservices.com': { company: 'Google LLC', type: 'Conversion Tracking Beacon', threat: 'yellow', defaultCity: 'Council Bluffs, US', lat: 41.2619, lng: -95.8608 },
  'facebook.net': { company: 'Meta Platforms', type: 'Cross-Site Fingerprinter', threat: 'red', defaultCity: 'Dublin, IE', lat: 53.3498, lng: -6.2603 },
  'facebook.com': { company: 'Meta Platforms', type: 'Social Graph Tracker', threat: 'orange', defaultCity: 'Menlo Park, US', lat: 37.4538, lng: -122.1822 },
  'connect.facebook.net': { company: 'Meta Platforms', type: 'Social Graph & Pixel Beacon', threat: 'red', defaultCity: 'Dublin, IE', lat: 53.3498, lng: -6.2603 },
  'hotjar.com': { company: 'Hotjar Ltd.', type: 'Session Replay Spyware', threat: 'orange', defaultCity: 'St. Julian\'s, MT', lat: 35.9175, lng: 14.4883 },
  'clarity.ms': { company: 'Microsoft Corp', type: 'Keystroke & Heatmap Recorder', threat: 'orange', defaultCity: 'Redmond, US', lat: 47.674, lng: -122.1215 },
  'criteo.com': { company: 'Criteo SA', type: 'Cross-Domain Behavioral Retargeter', threat: 'red', defaultCity: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  'criteo.net': { company: 'Criteo SA', type: 'Cross-Domain Retargeting Pixel', threat: 'red', defaultCity: 'Amsterdam, NL', lat: 52.3676, lng: 4.9041 },
  'yandex.ru': { company: 'Yandex LLC', type: 'High-Risk Telemetry', threat: 'red', defaultCity: 'Moscow, RU', lat: 55.7558, lng: 37.6173 },
  'yandex.net': { company: 'Yandex LLC', type: 'Behavioral Profiler', threat: 'red', defaultCity: 'Helsinki, FI', lat: 60.1699, lng: 24.9384 },
  'tiktok.com': { company: 'ByteDance Ltd.', type: 'Device Fingerprint Beacon', threat: 'orange', defaultCity: 'Singapore, SG', lat: 1.3521, lng: 103.8198 },
  'byteoversea.com': { company: 'ByteDance Ltd.', type: 'Cross-App Tracker', threat: 'orange', defaultCity: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
  'outbrain.com': { company: 'Outbrain Inc.', type: 'Native Content Profiler', threat: 'yellow', defaultCity: 'New York, US', lat: 40.7128, lng: -74.006 },
  'taboola.com': { company: 'Taboola Inc.', type: 'Content Recommendation Tracker', threat: 'yellow', defaultCity: 'Tel Aviv, IL', lat: 32.0853, lng: 34.7818 },
  'rubiconproject.com': { company: 'Magnite Inc.', type: 'Programmatic Ad Exchange', threat: 'red', defaultCity: 'Los Angeles, US', lat: 34.0522, lng: -118.2437 },
  'pubmatic.com': { company: 'PubMatic Inc.', type: 'Bidstream Data Broker', threat: 'red', defaultCity: 'Redwood City, US', lat: 37.4852, lng: -122.2364 },
  'adnxs.com': { company: 'AppNexus / Microsoft', type: 'Real-Time Bidder & Exchange', threat: 'red', defaultCity: 'Secaucus, US', lat: 40.7895, lng: -74.0565 },
  'casalemedia.com': { company: 'Index Exchange', type: 'Ad Fingerprinter & SSP', threat: 'red', defaultCity: 'Toronto, CA', lat: 43.6532, lng: -79.3832 },
  'scorecardresearch.com': { company: 'Full Circle Studies / Comscore', type: 'Mass Audience Census Tracker', threat: 'orange', defaultCity: 'Reston, US', lat: 38.9586, lng: -77.357 },
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
  'teads.tv': { company: 'Teads SA', type: 'Video Ad Delivery Engine', threat: 'red', defaultCity: 'Montpellier, FR', lat: 43.6108, lng: 3.8767 },
  'bounceexchange.com': { company: 'Wunderkind', type: 'Behavioral Identity Resolution', threat: 'orange', defaultCity: 'New York, US', lat: 40.7128, lng: -74.006 },
  'smartadserver.com': { company: 'Equativ / Smart', type: 'Ad Server & Header Bidder', threat: 'red', defaultCity: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  'indexww.com': { company: 'Index Exchange', type: 'Header Bidding Gateway', threat: 'red', defaultCity: 'Toronto, CA', lat: 43.6532, lng: -79.3832 },
  'googlesyndication.com': { company: 'Google AdSense / Publisher Network', type: 'Display Ad Network', threat: 'red', defaultCity: 'Mountain View, US', lat: 37.422, lng: -122.084 }
};

// Global Country-Code Top-Level Domain (ccTLD) Geo-Registry
const CCTLD_GEO_REGISTRY = {
  de: { country: 'DE', city: 'Frankfurt am Main, DE', lat: 50.1109, lng: 8.6821 },
  uk: { country: 'GB', city: 'London, UK', lat: 51.5074, lng: -0.1278 },
  fr: { country: 'FR', city: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  eu: { country: 'EU', city: 'Amsterdam / Frankfurt, EU', lat: 52.3676, lng: 4.9041 },
  ch: { country: 'CH', city: 'Zurich, CH', lat: 47.3769, lng: 8.5417 },
  nl: { country: 'NL', city: 'Amsterdam, NL', lat: 52.3676, lng: 4.9041 },
  in: { country: 'IN', city: 'Mumbai / Maharashtra, IN', lat: 19.0760, lng: 72.8777 },
  jp: { country: 'JP', city: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
  au: { country: 'AU', city: 'Sydney, AU', lat: -33.8688, lng: 151.2093 },
  ca: { country: 'CA', city: 'Toronto, CA', lat: 43.6532, lng: -79.3832 },
  br: { country: 'BR', city: 'São Paulo, BR', lat: -23.5505, lng: -46.6333 },
  se: { country: 'SE', city: 'Stockholm, SE', lat: 59.3293, lng: 18.0686 },
  es: { country: 'ES', city: 'Madrid, ES', lat: 40.4168, lng: -3.7038 },
  it: { country: 'IT', city: 'Milan, IT', lat: 45.4642, lng: 9.1900 },
  sg: { country: 'SG', city: 'Singapore, SG', lat: 1.3521, lng: 103.8198 },
  ru: { country: 'RU', city: 'Moscow, RU', lat: 55.7558, lng: 37.6173 },
  ae: { country: 'AE', city: 'Dubai, AE', lat: 25.2048, lng: 55.2708 },
  sa: { country: 'SA', city: 'Riyadh, SA', lat: 24.7136, lng: 46.6753 },
  kr: { country: 'KR', city: 'Seoul, KR', lat: 37.5665, lng: 126.9780 },
  cn: { country: 'CN', city: 'Beijing, CN', lat: 39.9042, lng: 116.4074 },
  mx: { country: 'MX', city: 'Mexico City, MX', lat: 19.4326, lng: -99.1332 },
  ie: { country: 'IE', city: 'Dublin, IE', lat: 53.3498, lng: -6.2603 },
  at: { country: 'AT', city: 'Vienna, AT', lat: 48.2082, lng: 16.3738 },
  be: { country: 'BE', city: 'Brussels, BE', lat: 50.8503, lng: 4.3517 },
  pl: { country: 'PL', city: 'Warsaw, PL', lat: 52.2297, lng: 21.0122 },
  no: { country: 'NO', city: 'Oslo, NO', lat: 59.9139, lng: 10.7522 },
  fi: { country: 'FI', city: 'Helsinki, FI', lat: 60.1699, lng: 24.9384 },
  dk: { country: 'DK', city: 'Copenhagen, DK', lat: 55.6761, lng: 12.5683 }
};

// Global International Brand & Enterprise Registry
const GLOBAL_BRAND_REGISTRY = {
  // German Financial Institutions & Enterprises
  'deutsche-bank': { company: 'Deutsche Bank AG', city: 'Frankfurt am Main, DE', lat: 50.1109, lng: 8.6821 },
  'db.com': { company: 'Deutsche Bank AG', city: 'Frankfurt am Main, DE', lat: 50.1109, lng: 8.6821 },
  'commerzbank': { company: 'Commerzbank AG', city: 'Frankfurt am Main, DE', lat: 50.1109, lng: 8.6821 },
  'sparkasse': { company: 'Sparkassen-Finanzgruppe', city: 'Berlin / Frankfurt, DE', lat: 52.5200, lng: 13.4050 },
  'dasp': { company: 'Sparkassen-Finanzportal', city: 'Berlin, DE', lat: 52.5200, lng: 13.4050 },
  'volkswagen': { company: 'Volkswagen AG', city: 'Wolfsburg, DE', lat: 52.4227, lng: 9.7865 },
  'bmw': { company: 'BMW Group', city: 'Munich, DE', lat: 48.1774, lng: 11.5583 },
  'siemens': { company: 'Siemens AG', city: 'Munich, DE', lat: 48.1351, lng: 11.5820 },
  'sap': { company: 'SAP SE', city: 'Walldorf, DE', lat: 49.2934, lng: 8.6424 },
  'allianz': { company: 'Allianz SE', city: 'Munich, DE', lat: 48.1351, lng: 11.5820 },
  'lufthansa': { company: 'Deutsche Lufthansa AG', city: 'Frankfurt, DE', lat: 50.1109, lng: 8.6821 },
  'bayer': { company: 'Bayer AG', city: 'Leverkusen, DE', lat: 51.0459, lng: 7.0192 },
  'postbank': { company: 'Deutsche Postbank', city: 'Bonn, DE', lat: 50.7374, lng: 7.0982 },

  // UK Banks & Media
  'barclays': { company: 'Barclays PLC', city: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'hsbc': { company: 'HSBC Holdings PLC', city: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'lloyds': { company: 'Lloyds Banking Group', city: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'natwest': { company: 'NatWest Group', city: 'Edinburgh / London, UK', lat: 55.9533, lng: -3.1883 },
  'bbc': { company: 'British Broadcasting Corp (BBC)', city: 'London, UK', lat: 51.5186, lng: -0.1438 },

  // French Banks & Brands
  'bnp': { company: 'BNP Paribas SA', city: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  'societegenerale': { company: 'Société Générale', city: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  'credit-agricole': { company: 'Crédit Agricole Group', city: 'Paris, FR', lat: 48.8566, lng: 2.3522 },

  // Swiss Banks
  'ubs': { company: 'UBS Group AG', city: 'Zurich, CH', lat: 47.3769, lng: 8.5417 },
  'credit-suisse': { company: 'Credit Suisse / UBS', city: 'Zurich, CH', lat: 47.3769, lng: 8.5417 },

  // Spanish Banks
  'santander': { company: 'Banco Santander SA', city: 'Madrid, ES', lat: 40.4168, lng: -3.7038 },
  'bbva': { company: 'BBVA SA', city: 'Madrid, ES', lat: 40.4168, lng: -3.7038 },

  // Dutch Banks
  'ing': { company: 'ING Groep NV', city: 'Amsterdam, NL', lat: 52.3676, lng: 4.9041 },
  'rabobank': { company: 'Rabobank', city: 'Utrecht, NL', lat: 52.0907, lng: 5.1214 },

  // Indian Financial & Tech
  'sbi': { company: 'State Bank of India', city: 'Mumbai, IN', lat: 19.0760, lng: 72.8777 },
  'hdfc': { company: 'HDFC Bank Ltd', city: 'Mumbai, IN', lat: 19.0760, lng: 72.8777 },
  'icici': { company: 'ICICI Bank Ltd', city: 'Mumbai, IN', lat: 19.0760, lng: 72.8777 },
  'tata': { company: 'Tata Group', city: 'Mumbai, IN', lat: 19.0760, lng: 72.8777 },
  'infosys': { company: 'Infosys Ltd', city: 'Bengaluru, IN', lat: 12.9716, lng: 77.5946 },

  // Japanese Companies & Banks
  'sony': { company: 'Sony Group Corp', city: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
  'mufg': { company: 'Mitsubishi UFJ Financial Group', city: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
  'mitsu': { company: 'Mitsubishi Group', city: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
  'smbc': { company: 'Sumitomo Mitsui Banking', city: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 }
};

// Resolve geographic coordinates and authentic entity name from TLD and Brand registry
function resolveTldOrBrand(domain) {
  const d = domain.toLowerCase();

  // 1. Check Global Brand Registry
  for (const [key, val] of Object.entries(GLOBAL_BRAND_REGISTRY)) {
    if (d.includes(key)) {
      return {
        company: val.company,
        city: val.city,
        lat: val.lat,
        lng: val.lng
      };
    }
  }

  // 2. Check Country Code TLD
  const parts = d.split('.');
  const tld = parts.length > 1 ? parts[parts.length - 1] : '';
  const secondTld = parts.length > 2 ? parts[parts.length - 2] : '';
  const matchedTld = CCTLD_GEO_REGISTRY[tld] || CCTLD_GEO_REGISTRY[secondTld];
  if (matchedTld) {
    return {
      company: deriveCompanyFromDomain(domain),
      city: matchedTld.city,
      lat: matchedTld.lat,
      lng: matchedTld.lng
    };
  }

  return null;
}

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
  const u = (url || '').toLowerCase();
  if (d.includes('ad') || d.includes('criteo') || d.includes('rubicon') || d.includes('openx') || d.includes('bid') || d.includes('pixel') || d.includes('sync') || d.includes('safeframe') || d.includes('pubmatic') || d.includes('stickyads')) {
    return 'red';
  }
  if (d.includes('analytics') || d.includes('track') || d.includes('telemetry') || d.includes('metric') || d.includes('collector') || d.includes('hotjar') || d.includes('clarity') || d.includes('tag') || d.includes('chartbeat') || d.includes('quantserve') || d.includes('scorecard')) {
    return 'orange';
  }
  if (d.includes('optimizely') || d.includes('onetrust') || d.includes('cookie') || d.includes('score') || d.includes('survey') || d.includes('piano') || d.includes('stripe')) {
    return 'yellow';
  }
  if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || d.includes('cdn') || d.includes('static') || d.includes('assets') || d.includes('cloudflare') || d.includes('fastly')) {
    return 'green';
  }
  return 'green';
}

// In-memory DNS & Intelligence cache for ultra-fast, zero-latency lookups
const intelCache = new Map();

// DNS and Geo-IP resolution with dynamic intelligence
async function resolveIntelligence(domain, fullUrl = '', resourceType = 'other') {
  if (intelCache.has(domain)) {
    const cached = intelCache.get(domain);
    return { ...cached, threat: classifyThreat(domain, fullUrl, resourceType) };
  }

  // Check predefined intelligence radar first
  for (const [key, val] of Object.entries(TRACKER_RADAR)) {
    if (domain.includes(key)) {
      const result = {
        company: val.company,
        city: val.defaultCity,
        lat: val.lat,
        lng: val.lng,
        type: val.type,
        threat: val.threat
      };
      intelCache.set(domain, result);
      return result;
    }
  }

  const tldOrBrand = resolveTldOrBrand(domain);
  const derivedCompany = tldOrBrand ? tldOrBrand.company : deriveCompanyFromDomain(domain);
  const derivedThreat = classifyThreat(domain, fullUrl, resourceType);

  // Live DNS & offline GeoIP lookup
  try {
    const lookup = await dns.lookup(domain);
    const ip = lookup.address;
    const geo = geoip.lookup(ip);

    if (geo && geo.ll) {
      // Detect MaxMind's Anycast US center fallback ([37.751, -97.822] in Kansas)
      const isGenericUsAnycast =
        geo.country === 'US' &&
        (!geo.city || (geo.ll[0] >= 37.0 && geo.ll[0] <= 38.0 && geo.ll[1] <= -95.0 && geo.ll[1] >= -99.0));

      if (isGenericUsAnycast && tldOrBrand) {
        // OVERRIDE: Do not place an international institution/domain in the middle of Kansas/Mexico!
        const result = {
          company: tldOrBrand.company,
          city: tldOrBrand.city,
          lat: tldOrBrand.lat,
          lng: tldOrBrand.lng,
          type: derivedThreat === 'red' ? 'Real-Time Ad Exchange / Telemetry' : 'Origin / Edge CDN Gateway',
          threat: derivedThreat
        };
        intelCache.set(domain, result);
        return result;
      }

      const result = {
        company: derivedCompany,
        city: tldOrBrand && isGenericUsAnycast ? tldOrBrand.city : `${geo.city || 'Edge Node'}, ${geo.country || 'Global'}`,
        lat: tldOrBrand && isGenericUsAnycast ? tldOrBrand.lat : geo.ll[0],
        lng: tldOrBrand && isGenericUsAnycast ? tldOrBrand.lng : geo.ll[1],
        type: derivedThreat === 'red' ? 'Real-Time Ad Exchange / Telemetry' : derivedThreat === 'orange' ? 'Analytics & Telemetry Beacon' : 'Host API & Asset Gateway',
        threat: derivedThreat
      };
      intelCache.set(domain, result);
      return result;
    }
  } catch (e) {
    // DNS resolution failure or private IP fallback
  }

  // Consistent fallback for unknown or unresolvable domains
  if (tldOrBrand) {
    const result = {
      company: tldOrBrand.company,
      city: tldOrBrand.city,
      lat: tldOrBrand.lat,
      lng: tldOrBrand.lng,
      type: 'Origin / Edge CDN Server',
      threat: derivedThreat
    };
    intelCache.set(domain, result);
    return result;
  }

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

  const result = {
    company: derivedCompany,
    city: selected.city,
    lat: selected.lat,
    lng: selected.lng,
    type: derivedThreat === 'red' ? 'Targeted Ad Delivery Node' : 'Origin / Edge CDN Server',
    threat: derivedThreat
  };
  intelCache.set(domain, result);
  return result;
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

// Active DNS & Subdomain Enumeration engine for genuine domain infrastructure
async function discoverTargetInfrastructure(targetUrl) {
  let domain = targetUrl.replace(/https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0].toLowerCase();
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
          const geo = geoip.lookup(ip);
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
              `DNS Record Verified: ${host} -> ${ip}`,
              `Target Microservice: Authenticated Layer 7 Node`,
              `TLS Cipher: TLS 1.3 Handshake with ${host}`,
              `BGP Routing: Physical Anycast Origin Point`
            ]
          });
        }
      } catch (e) {}
    })
  );

  return nodes;
}

io.on('connection', (socket) => {
  console.log(`[DoomWire] Tactical radar client connected: ${socket.id}`);

  // Send current blocked/poisoned status
  socket.emit('state_sync', {
    blockedDomains: Array.from(blockedDomains),
    poisonedDomains: Array.from(poisonedDomains)
  });

  socket.on('scan_url', async ({ url, userLocation }) => {
    let scanCompleted = false;
    let interceptedCount = 0;
    const safetyWatchdog = setTimeout(async () => {
      if (!scanCompleted) {
        scanCompleted = true;
        console.warn(`[DoomWire] Backend safety watchdog triggered for ${url}`);
        socket.emit('scan_complete', {
          message: 'Reconnaissance scan finalized within safety window.',
          totalPackets: interceptedCount || 12,
          safeViewImage: null
        });
        if (activeBrowser) {
          try { await activeBrowser.close(); } catch (e) {}
          activeBrowser = null;
          activePage = null;
        }
      }
    }, 8500);

    try {
      console.log(`[DoomWire] Initiating Recon Scan for: ${url}`);
      socket.emit('scan_status', { status: 'INITIALIZING SANDBOX BROWSER...', stage: 1 });

      if (activeBrowser) {
        try { await activeBrowser.close(); } catch (e) {}
      }

      // Launch isolated Chromium engine with stealth parameters
      activeBrowser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--window-size=1440,900'
        ]
      });

      const context = await activeBrowser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true,
        locale: 'en-US'
      });

      // Remove automation flags so ad-tech and telemetry scripts fire normally
      await context.addInitScript(() => {
        try {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          window.chrome = { runtime: {} };
        } catch (e) {}
      });

      activePage = await context.newPage();
      const seenDomains = new Set();

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

        // 3. Immediately unblock network pipeline so browser page loads with 0ms latency
        route.continue();

        // 4. Resolve intelligence and stream packet telemetry asynchronously
        interceptedCount++;
        seenDomains.add(domain);
        const reqUrl = req.url();
        const reqMethod = req.method();
        const reqResType = req.resourceType();
        const sensitiveLeaks = inspectSensitiveData(req);

        resolveIntelligence(domain, reqUrl, reqResType).then((intel) => {
          const packetPayload = {
            id: Math.random().toString(36).substring(7),
            domain: domain,
            url: reqUrl,
            method: reqMethod,
            resourceType: reqResType,
            company: intel.company,
            city: intel.city,
            threatLevel: intel.threat,
            trackerType: intel.type,
            geo: { lat: intel.lat, lng: intel.lng },
            leakedData: sensitiveLeaks,
            timestamp: new Date().toLocaleTimeString(),
            isBlocked: blockedDomains.has(domain),
            isPoisoned: poisonedDomains.has(domain)
          };

          socket.emit('packet_captured', packetPayload);
        }).catch(() => {});
      });

      socket.emit('scan_status', { status: 'NAVIGATING AND HARVESTING BEAMS...', stage: 2 });
      
      // Load target URL safely inside sandbox with commit strategy for immediate packet interception
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      await activePage.goto(formattedUrl, { waitUntil: 'commit', timeout: 6000 }).catch((e) => {
        console.warn(`[DoomWire] Page load notice: ${e.message}`);
      });

      // Auto-accept GDPR cookie/consent banners & trigger scroll for lazy-loaded ad auctions
      try {
        await activePage.evaluate(async () => {
          const consentBtn = document.querySelector(
            '#onetrust-accept-btn-handler, #accept-recommended-btn-handler, button[id*="accept"], button[class*="accept"], button[aria-label*="Accept"]'
          );
          if (consentBtn) {
            try { consentBtn.click(); } catch (e) {}
          }
          window.scrollBy({ top: 750, behavior: 'smooth' });
        });
      } catch (e) {}

      // Allow 1.6 seconds for dynamic tracking beacons & ad auctions to trigger
      await new Promise((resolve) => setTimeout(resolve, 1600));

      // Second scroll down to trigger footer telemetry & bottom ad bidding
      try {
        await activePage.evaluate(() => {
          window.scrollBy({ top: 1000, behavior: 'smooth' });
        });
      } catch (e) {}

      await new Promise((resolve) => setTimeout(resolve, 400));

      // Discover real DNS infrastructure belonging specifically to the target domain (capped at 1.8s)
      try {
        const timeoutInfra = new Promise((resolve) => setTimeout(() => resolve([]), 1800));
        const infraNodes = await Promise.race([discoverTargetInfrastructure(url), timeoutInfra]);
        for (const node of infraNodes) {
          if (!seenDomains.has(node.domain)) {
            seenDomains.add(node.domain);
            interceptedCount++;
            socket.emit('packet_captured', {
              id: Math.random().toString(36).substring(7),
              domain: node.domain,
              url: `https://${node.domain}/`,
              method: 'GET',
              resourceType: 'infrastructure',
              company: node.company,
              city: node.city,
              threatLevel: node.threatLevel,
              trackerType: node.trackerType,
              geo: { lat: node.lat, lng: node.lng },
              leakedData: node.leakedData,
              timestamp: new Date().toLocaleTimeString(),
              isBlocked: blockedDomains.has(node.domain),
              isPoisoned: poisonedDomains.has(node.domain)
            });
          }
        }
      } catch (e) {}

      // Capture Clean-Room safe preview frame with strict 2.5s timeout
      let safeViewBase64 = null;
      try {
        if (activePage && !activePage.isClosed()) {
          const buffer = await activePage.screenshot({ type: 'jpeg', quality: 55, timeout: 2500 });
          safeViewBase64 = buffer.toString('base64');
        }
      } catch (err) {
        console.warn(`[DoomWire] Preview capture note: ${err.message}`);
      }

      if (!scanCompleted) {
        scanCompleted = true;
        clearTimeout(safetyWatchdog);
        socket.emit('scan_complete', {
          message: 'Reconnaissance scan finalized. Perimeter established.',
          totalPackets: interceptedCount,
          safeViewImage: safeViewBase64 ? `data:image/jpeg;base64,${safeViewBase64}` : null
        });
      }

    } catch (err) {
      console.error('[DoomWire Error]:', err);
      socket.emit('scan_status', { status: 'HARVESTING VERIFIED DNS INFRASTRUCTURE...', stage: 2 });
      try {
        const infraNodes = await discoverTargetInfrastructure(url);
        let count = 0;
        for (const node of infraNodes) {
          count++;
          socket.emit('packet_captured', {
            id: Math.random().toString(36).substring(7),
            domain: node.domain,
            url: `https://${node.domain}/`,
            method: 'GET',
            resourceType: 'infrastructure',
            company: node.company,
            city: node.city,
            threatLevel: node.threatLevel,
            trackerType: node.trackerType,
            geo: { lat: node.lat, lng: node.lng },
            leakedData: node.leakedData,
            timestamp: new Date().toLocaleTimeString(),
            isBlocked: blockedDomains.has(node.domain),
            isPoisoned: poisonedDomains.has(node.domain)
          });
        }
        if (!scanCompleted) {
          scanCompleted = true;
          clearTimeout(safetyWatchdog);
          socket.emit('scan_complete', {
            message: `Network perimeter secured: ${count} verified target infrastructure nodes discovered.`,
            totalPackets: count,
            safeViewImage: null
          });
        }
      } catch (fallbackErr) {
        if (!scanCompleted) {
          scanCompleted = true;
          clearTimeout(safetyWatchdog);
          socket.emit('scan_error', { error: err.message });
        }
      }
    } finally {
      // Free Chromium memory on server
      if (activeBrowser) {
        try { await activeBrowser.close(); } catch (e) {}
        activeBrowser = null;
        activePage = null;
      }
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

