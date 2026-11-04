// backend/test_issue1_e2e.js
// 10-cycle verification for Issue 1: Elimination of Fabricated Surveillance Findings

const { io: Client } = require('../node_modules/socket.io-client');
const { inspectSensitiveData, discoverTargetInfrastructure } = require('./server.js');
const fs = require('fs');
const path = require('path');

// Forbidden fabricated phrases that must NEVER appear anywhere
const FORBIDDEN_FABRICATED_PATTERNS = [
  /TLS Cipher: TLS 1\.3 Handshake/i,
  /BGP Routing: Physical Anycast Origin Point/i,
  /Authenticated Layer 7 Node/i,
  /Unmasked WebGL Hash/i,
  /Prompt Telemetry Stream/i,
  /DOM Clickstream Coordinates/i,
  /Unmasked Canvas GPU String/i,
  /Cart Product SKU Exfiltration/i,
  /Third-Party Connection Exfiltration/i,
  /Hardware Display Fingerprint/i, // previously matched on any w= parameter
  /User-Agent Fingerprint/i,       // previously attached blindly to every packet
  /DOM Action Breadcrumbs/i,
  /Session Spyware & Keystroke Tracker/i
];

function assertNoFabricatedStrings(strOrArr, context) {
  const items = Array.isArray(strOrArr) ? strOrArr : [strOrArr];
  for (const item of items) {
    if (typeof item !== 'string') continue;
    for (const pattern of FORBIDDEN_FABRICATED_PATTERNS) {
      if (pattern.test(item)) {
        throw new Error(`[FAIL] Fabricated string detected in ${context}: "${item}" matched forbidden pattern ${pattern}`);
      }
    }
  }
}

// Mock Playwright Request helper for testing inspectSensitiveData
function createMockRequest({ url = 'https://example.com', postData = null, headers = {} }) {
  return {
    url: () => url,
    postData: () => postData,
    headers: () => headers
  };
}

async function runMockInspectionTests() {
  // Test 1: Generic w=1200 parameter must NOT trigger "Hardware Display Fingerprint"
  const req1 = createMockRequest({ url: 'https://example.com/image?w=1200&h=800' });
  const leaks1 = inspectSensitiveData(req1);
  assertNoFabricatedStrings(leaks1, 'req1 with w=1200');
  if (leaks1.some(l => /Hardware Display Fingerprint/i.test(l))) {
    throw new Error('inspectSensitiveData falsely flagged w=1200 as Hardware Display Fingerprint!');
  }

  // Test 2: Generic id or v parameter must NOT trigger false telemetry
  const req2 = createMockRequest({ url: 'https://example.com/item?id=456&v=2' });
  const leaks2 = inspectSensitiveData(req2);
  assertNoFabricatedStrings(leaks2, 'req2 with id=456&v=2');

  // Test 3: Standard request without hints must NOT have blind User-Agent Fingerprint line
  const req3 = createMockRequest({ url: 'https://example.com/index.html', headers: { 'user-agent': 'Mozilla/5.0' } });
  const leaks3 = inspectSensitiveData(req3);
  assertNoFabricatedStrings(leaks3, 'req3 standard UA');
  if (leaks3.some(l => /User-Agent Fingerprint/i.test(l))) {
    throw new Error('inspectSensitiveData blindly attached User-Agent Fingerprint to standard request!');
  }

  // Test 4: Real tracking parameters (utm_source, gclid) MUST be genuinely captured
  const req4 = createMockRequest({ url: 'https://example.com/landing?utm_source=newsletter&utm_medium=email&gclid=ABC_123' });
  const leaks4 = inspectSensitiveData(req4);
  assertNoFabricatedStrings(leaks4, 'req4 real tracking params');
  const hasTracking = leaks4.some(l => l.includes('utm_source') && l.includes('gclid'));
  if (!hasTracking) {
    throw new Error('inspectSensitiveData failed to capture genuine utm_source / gclid parameters!');
  }

  // Test 5: Real cookies MUST be genuinely reported by name
  const req5 = createMockRequest({
    url: 'https://example.com/api/user',
    headers: { cookie: 'auth_token=secret123; session_id=xyz789' }
  });
  const leaks5 = inspectSensitiveData(req5);
  assertNoFabricatedStrings(leaks5, 'req5 real cookies');
  const hasCookies = leaks5.some(l => l.includes('auth_token') && l.includes('session_id'));
  if (!hasCookies) {
    throw new Error('inspectSensitiveData failed to capture real cookie keys!');
  }

  // Test 6: Real referer header MUST be genuinely reported
  const req6 = createMockRequest({
    url: 'https://example.com/asset.js',
    headers: { referer: 'https://partner-portal.com/dashboard' }
  });
  const leaks6 = inspectSensitiveData(req6);
  assertNoFabricatedStrings(leaks6, 'req6 referer');
  const hasReferer = leaks6.some(l => l.includes('partner-portal.com'));
  if (!hasReferer) {
    throw new Error('inspectSensitiveData failed to capture real referer!');
  }
}

