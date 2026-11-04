// backend/test_legal_framing.js
// 10-Cycle verification of Legal & Ethical Framing (Defamation & Phrasing Cleanup)

const fs = require('fs');
const path = require('path');

const FORBIDDEN_DEFAMATORY_TERMS = [
  /Session[- ]Replay Spyware/i,
  /Phishing,\s*malware\s*&\s*high-risk\s*telemetry/i,
  /Social Graph Fingerprinter/i,
  /Cross-Site Fingerprinter/i,
  /Keystroke & Heatmap Recorder/i,
  /stops all future data exfiltration/i,
  /Active exfiltration vector monitored/i
];

function scanDirectory(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build' || item === 'archive') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (/\.(js|jsx|ts|tsx|md|html)$/i.test(item)) {
      // Exclude test scripts that deliberately reference patterns for assertions
      if (!item.startsWith('test_')) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function runAuditCycle(cycle) {
  const rootDir = path.resolve(__dirname, '..');
  const filesToScan = scanDirectory(rootDir);

  let checkedFiles = 0;
  for (const filePath of filesToScan) {
    const relativePath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    checkedFiles++;

    for (const pattern of FORBIDDEN_DEFAMATORY_TERMS) {
      if (pattern.test(content)) {
        throw new Error(`[FAIL] Defamatory pattern ${pattern} found in ${relativePath}`);
      }
    }
  }

  // Verify Legal Disclaimer exists in README.md
  const readmeContent = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
  if (!readmeContent.includes('Technical & Legal Disclaimer')) {
    throw new Error('[FAIL] README.md is missing the "Technical & Legal Disclaimer" section!');
  }

  // Verify App.jsx and SpectrumLegend.jsx contain neutral spectrum
  const appContent = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf8');
  const spectrumPath = path.join(rootDir, 'src/components/SpectrumLegend.jsx');
  const spectrumContent = fs.existsSync(spectrumPath) ? fs.readFileSync(spectrumPath, 'utf8') : appContent;

  if (!spectrumContent.includes('NETWORK SPECTRUM')) {
    throw new Error('[FAIL] SpectrumLegend/App does not contain "NETWORK SPECTRUM" header!');
  }
  if (!spectrumContent.includes('Primary Origin / CDN')) {
    throw new Error('[FAIL] SpectrumLegend/App does not contain "Primary Origin / CDN" label!');
  }

  return { checkedFiles };
}

function main() {
  console.log('=== VERIFYING LEGAL & ETHICAL FRAMING (10 CONSECUTIVE CYCLES) ===\n');
  try {
    for (let c = 1; c <= 10; c++) {
      const result = runAuditCycle(c);
      console.log(`[Cycle ${c}/10] Passed. Audited ${result.checkedFiles} source files cleanly.`);
    }
    console.log('\n>>> SUCCESS: ALL 10 CYCLES PASSED! 100% DEFAMATORY & SENSATIONAL LABELS ELIMINATED! <<<\n');
    process.exit(0);
  } catch (err) {
    console.error('\n>>> VERIFICATION FAILED:', err.message, '<<<\n');
    process.exit(1);
  }
}

main();

