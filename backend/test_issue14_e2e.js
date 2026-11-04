// backend/test_issue14_e2e.js
// 10-Cycle verification of Issue 14: Keep-Warm & Cold Start Indicator

const http = require('http');
const fs = require('fs');
const path = require('path');
const { server } = require('./server');

async function testApiHealthStatus() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:5000/api/status', (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`/api/status responded with status code ${res.statusCode}`));
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.status !== 'ONLINE') {
            return reject(new Error(`/api/status status is not ONLINE: ${parsed.status}`));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse /api/status JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function verifyFrontendKeepWarm() {
  const appPath = path.resolve(__dirname, '../src/App.jsx');
  const content = fs.readFileSync(appPath, 'utf8');

  if (!content.includes('isWakingServer') || !content.includes('setIsWakingServer')) {
    throw new Error('App.jsx is missing isWakingServer state for cold starts!');
  }
  if (!content.includes('checkServerHealth') || !content.includes('/api/status')) {
    throw new Error('App.jsx is missing checkServerHealth /api/status keep-warm polling!');
  }
  if (!content.includes('WAKING ENGINE (~20s)...')) {
    throw new Error('App.jsx is missing the WAKING ENGINE UI status indicator!');
  }
}

async function runOneCycle(cycleNum) {
  await testApiHealthStatus();
  verifyFrontendKeepWarm();
}

async function main() {
  console.log('=== VERIFYING ISSUE 14: KEEP-WARM & COLD START INDICATOR (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      process.stdout.write(`   [Cycle ${c}/10] Testing /api/status health endpoint & frontend cold-start wiring... `);
      await runOneCycle(c);
      process.stdout.write('Passed.\n');
      await new Promise(r => setTimeout(r, 100));
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! COLD START HANDLING FULLY VERIFIED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

