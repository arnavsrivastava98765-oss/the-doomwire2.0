const dns = require('dns').promises;
const geoip = require('geoip-lite');
const { isPrivateIp } = require('./security');
const { classifyThreat } = require('./classifier');
const { resolveTrackerEntity } = require('./trackerEntities');

// Comprehensive Tracker & Entity Intelligence Dictionary
const TRACKER_RADAR = {
  'google-analytics.com': { company: 'Google LLC', type: 'Analytics & Telemetry', threat: 'yellow', defaultCity: 'Mountain View, US', lat: 37.422, lng: -122.084 },
  'googletagmanager.com': { company: 'Google LLC', type: 'Tag Management & Trigger', threat: 'yellow', defaultCity: 'Mountain View, US', lat: 37.422, lng: -122.084 },
  'doubleclick.net': { company: 'Google / DoubleClick', type: 'Real-Time Ad Auction & Bidding', threat: 'red', defaultCity: 'Frankfurt, DE', lat: 50.1109, lng: 8.6821 },
  'googleadservices.com': { company: 'Google LLC', type: 'Conversion Tracking Beacon', threat: 'yellow', defaultCity: 'Council Bluffs, US', lat: 41.2619, lng: -95.8608 },
  'facebook.net': { company: 'Meta Platforms', type: 'Meta Social SDK & Analytics', threat: 'red', defaultCity: 'Dublin, IE', lat: 53.3498, lng: -6.2603 },
  'facebook.com': { company: 'Meta Platforms', type: 'Social Graph & Identity Gateway', threat: 'orange', defaultCity: 'Menlo Park, US', lat: 37.4538, lng: -122.1822 },
  'connect.facebook.net': { company: 'Meta Platforms', type: 'Social Graph & Pixel Beacon', threat: 'red', defaultCity: 'Dublin, IE', lat: 53.3498, lng: -6.2603 },
  'hotjar.com': { company: 'Hotjar Ltd.', type: 'Session Recording & Heatmap Analytics', threat: 'orange', defaultCity: 'St. Julian\'s, MT', lat: 35.9175, lng: 14.4883 },
  'clarity.ms': { company: 'Microsoft Corp', type: 'Session Replay & Interaction Analytics', threat: 'orange', defaultCity: 'Redmond, US', lat: 47.674, lng: -122.1215 },
  'criteo.com': { company: 'Criteo SA', type: 'Cross-Domain Behavioral Retargeter', threat: 'red', defaultCity: 'Paris, FR', lat: 48.8566, lng: 2.3522 },
  'criteo.net': { company: 'Criteo SA', type: 'Cross-Domain Retargeting Pixel', threat: 'red', defaultCity: 'Amsterdam, NL', lat: 52.3676, lng: 4.9041 },
  'yandex.ru': { company: 'Yandex LLC', type: 'Search & Web Analytics Platform', threat: 'yellow', defaultCity: 'Moscow, RU', lat: 55.7558, lng: 37.6173 },
  'yandex.net': { company: 'Yandex LLC', type: 'Behavioral Profiler', threat: 'red', defaultCity: 'Helsinki, FI', lat: 60.1699, lng: 24.9384 },
  'tiktok.com': { company: 'ByteDance Ltd.', type: 'Device Fingerprint Beacon', threat: 'orange', defaultCity: 'Singapore, SG', lat: 1.3521, lng: 103.8198 },
  'byteoversea.com': { company: 'ByteDance Ltd.', type: 'Cross-App Tracker', threat: 'orange', defaultCity: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
  'outbrain.com': { company: 'Outbrain Inc.', type: 'Native Content Profiler', threat: 'yellow', defaultCity: 'New York, US', lat: 40.7128, lng: -74.006 },
  'taboola.com': { company: 'Taboola Inc.', type: 'Content Recommendation Tracker', threat: 'yellow', defaultCity: 'Tel Aviv, IL', lat: 32.0853, lng: 34.7818 },
  'rubiconproject.com': { company: 'Magnite Inc.', type: 'Programmatic Ad Exchange', threat: 'red', defaultCity: 'Los Angeles, US', lat: 34.0522, lng: -118.2437 },
  'pubmatic.com': { company: 'PubMatic Inc.', type: 'Bidstream Data Broker', threat: 'red', defaultCity: 'Redwood City, US', lat: 37.4852, lng: -122.2364 },
  'adnxs.com': { company: 'AppNexus / Microsoft', type: 'Real-Time Bidder & Exchange', threat: 'red', defaultCity: 'Secaucus, US', lat: 40.7895, lng: -74.0565 },
  'casalemedia.com': { company: 'Index Exchange', type: 'Supply-Side Platform (SSP) & Exchange', threat: 'red', defaultCity: 'Toronto, CA', lat: 43.6532, lng: -79.3832 },
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

// Clean entity derivation (never invents "X Network")
function deriveCompanyFromDomain(domain, targetDomain) {
  const entity = resolveTrackerEntity(domain, targetDomain);
  return entity.company;
}

// In-memory DNS & Intelligence cache for ultra-fast, zero-latency lookups
const intelCache = new Map();

// DNS and Geo-IP resolution with dynamic intelligence & real tracker datasets
async function resolveIntelligence(domain, fullUrl = '', resourceType = 'other', targetDomain = '') {
  const cacheKey = `${domain}:${targetDomain || ''}`;
  if (intelCache.has(cacheKey)) {
    const cached = intelCache.get(cacheKey);
    return { ...cached, threat: classifyThreat(domain, fullUrl, resourceType) };
  }

  const entity = resolveTrackerEntity(domain, targetDomain);
  const threat = classifyThreat(domain, fullUrl, resourceType);

  let ip = null;
  let city = 'Unresolved / Multi-Cloud Anycast';
  let lat = null;
  let lng = null;
  let locationType = 'unresolved';

  // Live DNS & offline GeoIP lookup
  try {
    const lookup = await dns.lookup(domain);
    ip = lookup.address;

    if (!isPrivateIp(ip)) {
      const geo = geoip.lookup(ip);
      if (geo && geo.ll) {
        city = `${geo.city || 'Edge PoP'}, ${geo.country || 'Global'} (approx. IP-based)`;
        lat = geo.ll[0];
        lng = geo.ll[1];
        locationType = 'approximate_ip';
      } else {
        city = 'Anycast Cloud / Regional PoP (approx. IP-based)';
        locationType = 'anycast';
      }
    }
  } catch (e) {
    // DNS resolution failure
  }

  const result = {
    company: entity.company,
    city: city,
    lat: lat,
    lng: lng,
    ip: ip,
    locationType: locationType,
    party: entity.party,
    isThirdParty: entity.isThirdParty,
    isKnownTracker: entity.isKnownTracker,
    type: entity.category || (threat === 'red' ? 'Targeted Ad Delivery Node' : 'Origin / Edge CDN Server'),
    threat: threat
  };

  intelCache.set(cacheKey, result);
  return result;
}

module.exports = {
  TRACKER_RADAR,
  CCTLD_GEO_REGISTRY,
  GLOBAL_BRAND_REGISTRY,
  resolveTldOrBrand,
  deriveCompanyFromDomain,
  resolveIntelligence,
  intelCache
};

