// backend/trackerEntities.js
// Curated DuckDuckGo Tracker Radar Entity Dataset & First/Third-Party Detection

const { getRegistrableDomain } = require('./classifier');

// Curated DuckDuckGo Tracker Radar Entity Definitions
const TRACKER_RADAR_ENTITIES = {
  // Alphabet / Google
  'google.com': { company: 'Google LLC', category: 'Analytics / Advertising' },
  'google-analytics.com': { company: 'Google LLC', category: 'Web Analytics' },
  'googletagmanager.com': { company: 'Google LLC', category: 'Tag Management' },
  'doubleclick.net': { company: 'Google LLC', category: 'Programmatic Advertising' },
  'googleadservices.com': { company: 'Google LLC', category: 'Ad Conversion Tracking' },
  'googlesyndication.com': { company: 'Google LLC', category: 'Display Advertising' },
  '2mdn.net': { company: 'Google LLC', category: 'Ad Delivery CDN' },
  'gstatic.com': { company: 'Google LLC', category: 'Content Delivery Network' },
  'googleapis.com': { company: 'Google LLC', category: 'API Infrastructure' },
  'youtube.com': { company: 'Google LLC', category: 'Media Streaming' },
  'ytimg.com': { company: 'Google LLC', category: 'Media CDN' },
  'googlevideo.com': { company: 'Google LLC', category: 'Video Streaming Edge' },

  // Meta Platforms
  'facebook.com': { company: 'Meta Platforms, Inc.', category: 'Social Media / Identity' },
  'facebook.net': { company: 'Meta Platforms, Inc.', category: 'Social SDK & Analytics' },
  'connect.facebook.net': { company: 'Meta Platforms, Inc.', category: 'Social Graph / Pixel' },
  'instagram.com': { company: 'Meta Platforms, Inc.', category: 'Social Media' },
  'cdninstagram.com': { company: 'Meta Platforms, Inc.', category: 'Media CDN' },
  'whatsapp.com': { company: 'Meta Platforms, Inc.', category: 'Messaging Platform' },
  'whatsapp.net': { company: 'Meta Platforms, Inc.', category: 'Messaging CDN' },

  // Amazon
  'amazon.com': { company: 'Amazon.com, Inc.', category: 'E-Commerce / Cloud' },
  'amazon-adsystem.com': { company: 'Amazon.com, Inc.', category: 'Programmatic Advertising' },
  'cloudfront.net': { company: 'Amazon.com, Inc. (AWS)', category: 'Content Delivery Network' },
  'aws': { company: 'Amazon.com, Inc. (AWS)', category: 'Cloud Infrastructure' },

  // Microsoft
  'microsoft.com': { company: 'Microsoft Corporation', category: 'Software & Cloud' },
  'clarity.ms': { company: 'Microsoft Corporation', category: 'Session Recording Analytics' },
  'bing.com': { company: 'Microsoft Corporation', category: 'Search & Telemetry' },
  'adnxs.com': { company: 'Microsoft Corporation (Xandr)', category: 'Programmatic Ad Exchange' },
  'github.com': { company: 'Microsoft Corporation (GitHub)', category: 'Developer Platform' },
  'githubassets.com': { company: 'Microsoft Corporation (GitHub)', category: 'Static CDN' },

  // Independent Ad Exchanges & DSPs/SSPs
  'criteo.com': { company: 'Criteo S.A.', category: 'Dynamic Retargeting' },
  'criteo.net': { company: 'Criteo S.A.', category: 'Retargeting Network' },
  'pubmatic.com': { company: 'PubMatic, Inc.', category: 'Supply-Side Platform (SSP)' },
  'rubiconproject.com': { company: 'Magnite, Inc.', category: 'Ad Exchange' },
  'openx.net': { company: 'OpenX Technologies, Inc.', category: 'Ad Exchange' },
  'taboola.com': { company: 'Taboola, Inc.', category: 'Content Recommendation' },
  'outbrain.com': { company: 'Outbrain Inc.', category: 'Content Recommendation' },
  'casalemedia.com': { company: 'Index Exchange Inc.', category: 'Ad Exchange' },
  'indexww.com': { company: 'Index Exchange Inc.', category: 'Header Bidding' },
  'id5-sync.com': { company: 'ID5 Technology SAS', category: 'Universal Identity Sync' },
  'teads.tv': { company: 'Teads S.A.', category: 'Video Advertising' },
  'smartadserver.com': { company: 'Equativ', category: 'Ad Server' },
  'thetradedesk.com': { company: 'The Trade Desk, Inc.', category: 'Demand-Side Platform (DSP)' },
  'liveramp.com': { company: 'LiveRamp, Inc.', category: 'Identity Resolution' },

  // Analytics & Measurement
  'hotjar.com': { company: 'Hotjar Ltd.', category: 'Session Recording & Heatmaps' },
  'scorecardresearch.com': { company: 'Comscore, Inc.', category: 'Audience Measurement' },
  'quantserve.com': { company: 'Quantcast Corporation', category: 'Audience Measurement' },
  'chartbeat.com': { company: 'Chartbeat, Inc.', category: 'Editorial Analytics' },
  'segment.io': { company: 'Twilio Inc. (Segment)', category: 'Customer Data Platform' },
  'newrelic.com': { company: 'New Relic, Inc.', category: 'Application Performance Monitoring' },
  'datadoghq.com': { company: 'Datadog, Inc.', category: 'Cloud Monitoring & Telemetry' },
  'sentry.io': { company: 'Functional Software, Inc.', category: 'Error Diagnostic Telemetry' },
  'optimizely.com': { company: 'Optimizely, Inc.', category: 'A/B Testing & Personalization' },
  'onetrust.com': { company: 'OneTrust LLC', category: 'Consent Management (CMP)' },
  'onetrust.io': { company: 'OneTrust LLC', category: 'Consent Management (CMP)' },
  'cookiebot.com': { company: 'Usercentrics A/S', category: 'Consent Management (CMP)' },

  // Content Delivery Networks
  'cloudflare.com': { company: 'Cloudflare, Inc.', category: 'CDN & Edge Security' },
  'cloudflare.net': { company: 'Cloudflare, Inc.', category: 'CDN Anycast Network' },
  'fastly.net': { company: 'Fastly, Inc.', category: 'Edge Cloud CDN' },
  'fastly.com': { company: 'Fastly, Inc.', category: 'Edge Cloud CDN' },
  'akamaihd.net': { company: 'Akamai Technologies, Inc.', category: 'Global Edge CDN' },
  'akamaized.net': { company: 'Akamai Technologies, Inc.', category: 'Global Edge CDN' },
  'jsdelivr.net': { company: 'ProspectOne (jsDelivr)', category: 'Open Source CDN' }
};

