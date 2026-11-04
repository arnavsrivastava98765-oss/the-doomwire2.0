const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runSingleCycle(cycleNum) {
  const rootDir = path.resolve(__dirname, '..');

  // 1. Verify LICENSE
  const licensePath = path.join(rootDir, 'LICENSE');
  assert(fs.existsSync(licensePath), 'LICENSE file must exist in repository root');
  const licenseContent = fs.readFileSync(licensePath, 'utf8');
  assert(licenseContent.includes('MIT License'), 'LICENSE must be MIT License');
  assert(licenseContent.includes('Copyright (c) 2026 Arnav'), 'LICENSE must include copyright holder Arnav');

  // 2. Verify .gitignore
  const gitignorePath = path.join(rootDir, '.gitignore');
  assert(fs.existsSync(gitignorePath), '.gitignore must exist');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore must ignore .env files');
  assert(gitignoreContent.includes('node_modules/'), '.gitignore must ignore node_modules/');
  assert(gitignoreContent.includes('dist/'), '.gitignore must ignore dist/');

  // 3. Scan for accidental secret leaks in AI tooling and root docs
  const docFiles = [
    'README.md',
    'GEMINI.md',
    'AGENTS.md',
    'DOOMWIRE_JUDGES_GUIDE.md'
  ];

  const SECRET_PATTERNS = [
    /AIza[0-9A-Za-z-_]{35}/, // Google API Key
    /sk-[a-zA-Z0-9]{20,}/,  // OpenAI Key
    /ghp_[a-zA-Z0-9]{20,}/, // GitHub PAT
    /-----BEGIN PRIVATE KEY-----/ // Private Key PEM
  ];

  for (const doc of docFiles) {
    const docPath = path.join(rootDir, doc);
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf8');
      for (const pattern of SECRET_PATTERNS) {
        assert(!pattern.test(content), `Secret pattern ${pattern} matched in ${doc}!`);
      }
    }
  }

  // 4. Ensure no uncommitted .env files exist in root or backend
  assert(!fs.existsSync(path.join(rootDir, '.env')), 'No root .env file should be committed');
  assert(!fs.existsSync(path.join(rootDir, 'backend/.env')), 'No backend/.env file should be committed');

  return true;
}

async function run10Cycles() {
  console.log('=== STARTING ISSUE 18 (LICENSE & REPO HYGIENE) 10-CYCLE VERIFICATION ===');
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

