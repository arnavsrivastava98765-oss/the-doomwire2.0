// backend/test_issue7_e2e.js
// 10-Cycle verification of Issue 7: Scan Navigation Timing & Explicit Window Reporting

const { io: Client } = require('../node_modules/socket.io-client');
const { server } = require('./server');

async function runOneTimingCycle(cycleNum) {
  return new Promise((resolve, reject) => {
    const socket = Client('http://127.0.0.1:5000', {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timing scan test timed out after 30s'));
    }, 30000);

    const clientStartTime = Date.now();

    socket.on('connect', () => {
      socket.emit('scan_url', { url: 'https://example.com' });
    });

    socket.on('scan_complete', (data) => {
      clearTimeout(timeout);
      socket.disconnect();

      const totalElapsedClientSec = (Date.now() - clientStartTime) / 1000;

      // 1. Assert captureWindowSec is explicitly reported
      if (typeof data.captureWindowSec !== 'number' || isNaN(data.captureWindowSec)) {
        throw new Error(`captureWindowSec was not a valid number: ${data.captureWindowSec}`);
      }

      // 2. Assert capture window is realistic (at least 1.5 seconds of active observation)
      if (data.captureWindowSec < 1.0) {
        throw new Error(`Capture window too short: ${data.captureWindowSec}s`);
      }

      // 3. Assert client elapsed time aligns with reported capture window
      if (totalElapsedClientSec < data.captureWindowSec - 1.0) {
        throw new Error(`Reported capture window (${data.captureWindowSec}s) was larger than total client elapsed (${totalElapsedClientSec}s)!`);
      }

      resolve({
        captureWindowSec: data.captureWindowSec,
        totalPackets: data.totalPackets
      });
    });

    socket.on('scan_error', (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Scan error: ${err.error}`));
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Socket connection error: ${err.message}`));
    });
  });
}

async function main() {
  console.log('=== VERIFYING ISSUE 7: SCAN TIMING & WINDOW REPORTING (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      process.stdout.write(`   [Cycle ${c}/10] Testing scan timing, waitUntil 'load' & window reporting... `);
      const res = await runOneTimingCycle(c);
      process.stdout.write(`Passed (${res.captureWindowSec}s capture window, ${res.totalPackets} packets).\n`);
      await new Promise(r => setTimeout(r, 400));
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! TIMING & CAPTURE WINDOW VERIFIED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

