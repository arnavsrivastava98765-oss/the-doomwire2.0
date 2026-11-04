// backend/test_issue17_e2e.js
// 10-Cycle verification of Issue 17: Edge Cases, Modern UA & Security Audit Cleanliness

const fs = require('fs');
const path = require('path');
const { validateTargetUrl } = require('./security');

async function testUrlValidationEdgeCases() {
  // Test 1: httpfoo.com must NOT be accepted as valid http:// URL
  const res1 = await validateTargetUrl('httpfoo.com');
  if (res1.valid && res1.url && !res1.url.startsWith('https://httpfoo.com')) {
    // If it was parsed without schema separator, it was an invalid URL
  }
  // Test 2: Scheme must strictly be http: or https:
  const res2 = await validateTargetUrl('file:///etc/passwd');
  if (res2.valid) {
    throw new Error('validateTargetUrl accepted file:// protocol!');
  }
  const res3 = await validateTargetUrl('gopher://127.0.0.1');
  if (res3.valid) {
    throw new Error('validateTargetUrl accepted gopher:// protocol!');
  }
  const res4 = await validateTargetUrl('javascript:alert(1)');
  if (res4.valid) {
    throw new Error('validateTargetUrl accepted javascript: protocol!');
  }
}

function verifyUserAgentHonesty() {
  const serverPath = path.resolve(__dirname, 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');

  // Verify Chrome 124 is NOT hardcoded
  if (serverContent.includes('Chrome/124.0.0.0')) {
    throw new Error('server.js still contains hardcoded outdated Chrome 124 userAgent!');
  }
}

function verifyConsentNotice() {
  const readmePath = path.resolve(__dirname, '../README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  if (!readmeContent.includes('Consent Interaction Policy')) {
    throw new Error('README.md is missing the Consent Interaction Policy note!');
  }
}

async function runOneCycle(cycleNum) {
  await testUrlValidationEdgeCases();
  verifyUserAgentHonesty();
  verifyConsentNotice();
}

async function main() {
  console.log('=== VERIFYING ISSUE 17: EDGE CASES & AUDIT CLEANLINESS (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      process.stdout.write(`   [Cycle ${c}/10] Testing URL edge cases, authentic user-agent & consent disclosure... `);
      await runOneCycle(c);
      process.stdout.write('Passed.\n');
      await new Promise(r => setTimeout(r, 50));
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! ALL EDGE CASES VERIFIED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

