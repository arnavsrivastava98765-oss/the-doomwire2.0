// backend/classifier.js
// High-precision registered domain classification (eliminates substring false positives)

// Known Registered Domain Classifications
const KNOWN_AD_DOMAINS = new Set([
  'doubleclick.net', 'criteo.com', 'criteo.net', 'rubiconproject.com', 'openx.net',
  'pubmatic.com', 'adnxs.com', 'taboola.com', 'outbrain.com', 'id5-sync.com',
  'teads.tv', 'smartadserver.com', 'casalemedia.com', 'indexww.com', 'googlesyndication.com',
  'amazon-adsystem.com', 'bidswitch.net', 'adroll.com', 'appnexus.com', 'sovrn.com',
  'yieldmo.com', 'triplelift.com', 'sharethrough.com', 'magnite.com'
]);

const KNOWN_SESSION_REPLAY_DOMAINS = new Set([
  'hotjar.com', 'clarity.ms', 'fullstory.com', 'logrocket.com', 'smartlook.com',
  'mouseflow.com', 'inspectlet.com', 'crazyegg.com'
]);

const KNOWN_ANALYTICS_DOMAINS = new Set([
  'google-analytics.com', 'googletagmanager.com', 'googleadservices.com',
  'optimizely.com', 'onetrust.com', 'onetrust.io', 'cookiebot.com', 'segment.io',
  'datadoghq.com', 'sentry.io', 'mixpanel.com', 'heap.io', 'amplitude.com',
  'scorecardresearch.com', 'quantserve.com', 'chartbeat.com', 'newrelic.com',
  'branch.io', 'appsflyer.com', 'adjust.com', 'intercom.io'
]);

const KNOWN_CDN_DOMAINS = new Set([
  'cloudfront.net', 'cloudflare.com', 'cloudflare.net', 'fastly.net', 'fastly.com',
  'akamaihd.net', 'akamaized.net', 'akamai.net', 'jsdelivr.net', 'unpkg.com',
  'cdnjs.cloudflare.com', 'googleapis.com', 'gstatic.com', 'githubassets.com',
  'ytimg.com', 'twimg.com', 'wp.com', 'fbcdn.net'
]);

// Extract registered base domain (e.g. "sub.example.co.uk" -> "example.co.uk", "cdn.adobe.com" -> "adobe.com")
function getRegistrableDomain(hostname) {
  if (!hostname || typeof hostname !== 'string') return '';
  const clean = hostname.toLowerCase().trim().replace(/^www\./, '');
  const parts = clean.split('.');
  if (parts.length <= 2) return clean;

  // Handle common two-part TLDs (co.uk, com.au, co.in, etc.)
  const secondLevelTlds = new Set(['co.uk', 'com.au', 'co.in', 'com.br', 'co.jp', 'org.uk', 'gov.uk', 'edu.au']);
  const lastTwo = parts.slice(-2).join('.');
  if (secondLevelTlds.has(lastTwo) && parts.length > 2) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}

/**
 * Classifies network endpoints using exact registered domain matching and dot-bounded labels.
 * NEVER uses unrestricted substring matching (e.g. d.includes('ad') which broke adobe, upload, download, reader).
 */
function classifyThreat(hostname, url = '', resourceType = 'other') {
  if (!hostname) return 'green';
  const cleanHost = hostname.toLowerCase().trim().replace(/^www\./, '');
  const regDomain = getRegistrableDomain(cleanHost);

  // 1. Static Content Types are always Green
  if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media') {
    return 'green';
  }

  // 2. Known CDNs are always Green
  if (KNOWN_CDN_DOMAINS.has(regDomain) || KNOWN_CDN_DOMAINS.has(cleanHost)) {
    return 'green';
  }

  // 3. Exact Registered Domain Lookups
  if (KNOWN_AD_DOMAINS.has(regDomain) || KNOWN_AD_DOMAINS.has(cleanHost)) {
    return 'red';
  }
  if (KNOWN_SESSION_REPLAY_DOMAINS.has(regDomain) || KNOWN_SESSION_REPLAY_DOMAINS.has(cleanHost)) {
    return 'orange';
  }
  if (KNOWN_ANALYTICS_DOMAINS.has(regDomain) || KNOWN_ANALYTICS_DOMAINS.has(cleanHost)) {
    return 'yellow';
  }

  // 4. Dot-Bounded Subdomain Heuristics (matches "ads.site.com", "adserver.site.com", NOT "adobe.com", "download.com", "stage.com")
  const subLabels = cleanHost.split('.');
  // Check prefix or specific subdomain labels
  for (let i = 0; i < subLabels.length - 2; i++) {
    const label = subLabels[i];
    if (label === 'ads' || label === 'adserver' || label === 'bid' || label === 'bidding' || label === 'pixel' || label === 'adservice') {
      return 'red';
    }
    if (label === 'replay' || label === 'heatmaps' || label === 'recording') {
      return 'orange';
    }
    if (label === 'analytics' || label === 'telemetry' || label === 'metrics' || label === 'tracking' || label === 'collector') {
      return 'yellow';
    }
  }

  // 5. Default is clean green
  return 'green';
}

module.exports = {
  classifyThreat,
  getRegistrableDomain,
  KNOWN_AD_DOMAINS,
  KNOWN_SESSION_REPLAY_DOMAINS,
  KNOWN_ANALYTICS_DOMAINS,
  KNOWN_CDN_DOMAINS
};