async function runInfrastructureDiscoveryTest() {
  const nodes = await discoverTargetInfrastructure('https://example.com');
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      assertNoFabricatedStrings(node.leakedData, `discoverTargetInfrastructure node ${node.domain}`);
    }
  }
}

function runKnownEcosystemsStaticAudit() {
  const domainReconPath = path.resolve(__dirname, '../src/domainRecon.js');
  const content = fs.readFileSync(domainReconPath, 'utf8');

  // Verify no forbidden strings in domainRecon.js
  for (const pattern of FORBIDDEN_FABRICATED_PATTERNS) {
    if (pattern.test(content)) {
      throw new Error(`[FAIL] domainRecon.js still contains forbidden fabricated pattern: ${pattern}`);
    }
  }

  // Verify no Math.random IP formula: 104 + Math.floor
  if (/104\s*\+\s*Math\.floor/i.test(content)) {
    throw new Error('[FAIL] domainRecon.js still contains pseudo-random IP generation (104 + Math.floor)!');
  }

  // Verify no fake session generation
  if (/sess_\$\{/i.test(content)) {
    throw new Error('[FAIL] domainRecon.js still contains fake session ID generator (sess_${...})!');
  }
}

async function runLiveSocketScanTest() {
  return new Promise((resolve, reject) => {
    const socket = Client('http://127.0.0.1:5000', {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false
    });

    const receivedPackets = [];
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Live socket scan timed out after 30s'));
    }, 30000);

    socket.on('connect', () => {
      socket.emit('scan_url', { url: 'https://example.com' });
    });

    socket.on('packet_captured', (data) => {
      if (data && data.leakedData) {
        receivedPackets.push(data);
        assertNoFabricatedStrings(data.leakedData, `live packet from ${data.domain || 'unknown'}`);
      }
    });

    socket.on('scan_complete', (data) => {
      clearTimeout(timeout);
      socket.disconnect();

      if (data && data.nodes) {
        for (const n of data.nodes) {
          if (n.leakedData) {
            assertNoFabricatedStrings(n.leakedData, `scan_complete node ${n.domain}`);
          }
        }
      }

      resolve({ packetCount: receivedPackets.length });
    });

    socket.on('error_notice', (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Server returned error_notice: ${err.message}`));
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Socket connection error: ${err.message}`));
    });
  });
}

async function runOneCycle(cycleNum) {
  process.stdout.write(`   [Cycle ${cycleNum}/10] Testing inspection heuristics... `);
  await runMockInspectionTests();
  process.stdout.write(`Passed.\n   [Cycle ${cycleNum}/10] Testing infrastructure discovery... `);
  await runInfrastructureDiscoveryTest();
  process.stdout.write(`Passed.\n   [Cycle ${cycleNum}/10] Auditing domainRecon.js static codebase... `);
  runKnownEcosystemsStaticAudit();
  process.stdout.write(`Passed.\n   [Cycle ${cycleNum}/10] Running live socket scan verification... `);
  const scanResult = await runLiveSocketScanTest();
  process.stdout.write(`Passed (${scanResult.packetCount} packets verified clean).\n`);
}

async function main() {
  console.log('=== VERIFYING ISSUE 1: FABRICATED DATA ELIMINATION (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      await runOneCycle(c);
      await new Promise(r => setTimeout(r, 600));
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! ZERO FABRICATED DATA DETECTED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();
