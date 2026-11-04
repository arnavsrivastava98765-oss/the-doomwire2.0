/**
 * Master Automated Test Runner for DoomWire
 * Executes all 18 security, precision, architectural, and end-to-end test suites.
 */
const { fork } = require('child_process');
const path = require('path');

const SUITES = [
  { name: 'SSRF & URL Security Tests', file: 'test_security.js' },
  { name: 'Legal & Ethical Framing Audit', file: 'test_legal_framing.js' },
  { name: 'Issue 10: Threat Classifier & Substring Elimination', file: 'test_issue10_e2e.js' },
  { name: 'Issue 9 & 12: Tracker Datasets & Party Separation', file: 'test_issue9_12_e2e.js' },
  { name: 'Issue 11: Removal of Third-Party CORS Proxies', file: 'test_issue11_e2e.js' },
  { name: 'Issue 13: Non-Root Production Dockerfile', file: 'test_issue13_e2e.js' },
  { name: 'Issue 14: Keep-Warm & Cold-Start Status', file: 'test_issue14_e2e.js' },
  { name: 'Issue 15: Architecture Modularization', file: 'test_issue15_e2e.js' },
  { name: 'Issue 16: Automated Test Suite & Cleanup', file: 'test_issue16_e2e.js' },
  { name: 'Issue 17: User-Agent & Zero CVE Dependencies', file: 'test_issue17_e2e.js' },
  { name: 'Issue 18: License & Repository Hygiene', file: 'test_issue18_e2e.js' },
  { name: 'Issue 3: Extension Active Protection Wiring', file: 'test_issue3_e2e.js' },
  { name: 'Issue 6: Rate Limiting & Concurrency Semaphore', file: 'test_issue6_e2e.js' },
  { name: 'Issue 4: Safe Chromium Launch Flags & SSRF Abort', file: 'test_issue4_e2e.js' },
  { name: 'Issue 5: Multi-User Browser Session Isolation', file: 'test_issue5_e2e.js' },
  { name: 'Issue 2: Poison Feature Decoy Realignment', file: 'test_issue2_e2e.js' },
  { name: 'Issue 8: DNS Infrastructure Separation', file: 'test_issue8_e2e.js' },
  { name: 'Issue 7: Page Load Timing & Capture Metrics', file: 'test_issue7_e2e.js' },
  { name: 'Issue 1: Elimination of Fabricated Data E2E', file: 'test_issue1_e2e.js' }
];

function runSuite(suite) {
  return new Promise((resolve) => {
    const suitePath = path.resolve(__dirname, suite.file);
    const start = Date.now();
    const child = fork(suitePath, [], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });

    let output = '';
    child.stdout.on('data', (d) => { output += d.toString(); });
    child.stderr.on('data', (d) => { output += d.toString(); });

    child.on('close', (code) => {
      const durationMs = Date.now() - start;
      if (code === 0) {
        resolve({ passed: true, suite, durationMs, output });
      } else {
        resolve({ passed: false, suite, durationMs, output });
      }
    });

    child.on('error', (err) => {
      resolve({ passed: false, suite, durationMs: Date.now() - start, output: err.message });
    });
  });
}

async function runAllSuites() {
  console.log('======================================================================');
  console.log('🚀 DOOMWIRE AUTOMATED MASTER TEST RUNNER');
  console.log(`Running ${SUITES.length} comprehensive test suites...`);
  console.log('======================================================================\n');

  let passedCount = 0;
  const failures = [];
  const startTime = Date.now();

  for (let i = 0; i < SUITES.length; i++) {
    const suite = SUITES[i];
    process.stdout.write(`[${i + 1}/${SUITES.length}] Running ${suite.name} (${suite.file})... `);
    const result = await runSuite(suite);
    if (result.passed) {
      passedCount++;
      console.log(`PASSED (${result.durationMs}ms)`);
    } else {
      console.log(`FAILED (${result.durationMs}ms)`);
      failures.push(result);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n======================================================================');
  console.log(`🏁 TEST SUITE RUN COMPLETE: ${passedCount}/${SUITES.length} Passed in ${totalTime}s`);
  console.log('======================================================================');

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} SUITE(S) FAILED:`);
    for (const f of failures) {
      console.error(`\n--- FAILURE IN: ${f.suite.name} (${f.suite.file}) ---`);
      console.error(f.output.slice(-1500));
    }
    process.exit(1);
  } else {
    console.log('\n✨ ALL TEST SUITES PASSED CLEANLY (100% SUCCESS RATE)!');
    process.exit(0);
  }
}

if (require.main === module) {
  runAllSuites();
}

module.exports = { runAllSuites, SUITES };
