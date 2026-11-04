// backend/test_issue9_12_e2e.js
// 10-Cycle verification of Issue 9 (Tracker Dataset & Real Locations) & Issue 12 (First vs Third Party)

const { resolveTrackerEntity } = require('./trackerEntities');
const { resolveIntelligence, deriveCompanyFromDomain } = require('./server');

const KNOWN_TRACKER_TESTS = [
  { domain: 'doubleclick.net', expectedCompany: 'Google LLC', expectedThirdParty: true },
  { domain: 'criteo.com', expectedCompany: 'Criteo S.A.', expectedThirdParty: true },
  { domain: 'clarity.ms', expectedCompany: 'Microsoft Corporation', expectedThirdParty: true },
  { domain: 'amazon-adsystem.com', expectedCompany: 'Amazon.com, Inc.', expectedThirdParty: true },
  { domain: 'hotjar.com', expectedCompany: 'Hotjar Ltd.', expectedThirdParty: true }
];

const UNKNOWN_ENTITY_TESTS = [
  { domain: 'random-host-123.net' },
  { domain: 'untracked-custom-server.xyz' },
  { domain: 'my-private-node.org' }
];

const FIRST_PARTY_TESTS = [
  { targetDomain: 'cnn.com', subDomain: 'cnn.com', expectedParty: 'first' },
  { targetDomain: 'cnn.com', subDomain: 'edition.cnn.com', expectedParty: 'first' },
  { targetDomain: 'cnn.com', subDomain: 'media.cnn.com', expectedParty: 'first' },
  { targetDomain: 'cnn.com', subDomain: 'criteo.com', expectedParty: 'third' },
  { targetDomain: 'github.com', subDomain: 'api.github.com', expectedParty: 'first' },
  { targetDomain: 'github.com', subDomain: 'collector.github.com', expectedParty: 'first' },
  { targetDomain: 'github.com', subDomain: 'doubleclick.net', expectedParty: 'third' }
];

async function runOneCycle(cycleNum) {
  // Test 1: Known Tracker Entity lookups
  for (const item of KNOWN_TRACKER_TESTS) {
    const entity = resolveTrackerEntity(item.domain, 'example.com');
    if (entity.company !== item.expectedCompany) {
      throw new Error(`Known tracker ${item.domain} resolved to "${entity.company}" instead of "${item.expectedCompany}"`);
    }
    if (entity.isThirdParty !== item.expectedThirdParty || entity.party !== 'third') {
      throw new Error(`Known tracker ${item.domain} was not flagged as third-party!`);
    }
  }

  // Test 2: Unknown entities MUST NOT invent "X Network"
  for (const item of UNKNOWN_ENTITY_TESTS) {
    const entity = resolveTrackerEntity(item.domain, 'example.com');
    if (/Network$/i.test(entity.company)) {
      throw new Error(`[CRITICAL BUG] Unknown entity ${item.domain} was given an invented "Network" name: "${entity.company}"`);
    }
    if (entity.company !== 'Unknown / Independent Entity') {
      throw new Error(`Unknown entity ${item.domain} should be "Unknown / Independent Entity", got "${entity.company}"`);
    }
  }

  // Test 3: First-Party vs. Third-Party distinction (Issue 12)
  for (const item of FIRST_PARTY_TESTS) {
    const entity = resolveTrackerEntity(item.subDomain, item.targetDomain);
    if (entity.party !== item.expectedParty) {
      throw new Error(`Failed first/third party check for ${item.subDomain} on target ${item.targetDomain}: got "${entity.party}", expected "${item.expectedParty}"`);
    }
    if (item.expectedParty === 'first' && entity.isThirdParty) {
      throw new Error(`First party host ${item.subDomain} was marked isThirdParty: true!`);
    }
    if (item.expectedParty === 'third' && !entity.isThirdParty) {
      throw new Error(`Third party host ${item.subDomain} was marked isThirdParty: false!`);
    }
  }

  // Test 4: Live Intelligence Resolution & Coordinates Truthfulness (Issue 9)
  // Non-resolving domain must have lat: null, lng: null (never hash-invented fallbackLocations[hash % 7])
  const unresolvable = await resolveIntelligence('completely-fake-unresolvable-domain-xyz987.invalid');
  if (unresolvable.lat !== null || unresolvable.lng !== null) {
    throw new Error(`[CRITICAL BUG] Unresolvable domain was given invented coordinates: lat=${unresolvable.lat}, lng=${unresolvable.lng}`);
  }
  if (unresolvable.city.includes('London') && unresolvable.lat === 51.5074) {
    throw new Error('[CRITICAL BUG] Unresolvable domain received fallbackLocations[hash % 7] invented coordinates!');
  }

  // Resolving domain must indicate IP-based approximate location
  const realIntel = await resolveIntelligence('google.com', '', 'other', 'cnn.com');
  if (realIntel.party !== 'third') {
    throw new Error('google.com on cnn.com was not marked third-party!');
  }
  if (realIntel.company !== 'Google LLC') {
    throw new Error(`google.com resolved company: ${realIntel.company}`);
  }
}

async function main() {
  console.log('=== VERIFYING ISSUE 9 & 12: TRACKER DATASET & FIRST/THIRD PARTY (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      process.stdout.write(`   [Cycle ${c}/10] Testing Tracker Radar ownership, first/third party separation & location honesty... `);
      await runOneCycle(c);
      process.stdout.write('Passed.\n');
      await new Promise(r => setTimeout(r, 100));
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! ZERO INVENTED OWNERSHIP OR LOCATIONS! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

