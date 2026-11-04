// backend/test_issue10_e2e.js
// 10-Cycle verification of Issue 10: Threat Classification Precision & Substring Elimination

const { classifyThreat, getRegistrableDomain } = require('./classifier');

const BENIGN_DOMAINS_WITH_TRICKY_SUBSTRINGS = [
  { domain: 'adobe.com', expected: 'green', reason: 'Contains "ad" inside "adobe"' },
  { domain: 'download.com', expected: 'green', reason: 'Contains "ad" inside "download"' },
  { domain: 'upload.wikimedia.org', expected: 'green', reason: 'Contains "ad" inside "upload"' },
  { domain: 'shadow.com', expected: 'green', reason: 'Contains "ad" inside "shadow"' },
  { domain: 'reader.foxnews.com', expected: 'green', reason: 'Contains "ad" inside "reader"' },
  { domain: 'broadcom.com', expected: 'green', reason: 'Contains "ad" inside "broadcom"' },
  { domain: 'threads.net', expected: 'green', reason: 'Contains "ad" inside "threads"' },
  { domain: 'stage.mycompany.com', expected: 'green', reason: 'Contains "tag" inside "stage"' },
  { domain: 'scoreboard.sports.com', expected: 'green', reason: 'Contains "score" inside "scoreboard"' },
  { domain: 'static.cloudflare.com', expected: 'green', reason: 'Legitimate CDN infrastructure' },
  { domain: 'fastly.net', expected: 'green', reason: 'Legitimate CDN infrastructure' },
  { domain: 'assets.github.com', expected: 'green', reason: 'Static assets origin' }
];

const GENUINE_TRACKER_DOMAINS = [
  { domain: 'doubleclick.net', expected: 'red', reason: 'Known programmatic ad exchange' },
  { domain: 'criteo.com', expected: 'red', reason: 'Known retargeting network' },
  { domain: 'ads.reddit.com', expected: 'red', reason: 'Dot-bounded "ads" subdomain' },
  { domain: 'adserver.publisher.com', expected: 'red', reason: 'Dot-bounded "adserver" subdomain' },
  { domain: 'pixel.facebook.com', expected: 'red', reason: 'Dot-bounded "pixel" tracking node' },
  { domain: 'hotjar.com', expected: 'orange', reason: 'Session replay analytics' },
  { domain: 'clarity.ms', expected: 'orange', reason: 'Session replay analytics' },
  { domain: 'google-analytics.com', expected: 'yellow', reason: 'Web analytics' },
  { domain: 'analytics.google.com', expected: 'yellow', reason: 'Dot-bounded "analytics" subdomain' },
  { domain: 'googletagmanager.com', expected: 'yellow', reason: 'Tag manager' },
  { domain: 'onetrust.com', expected: 'yellow', reason: 'Consent manager' }
];

function runOneCycle(cycleNum) {
  // 1. Verify getRegistrableDomain
  if (getRegistrableDomain('sub.domain.co.uk') !== 'domain.co.uk') {
    throw new Error(`getRegistrableDomain failed on co.uk: got ${getRegistrableDomain('sub.domain.co.uk')}`);
  }
  if (getRegistrableDomain('static.cdn.adobe.com') !== 'adobe.com') {
    throw new Error(`getRegistrableDomain failed on adobe.com: got ${getRegistrableDomain('static.cdn.adobe.com')}`);
  }

  // 2. Test Benign Domains with tricky substrings (previously caused false positive RED/ORANGE)
  for (const item of BENIGN_DOMAINS_WITH_TRICKY_SUBSTRINGS) {
    const threat = classifyThreat(item.domain, `https://${item.domain}/`);
    if (threat !== item.expected) {
      throw new Error(`[FALSE POSITIVE] ${item.domain} classified as "${threat}" (expected "${item.expected}"). Reason: ${item.reason}`);
    }
  }

  // 3. Test Genuine Tracker Domains
  for (const item of GENUINE_TRACKER_DOMAINS) {
    const threat = classifyThreat(item.domain, `https://${item.domain}/`);
    if (threat !== item.expected) {
      throw new Error(`[FALSE NEGATIVE] Tracker ${item.domain} classified as "${threat}" (expected "${item.expected}"). Reason: ${item.reason}`);
    }
  }

  // 4. Test Resource Type Overrides (Images/Fonts/Stylesheets must be Green)
  const imgThreat = classifyThreat('ads.reddit.com', 'https://ads.reddit.com/banner.png', 'image');
  if (imgThreat !== 'green') {
    throw new Error(`Image resourceType was not marked green, got: ${imgThreat}`);
  }
}

function main() {
  console.log('=== VERIFYING ISSUE 10: THREAT CLASSIFICATION PRECISION (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      runOneCycle(c);
      console.log(`[Cycle ${c}/10] Passed. All 23 domain heuristics verified cleanly with zero substring false positives.`);
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! SUBSTRING MATCHING ELIMINATED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

