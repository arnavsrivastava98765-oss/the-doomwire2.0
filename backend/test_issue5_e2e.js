/**
 * End-to-End Multi-User Concurrency & Session Isolation Verification Test for Issue 5
 * Verifies that multiple users operate in complete isolation:
 * 1. Independent rule sets (cuts/poisons do not leak between users).
 * 2. Concurrent scans do not kill or abort each other.
 * 3. Disconnects cleanly garbage-collect session resources.
 * Executes 10 complete validation cycles.
 */

const http = require('http');
const ioClient = require('socket.io-client');
const { spawn } = require('child_process');
const path = require('path');

const TEST_PORT = 5066;

async function runIssue5E2ETests() {
  console.log(`[E2E-Issue5] Launching backend server on port ${TEST_PORT}...`);
  const env = { ...process.env, PORT: TEST_PORT, MAX_SCANS_PER_WINDOW: '500' };
  const serverPath = path.resolve(__dirname, 'server.js');
  const serverProcess = spawn('node', [serverPath], { env, stdio: ['ignore', 'pipe', 'pipe'] });

  let serverStarted = false;
  serverProcess.stdout.on('data', (d) => {
    if (d.toString().includes('DOOMWIRE CYBER-RADAR BACKEND ONLINE')) {
      serverStarted = true;
    }
  });

  serverProcess.stderr.on('data', (d) => {
    // console.error('[SERVER LOG]', d.toString().trim());
  });

  // Wait for server ready
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${TEST_PORT}/api/status`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        });
        req.on('error', reject);
        req.end();
      });
      serverStarted = true;
      break;
    } catch (e) {}
  }

  if (!serverStarted) {
    serverProcess.kill();
    throw new Error('Server failed to start on port ' + TEST_PORT);
  }

  console.log(`[E2E-Issue5] Server verified on http://localhost:${TEST_PORT}`);

  function createClient() {
    return new Promise((resolve, reject) => {
      const client = ioClient(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: false
      });
      client.on('connect', () => resolve(client));
      client.on('connect_error', reject);
    });
  }

  console.log('\n======================================================');
  console.log('STARTING 10-CYCLE MULTI-USER ISOLATION VERIFICATION');
  console.log('======================================================\n');

  for (let cycle = 1; cycle <= 10; cycle++) {
    console.log(`>>> ITERATION CYCLE ${cycle} OF 10 <<<`);

    const clientA = await createClient();
    const clientB = await createClient();

    let clientBLeakedCut = false;
    let clientALeakedPoison = false;

    clientB.on('wire_cut', () => { clientBLeakedCut = true; });
    clientA.on('wire_poisoned', () => { clientALeakedPoison = true; });

    // Test 1: Rule Isolation - Client A cuts a wire
    const domainA = `tracker-a-cycle${cycle}.com`;
    const cutPromiseA = new Promise((resolve) => clientA.once('wire_cut', resolve));
    clientA.emit('cut_wire', domainA);
    const cutResult = await cutPromiseA;

    if (cutResult.domain !== domainA) {
      throw new Error(`Cycle ${cycle}: Client A expected wire_cut for ${domainA}`);
    }

    // Give time to ensure no broadcast leak to Client B
    await new Promise((r) => setTimeout(r, 100));

    if (clientBLeakedCut) {
      throw new Error(`Cycle ${cycle}: FAULT! Client A cut was broadcast to Client B! State is not isolated.`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Rule Isolation (Client A cut -> Client B did NOT receive leak)`);

    // Test 2: Rule Isolation - Client B poisons a wire
    const domainB = `tracker-b-cycle${cycle}.com`;
    const poisonPromiseB = new Promise((resolve) => clientB.once('wire_poisoned', resolve));
    clientB.emit('poison_wire', domainB);
    const poisonResult = await poisonPromiseB;

    if (poisonResult.domain !== domainB) {
      throw new Error(`Cycle ${cycle}: Client B expected wire_poisoned for ${domainB}`);
    }

    await new Promise((r) => setTimeout(r, 100));
    if (clientALeakedPoison) {
      throw new Error(`Cycle ${cycle}: FAULT! Client B poison was broadcast to Client A!`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Rule Isolation (Client B poison -> Client A did NOT receive leak)`);

    // Test 3: Clear Rules Isolation - Client A clears rules, Client B should be untouched
    let clientBLeakedClear = false;
    clientB.on('rules_cleared', () => { clientBLeakedClear = true; });

    const clearPromiseA = new Promise((resolve) => clientA.once('rules_cleared', resolve));
    clientA.emit('clear_rules');
    await clearPromiseA;

    await new Promise((r) => setTimeout(r, 100));
    if (clientBLeakedClear) {
      throw new Error(`Cycle ${cycle}: FAULT! Client A clear_rules was broadcast to Client B!`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Clear Rules Isolation (Client A cleared -> Client B untouched)`);

    // Test 4: Concurrent Scan Non-Interference (Client A & Client B scan concurrently)
    // Both scans launch simultaneously. Under the old code, Client B's scan would close Client A's browser.
    console.log(`  [CYCLE ${cycle}] Launching concurrent scans for Client A (example.com) & Client B (httpbin.org)...`);
    
    let aCompleted = false;
    let bCompleted = false;

    const scanPromiseA = new Promise((resolve, reject) => {
      clientA.on('scan_complete', () => { aCompleted = true; resolve(); });
      clientA.on('scan_error', (e) => reject(new Error('Client A error: ' + JSON.stringify(e))));
    });

    const scanPromiseB = new Promise((resolve, reject) => {
      clientB.on('scan_complete', () => { bCompleted = true; resolve(); });
      clientB.on('scan_error', (e) => reject(new Error('Client B error: ' + JSON.stringify(e))));
    });

    clientA.emit('scan_url', { url: 'example.com', userLocation: { lat: 0, lng: 0 } });
    // Launch Client B scan with 200ms delay while Client A is mid-flight
    await new Promise((r) => setTimeout(r, 200));
    clientB.emit('scan_url', { url: 'httpbin.org', userLocation: { lat: 0, lng: 0 } });

    // Wait for both concurrent scans to finish safely
    await Promise.all([scanPromiseA, scanPromiseB]);

    if (!aCompleted || !bCompleted) {
      throw new Error(`Cycle ${cycle}: One or both concurrent scans failed to complete!`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Concurrent Scans Succeeded (Both completed with zero interference)`);

    // Disconnect clients
    clientA.disconnect();
    clientB.disconnect();

    // Verify cleanup in status endpoint
    await new Promise((r) => setTimeout(r, 200));
    const statusData = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${TEST_PORT}/api/status`, (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    if (statusData.activeSessions !== 0) {
      throw new Error(`Cycle ${cycle}: Expected 0 active sessions after disconnect, got ${statusData.activeSessions}`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Session Garbage Collection Verified (Active sessions: 0)`);
    console.log(`>>> CYCLE ${cycle} OF 10 COMPLETED SUCCESSFULLY <<<\n`);
  }

  serverProcess.kill('SIGTERM');
  console.log('======================================================');
  console.log('ALL 10 MULTI-USER ISOLATION CYCLES (40 TESTS) PASSED!');
  console.log('ISSUE 5 IS 100% FIXED, FULLY ISOLATED, AND EMPIRICALLY VERIFIED.');
  console.log('======================================================');
  process.exit(0);
}

runIssue5E2ETests().catch((e) => {
  console.error('FATAL TEST ERROR:', e);
  process.exit(1);
});

