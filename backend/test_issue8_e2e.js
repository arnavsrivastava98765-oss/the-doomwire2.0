// backend/test_issue8_e2e.js
// 10-Cycle verification for Issue 8: DNS Speculation vs. Real Captured Traffic

const { io: Client } = require('../node_modules/socket.io-client');
const { server } = require('./server');

async function runOneScanCycle(cycleNum) {
  return new Promise((resolve, reject) => {
    const socket = Client('http://127.0.0.1:5000', {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false
    });

    const activePackets = [];
    const dnsNodes = [];

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket scan timed out after 25s'));
    }, 25000);

    socket.on('connect', () => {
      socket.emit('scan_url', { url: 'https://example.com' });
    });

    socket.on('packet_captured', (data) => {
      if (data.resourceType === 'dns_infrastructure') {
        dnsNodes.push(data);
        // Assert DNS node properties
        if (data.observedTraffic !== false) {
          throw new Error(`DNS node ${data.domain} was marked observedTraffic: true!`);
        }
        if (data.method !== 'DNS') {
          throw new Error(`DNS node ${data.domain} had method "${data.method}" instead of "DNS"!`);
        }
      } else {
        activePackets.push(data);
        if (data.observedTraffic === false) {
          throw new Error(`Live network packet ${data.domain} had observedTraffic: false!`);
        }
      }
    });

    socket.on('scan_complete', (data) => {
      clearTimeout(timeout);
      socket.disconnect();

      // Assert packet counts are NOT artificially inflated by DNS discovery
      if (data.totalPackets !== activePackets.length) {
        throw new Error(`totalPackets (${data.totalPackets}) did not match live observed count (${activePackets.length})!`);
      }
      if (data.dnsInfrastructureCount !== undefined && data.dnsInfrastructureCount !== dnsNodes.length) {
        throw new Error(`dnsInfrastructureCount (${data.dnsInfrastructureCount}) did not match received DNS nodes (${dnsNodes.length})!`);
      }

      resolve({
        activeCount: activePackets.length,
        dnsCount: dnsNodes.length
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
  console.log('=== VERIFYING ISSUE 8: DNS SPECULATION SEPARATION (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      process.stdout.write(`   [Cycle ${c}/10] Testing separation of active packets vs DNS infrastructure... `);
      const res = await runOneScanCycle(c);
      process.stdout.write(`Passed (${res.activeCount} active, ${res.dnsCount} DNS nodes).\n`);
      await new Promise(r => setTimeout(r, 400));
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! DNS SPECULATION FULLY SEPARATED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

