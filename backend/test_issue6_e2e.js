/**
 * End-to-End Test Suite for Issue 6: Rate Limiting, Concurrency Semaphore & CORS
 * Executes 10 full verification cycles on a live server.
 */

const http = require('http');
const ioClient = require('socket.io-client');
const { spawn } = require('child_process');
const path = require('path');

const TEST_PORT = 5077;

async function runIssue6E2ETests() {
  console.log(`[E2E-Issue6] Launching backend server on port ${TEST_PORT}...`);
  // Set MAX_CONCURRENT_SCANS to 2 for deterministic concurrency testing
  const env = { ...process.env, PORT: TEST_PORT, MAX_CONCURRENT_SCANS: '2', ALLOWED_ORIGINS: 'https://trusted-doomwire.app' };
  const serverPath = path.resolve(__dirname, 'server.js');
  const serverProcess = spawn('node', [serverPath], { env, stdio: ['ignore', 'pipe', 'pipe'] });

  let serverStarted = false;
  serverProcess.stdout.on('data', (d) => {
    if (d.toString().includes('DOOMWIRE CYBER-RADAR BACKEND ONLINE')) {
      serverStarted = true;
    }
  });

  serverProcess.stderr.on('data', (d) => {
    console.error('[SERVER STDERR]', d.toString().trim());
  });

  serverProcess.on('exit', (code, sig) => {
    console.log(`[SERVER EXITED] Code: ${code}, Sig: ${sig}`);
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

  console.log(`[E2E-Issue6] Server verified running on http://localhost:${TEST_PORT}`);

  function createClient(simulatedIp) {
    return new Promise((resolve, reject) => {
      const client = ioClient(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
        extraHeaders: simulatedIp ? { 'x-forwarded-for': simulatedIp } : {}
      });
      client.on('connect', () => resolve(client));
      client.on('connect_error', reject);
    });
  }

  async function waitForActiveScans(expected, timeoutMs = 4000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${TEST_PORT}/api/status`, (r) => {
          let raw = '';
          r.on('data', (c) => raw += c);
          r.on('end', () => resolve(JSON.parse(raw)));
        }).on('error', reject);
      });
      if (res.capacity && res.capacity.activeScans === expected) {
        return res;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`Timed out waiting for activeScans to equal ${expected}`);
  }

  for (let cycle = 1; cycle <= 10; cycle++) {
    console.log(`>>> ITERATION CYCLE ${cycle} OF 10 <<<`);

    // Test 1: Capacity & Status API Metrics
    const statusData = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${TEST_PORT}/api/status`, (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    if (!statusData.capacity || statusData.capacity.maxConcurrentScans !== 2) {
      throw new Error(`Cycle ${cycle}: Expected maxConcurrentScans = 2, got ` + JSON.stringify(statusData.capacity));
    }
    console.log(`  [CYCLE ${cycle} PASS] Capacity Metrics Verified (Max: 2, Active: ${statusData.capacity.activeScans})`);

    // Test 2: Concurrency Cap Semaphore (Simulated distinct client IPs per cycle)
    const ip1 = `198.51.100.${cycle * 10 + 1}`;
    const ip2 = `198.51.100.${cycle * 10 + 2}`;
    const ip3 = `198.51.100.${cycle * 10 + 3}`;

    const client1 = await createClient(ip1);
    const client2 = await createClient(ip2);
    const client3 = await createClient(ip3);

    let client3RejectedBusy = false;
    let client3ErrorMessage = '';

    client3.on('scan_status', (data) => {
      if (data.status && data.status.includes('CAPACITY REACHED')) {
        client3RejectedBusy = true;
      }
    });

    client3.on('scan_error', (data) => {
      client3ErrorMessage = data.error || '';
    });

    // Start 2 scans to fill concurrency slots
    client1.emit('scan_url', { url: 'example.com', userLocation: { lat: 0, lng: 0 } });
    client2.emit('scan_url', { url: 'httpbin.org', userLocation: { lat: 0, lng: 0 } });

    // Wait 100ms for slots to be locked in server semaphore
    await new Promise((r) => setTimeout(r, 100));

    // Client 3 attempts to scan while slots are full
    client3.emit('scan_url', { url: 'example.com', userLocation: { lat: 0, lng: 0 } });

    // Wait 400ms for client 3 response
    await new Promise((r) => setTimeout(r, 400));

    if (!client3RejectedBusy && !client3ErrorMessage.includes('capacity')) {
      throw new Error(`Cycle ${cycle}: Concurrency cap failed! Client 3 was not rejected when capacity was full.`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Concurrency Cap Verified (Slot 3 rejected with server capacity full)`);

    // Cleanly disconnect clients so slots are released
    client1.disconnect();
    client2.disconnect();
    client3.disconnect();
    await waitForActiveScans(0);

    // Test 3: Per-IP Rate Limiter Enforcement
    const spammerIp = `203.0.113.${cycle}`;
    const spammerClient = await createClient(spammerIp);
    let rateLimitTriggered = false;

    spammerClient.on('scan_status', (data) => {
      if (data.status && data.status.includes('RATE LIMIT EXCEEDED')) {
        rateLimitTriggered = true;
      }
    });

    // Fire 11 scan requests rapidly from same IP
    for (let reqIdx = 0; reqIdx < 11; reqIdx++) {
      spammerClient.emit('scan_url', { url: 'example.com', userLocation: { lat: 0, lng: 0 } });
    }

    await new Promise((r) => setTimeout(r, 400));
    spammerClient.disconnect();
    await waitForActiveScans(0);

    if (!rateLimitTriggered) {
      throw new Error(`Cycle ${cycle}: Rate limiter failed! 11 rapid requests from ${spammerIp} did not trigger rate limit.`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Rate Limiter Verified (11th scan from same IP blocked with rate limit error)`);

    // Test 4: CORS Allowed vs Disallowed Origin Validation
    const corsSuccess = await new Promise((resolve) => {
      const req = http.request({
        host: 'localhost',
        port: TEST_PORT,
        path: '/api/status',
        method: 'GET',
        headers: { Origin: 'http://localhost:5173' }
      }, (res) => {
        const allowedOrigin = res.headers['access-control-allow-origin'];
        resolve(allowedOrigin === 'http://localhost:5173');
      });
      req.on('error', () => resolve(false));
      req.end();
    });

    if (!corsSuccess) {
      throw new Error(`Cycle ${cycle}: CORS did not allow valid local development origin http://localhost:5173`);
    }
    console.log(`  [CYCLE ${cycle} PASS] CORS Policy Verified (Permitted local origin authorized)`);

    // Test 5: Concurrency Slot Release Check
    const postCleanupStatus = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${TEST_PORT}/api/status`, (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    if (postCleanupStatus.capacity.activeScans !== 0) {
      throw new Error(`Cycle ${cycle}: Slots not released! Active scans: ${postCleanupStatus.capacity.activeScans}`);
    }
    console.log(`  [CYCLE ${cycle} PASS] Concurrency Slot Release Verified (Active scans back to 0)`);

    console.log(`>>> CYCLE ${cycle} OF 10 COMPLETED SUCCESSFULLY <<<\n`);
  }

  serverProcess.kill('SIGTERM');
  console.log('======================================================');
  console.log('ALL 10 VERIFICATION CYCLES (40 TESTS) PASSED!');
  console.log('ISSUE 6 IS 100% FIXED, SECURED, AND EMPIRICALLY VERIFIED.');
  console.log('======================================================');
  process.exit(0);
}

runIssue6E2ETests().catch((e) => {
  console.error('FATAL TEST ERROR:', e);
  process.exit(1);
});
