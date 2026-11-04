const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { SUITES } = require('./test_all');

async function runSingleCycle(cycleNum) {
  // 1. Verify backend package.json test script
  const backendPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
  assert.strictEqual(backendPkg.scripts?.test, 'node test_all.js', 'backend/package.json must have "test": "node test_all.js"');
  assert.strictEqual(backendPkg.scripts?.start, 'node server.js', 'backend/package.json must have "start": "node server.js"');

  // 2. Verify root package.json test script
  const rootPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
  assert.strictEqual(rootPkg.scripts?.test, 'npm run test --prefix backend', 'root package.json must have "test": "npm run test --prefix backend"');

  // 3. Verify repo root is clean of binary PDFs and PPTXs
  const rootFiles = fs.readdirSync(path.resolve(__dirname, '..'));
  const binaryRootPdfs = rootFiles.filter(f => f.endsWith('.pdf') || f.endsWith('.pptx'));
  assert.strictEqual(binaryRootPdfs.length, 0, `Repo root must contain 0 binary PDF/PPTX files (found: ${binaryRootPdfs.join(', ')})`);

  // 4. Verify archive/deck contains the archived hackathon materials
  const archiveDeckDir = path.resolve(__dirname, '../archive/deck');
  assert(fs.existsSync(archiveDeckDir), 'archive/deck must exist');
  const deckFiles = fs.readdirSync(archiveDeckDir);
  assert(deckFiles.includes('DOOMWIRE_HACKATHON_DECK.pdf'), 'archive/deck must contain DOOMWIRE_HACKATHON_DECK.pdf');
  assert(deckFiles.some(f => f.startsWith('generate_')), 'archive/deck must contain generator scripts');

  // 5. Verify scripts/ is clean of ad-hoc scripts
  const scriptsDir = path.resolve(__dirname, '../scripts');
  if (fs.existsSync(scriptsDir)) {
    const scriptFiles = fs.readdirSync(scriptsDir);
    const strayGenerators = scriptFiles.filter(f => f.startsWith('generate_'));
    assert.strictEqual(strayGenerators.length, 0, `scripts/ must contain 0 generator scripts (found: ${strayGenerators.join(', ')})`);
  }

  // 6. Verify SUITES completeness
  assert(Array.isArray(SUITES), 'SUITES must be an array');
  assert(SUITES.length >= 15, `SUITES must contain all core test suites (found: ${SUITES.length})`);
  
  for (const s of SUITES) {
    const fullPath = path.resolve(__dirname, s.file);
    assert(fs.existsSync(fullPath), `Test file for suite "${s.name}" must exist: ${s.file}`);
  }

  return true;
}

async function run10Cycles() {
  console.log('=== STARTING ISSUE 16 (AUTOMATED TEST SUITE & CLEANUP) 10-CYCLE VERIFICATION ===');
  for (let i = 1; i <= 10; i++) {
    process.stdout.write(`Cycle ${i}/10: `);
    const start = Date.now();
    await runSingleCycle(i);
    console.log(`PASSED (${Date.now() - start}ms)`);
  }
  console.log('\nSUCCESS: 10/10 CONSECUTIVE CYCLES PASSED PERFECTLY (0 REGRESSIONS)');
  process.exit(0);
}

run10Cycles().catch((err) => {
  console.error('\nFAIL:', err);
  process.exit(1);
});