/**
 * Resolves the genuine parent corporation from Tracker Radar dataset.
 * Returns { company, isKnownTracker: boolean }
 * Never invents "X Network".
 */
function resolveTrackerEntity(domain, targetDomain) {
  const cleanDomain = domain.toLowerCase().trim().replace(/^www\./, '');
  const regDomain = getRegistrableDomain(cleanDomain);
  const targetRegDomain = targetDomain ? getRegistrableDomain(targetDomain) : null;

  // 1. First-Party Domain Check
  if (targetRegDomain && regDomain === targetRegDomain) {
    const brand = targetRegDomain.split('.')[0];
    const brandCapitalized = brand.charAt(0).toUpperCase() + brand.slice(1);
    return {
      company: `First-Party (${brandCapitalized})`,
      category: 'Primary Origin & Infrastructure',
      party: 'first',
      isThirdParty: false,
      isKnownTracker: false
    };
  }

  // 2. Direct Tracker Radar Lookup
  if (TRACKER_RADAR_ENTITIES[cleanDomain]) {
    const entity = TRACKER_RADAR_ENTITIES[cleanDomain];
    return {
      company: entity.company,
      category: entity.category,
      party: 'third',
      isThirdParty: true,
      isKnownTracker: true
    };
  }

  // 3. Registered Domain Tracker Radar Lookup
  if (TRACKER_RADAR_ENTITIES[regDomain]) {
    const entity = TRACKER_RADAR_ENTITIES[regDomain];
    return {
      company: entity.company,
      category: entity.category,
      party: 'third',
      isThirdParty: true,
      isKnownTracker: true
    };
  }

  // 4. Unknown entity - truthfully labeled as Unknown / Independent
  return {
    company: 'Unknown / Independent Entity',
    category: 'Third-Party Web Endpoint',
    party: 'third',
    isThirdParty: true,
    isKnownTracker: false
  };
}

module.exports = {
  TRACKER_RADAR_ENTITIES,
  resolveTrackerEntity
};

