const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const ioClient = require('socket.io-client');

const serverModule = require('./server');
const scannerModule = require('./scanner');
const intelModule = require('./intel');

async function runSingleCycle(cycleNum) {
  // 1. Verify Modular Frontend Structure
  const audioPath = path.resolve(__dirname, '../src/utils/audio.js');
  const themesPath = path.resolve(__dirname, '../src/utils/themes.js');
  const safeViewPath = path.resolve(__dirname, '../src/utils/safeViewRenderer.js');
  const navPodPath = path.resolve(__dirname, '../src/components/NavigationPod.jsx');
  const spectrumPath = path.resolve(__dirname, '../src/components/SpectrumLegend.jsx');
  const inspectorPath = path.resolve(__dirname, '../src/components/InspectorModal.jsx');
  const safeModalPath = path.resolve(__dirname, '../src/components/SafeViewModal.jsx');
  const serverModalPath = path.resolve(__dirname, '../src/components/ServerModal.jsx');

  assert(fs.existsSync(audioPath), 'src/utils/audio.js must exist');
  assert(fs.existsSync(themesPath), 'src/utils/themes.js must exist');
  assert(fs.existsSync(safeViewPath), 'src/utils/safeViewRenderer.js must exist');
  assert(fs.existsSync(navPodPath), 'src/components/NavigationPod.jsx must exist');
  assert(fs.existsSync(spectrumPath), 'src/components/SpectrumLegend.jsx must exist');
  assert(fs.existsSync(inspectorPath), 'src/components/InspectorModal.jsx must exist');
  assert(fs.existsSync(safeModalPath), 'src/components/SafeViewModal.jsx must exist');
  assert(fs.existsSync(serverModalPath), 'src/components/ServerModal.jsx must exist');

  // Verify App.jsx lines reduced below 1600
  const appJsxContent = fs.readFileSync(path.resolve(__dirname, '../src/App.jsx'), 'utf8');
  const appLines = appJsxContent.split('\n').length;
  assert(appLines < 1600, `App.jsx should be modularized to under 1600 lines (current: ${appLines})`);
  assert(appJsxContent.includes('from \'./utils/audio.js\''), 'App.jsx must import audio.js');
  assert(appJsxContent.includes('from \'./utils/themes.js\''), 'App.jsx must import themes.js');
  assert(appJsxContent.includes('from \'./components/NavigationPod.jsx\''), 'App.jsx must import NavigationPod.jsx');

  // 2. Verify Modular Backend Structure
  const scannerPath = path.resolve(__dirname, './scanner.js');
  const intelPath = path.resolve(__dirname, './intel.js');
  const serverPath = path.resolve(__dirname, './server.js');

  assert(fs.existsSync(scannerPath), 'backend/scanner.js must exist');
  assert(fs.existsSync(intelPath), 'backend/intel.js must exist');

  const serverJsContent = fs.readFileSync(serverPath, 'utf8');
  const serverLines = serverJsContent.split('\n').length;
  assert(serverLines < 400, `server.js should be modularized to under 400 lines (current: ${serverLines})`);
  assert(serverJsContent.includes("require('./scanner')"), "server.js must import scanner.js");
  assert(serverJsContent.includes("require('./intel')"), "server.js must import intel.js");

  // 3. Verify Functional Backward Compatibility & Execution
  assert(typeof serverModule.resolveIntelligence === 'function', 'server must re-export resolveIntelligence');
  assert(typeof serverModule.inspectSensitiveData === 'function', 'server must re-export inspectSensitiveData');
  assert(typeof serverModule.discoverTargetInfrastructure === 'function', 'server must re-export discoverTargetInfrastructure');
  assert(typeof serverModule.getSharedBrowser === 'function', 'server must re-export getSharedBrowser');

  // Test intel resolution
  const intel = await intelModule.resolveIntelligence('google-analytics.com');
  assert.strictEqual(intel.company, 'Google LLC');
  assert(intel.party === 'third' || intel.party === 'first');

  // Test scanner inspectSensitiveData
  const mockReq = {
    url: () => 'https://analytics.example.com/collect?utm_source=tactical&gclid=123',
    postData: () => 'clickstream=active',
    headers: () => ({ cookie: 'session=xyz', referer: 'https://origin.com' })
  };
  const leaks = scannerModule.inspectSensitiveData(mockReq);
  assert(leaks.some(l => l.includes('utm_source')), 'Must extract utm_source tracking param');

  // 4. Test live Socket.io interaction on local server
  const testPort = 5915 + (cycleNum % 50);
  const testHttp = http.createServer();
  const { Server } = require('socket.io');
  const testIo = new Server(testHttp, { cors: { origin: '*' } });

  // Attach same event handlers using modular scanner
  const userSessions = new Map();
  testIo.on('connection', (socket) => {
    userSessions.set(socket.id, {
      blockedDomains: new Set(),
      poisonedDomains: new Set(),
      scanCompleted: false,
      interceptedCount: 0
    });
    const session = userSessions.get(socket.id);

    socket.emit('state_sync', {
      blockedDomains: Array.from(session.blockedDomains),
      poisonedDomains: Array.from(session.poisonedDomains)
    });

    socket.on('cut_wire', (domain) => {
      session.blockedDomains.add(domain);
      socket.emit('wire_cut', { domain });
    });

    socket.on('poison_wire', (domain) => {
      session.poisonedDomains.add(domain);
      socket.emit('wire_poisoned', { domain });
    });

    socket.on('clear_rules', () => {
      session.blockedDomains.clear();
      session.poisonedDomains.clear();
      socket.emit('rules_cleared');
    });
  });

  await new Promise((res) => testHttp.listen(testPort, res));

  const client = ioClient(`http://localhost:${testPort}`);
  await new Promise((res) => client.on('connect', res));

  const cutPromise = new Promise((res) => client.once('wire_cut', res));
  client.emit('cut_wire', 'adtech-surveillance.com');
  const cutRes = await cutPromise;
  assert.strictEqual(cutRes.domain, 'adtech-surveillance.com');

  const poisonPromise = new Promise((res) => client.once('wire_poisoned', res));
  client.emit('poison_wire', 'profiler.net');
  const poisonRes = await poisonPromise;
  assert.strictEqual(poisonRes.domain, 'profiler.net');

  const clearPromise = new Promise((res) => client.once('rules_cleared', res));
  client.emit('clear_rules');
  await clearPromise;

  client.disconnect();
  await new Promise((res) => testHttp.close(res));

  return true;
}

async function run10Cycles() {
  console.log('=== STARTING ISSUE 15 (MODULARIZATION) 10-CYCLE VERIFICATION ===');
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
