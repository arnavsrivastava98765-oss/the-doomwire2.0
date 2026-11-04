const { io } = require('socket.io-client');

async function testScan(targetUrl) {
  return new Promise((resolve, reject) => {
    console.log(`\n========================================`);
    console.log(`[TEST] Starting verification scan for: ${targetUrl}`);
    console.log(`========================================`);

    const socket = io('http://localhost:5000', {
      timeout: 5000,
      reconnection: false
    });

    const receivedPackets = [];
    const startTime = Date.now();
    let completeFired = false;

    socket.on('connect', () => {
      console.log(`[PASS] Connected to backend on port 5000 in ${Date.now() - startTime}ms`);
      socket.emit('scan_url', {
        url: targetUrl,
        userLocation: { lat: 13.0827, lng: 80.2707, city: 'Command Base' }
      });
    });

    socket.on('scan_status', (data) => {
      console.log(`[STATUS] +${Date.now() - startTime}ms: ${data.status}`);
    });

    socket.on('packet_captured', (pkt) => {
      receivedPackets.push(pkt);
    });

    socket.on('scan_complete', (data) => {
      completeFired = true;
      const duration = Date.now() - startTime;
      console.log(`\n[SUCCESS] scan_complete fired in ${duration}ms!`);
      console.log(`Total packets captured: ${receivedPackets.length}`);
      
      // Calculate domain grouping & request counts
      const domainMap = new Map();
      receivedPackets.forEach((p) => {
        domainMap.set(p.domain, (domainMap.get(p.domain) || 0) + 1);
      });

      console.log(`Unique domains discovered: ${domainMap.size}`);
      console.log(`Sample Grouped Nodes with Request Counts:`);
      let sampleCount = 0;
      for (const [dom, count] of domainMap.entries()) {
        if (sampleCount++ < 6) {
          console.log(`  - ${dom}: ${count} request(s) ${count > 1 ? `[${count}× REQS]` : ''}`);
        }
      }

      socket.disconnect();
      resolve({ duration, total: receivedPackets.length, unique: domainMap.size });
    });

    socket.on('scan_error', (err) => {
      console.error(`[ERROR] scan_error:`, err);
      socket.disconnect();
      reject(err);
    });

    setTimeout(() => {
      if (!completeFired) {
        socket.disconnect();
        reject(new Error(`Timeout: scan_complete did not fire within 15 seconds!`));
      }
    }, 15000);
  });
}

async function run() {
  try {
    const res = await testScan('https://web.whatsapp.com');
    console.log(`\nVerification Result: PASSED (${res.duration}ms, ${res.total} packets, ${res.unique} grouped nodes)`);
    process.exit(0);
  } catch (err) {
    console.error(`\nVerification Result: FAILED`, err.message);
    process.exit(1);
  }
}

run();
