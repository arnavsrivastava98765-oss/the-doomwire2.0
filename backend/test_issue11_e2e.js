// backend/test_issue11_e2e.js
// 10-Cycle verification of Issue 11: Elimination of Third-Party CORS Proxies

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PROXY_PATTERNS = [
  /api\.allorigins\.win/i,
  /allorigins\.win/i,
  /corsproxy\.io/i,
  /cors-anywhere/i,
  /proxy\.cors/i
];

function scanFilesForProxies(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git' || item === 'dist') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFilesForProxies(fullPath, fileList);
    } else if (/\.(js|jsx|ts|tsx)$/i.test(item) && !item.startsWith('test_')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runOneCycle(cycleNum) {
  const rootDir = path.resolve(__dirname, '..');
  const files = scanFilesForProxies(rootDir);

  for (const file of files) {
    const rel = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');

    for (const pattern of FORBIDDEN_PROXY_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error(`[FAIL] Forbidden third-party CORS proxy found in ${rel}: matched ${pattern}`);
      }
    }
  }

  // Functional test on domainRecon.js content
  const domainReconContent = fs.readFileSync(path.join(rootDir, 'src/domainRecon.js'), 'utf8');
  if (domainReconContent.includes('scrapeLivePageResources')) {
    throw new Error('[FAIL] scrapeLivePageResources is still present in src/domainRecon.js!');
  }
}

function main() {
  console.log('=== VERIFYING ISSUE 11: THIRD-PARTY CORS PROXY ELIMINATION (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      runOneCycle(c);
      console.log(`[Cycle ${c}/10] Passed. Verified 0 occurrences of third-party CORS proxies across all codebase files.`);
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED PERFECTLY! ZERO THIRD-PARTY CORS PROXIES! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    console.error(err.stack);
    process.exit(1);
  }
}

main();

